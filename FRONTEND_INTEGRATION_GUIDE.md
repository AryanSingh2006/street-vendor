# 🚀 Street Vendor Frontend Integration Guide

## 📋 **Backend API Overview**

Your backend is running on: `http://localhost:5000`

### 🔐 **Authentication System**
All authenticated routes require JWT token in HTTP-only cookies.

### 👥 **User Roles**
- **Vendor**: Can browse inventory, add to cart, place orders, track orders
- **Supplier**: Can manage inventory, view received orders, update order status

---

## 🛠️ **API Endpoints Documentation**

### 🔐 **Authentication Routes** (`/api/auth`)

#### 1. User Registration
```javascript
POST /api/auth/signUp
Content-Type: application/json

{
  "fullname": "John Doe",
  "email": "john@example.com", 
  "phone": "1234567890",
  "password": "password123",
  "role": "vendor" // or "supplier"
}

// Response
{
  "message": "User created successfully",
  "user": {
    "id": "userId",
    "fullname": "John Doe",
    "email": "john@example.com",
    "role": "vendor"
  }
}
```

#### 2. User Login
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

// Response - Sets HTTP-only cookie automatically
{
  "message": "Login successful",
  "user": {
    "id": "userId",
    "fullname": "John Doe", 
    "email": "john@example.com",
    "role": "vendor"
  }
}
```

#### 3. User Logout
```javascript
POST /api/auth/logout
// Requires authentication cookie

// Response
{
  "message": "Logout successful"
}
```

---

### 📦 **Inventory Routes** (`/api/inventory`)

#### 1. Get Items by Category (Public)
```javascript
GET /api/inventory/category/electronics
// Automatically excludes out-of-stock items

// Response
{
  "message": "Inventory retrieved successfully",
  "inventory": [
    {
      "_id": "itemId",
      "name": "Smartphone",
      "description": "Latest smartphone",
      "price": 299.99,
      "quantityAvailable": 50,
      "category": "electronics",
      "outOfStock": false,
      "supplier": {
        "_id": "supplierId",
        "fullname": "Tech Supplier",
        "email": "supplier@example.com"
      }
    }
  ]
}
```

#### 2. Add Inventory Item (Suppliers Only)
```javascript
POST /api/inventory/add
Content-Type: application/json
// Requires authentication + supplier role

{
  "name": "Smartphone",
  "description": "Latest model",
  "price": 299.99,
  "quantityAvailable": 100,
  "category": "electronics"
}
```

#### 3. Update Inventory (Suppliers Only)
```javascript
PUT /api/inventory/{inventoryId}
Content-Type: application/json
// Requires authentication + supplier role

{
  "name": "Updated Smartphone",
  "price": 279.99,
  "quantityAvailable": 80
}
```

#### 4. Restock Inventory (Suppliers Only)
```javascript
PUT /api/inventory/restock/{inventoryId}
Content-Type: application/json
// Requires authentication + supplier role

{
  "additionalQuantity": 50
}
```

---

### 🛒 **Cart Routes** (`/api/cart`)

#### 1. Add Item to Cart
```javascript
POST /api/cart/add
Content-Type: application/json
// Requires authentication

{
  "inventoryItemId": "itemId",
  "quantity": 2
}
```

#### 2. Get User's Cart
```javascript
GET /api/cart
// Requires authentication

// Response
{
  "message": "Cart retrieved successfully",
  "cart": {
    "_id": "cartId",
    "user": "userId",
    "items": [
      {
        "_id": "cartItemId",
        "inventoryItem": {
          "_id": "itemId",
          "name": "Smartphone",
          "price": 299.99,
          "category": "electronics"
        },
        "quantity": 2
      }
    ]
  }
}
```

#### 3. Remove Item from Cart
```javascript
DELETE /api/cart/{cartItemId}
// Requires authentication
```

---

### 📋 **Order Routes** (`/api/orders`)

#### 1. Create Order from Cart Item
```javascript
POST /api/orders/create
Content-Type: application/json
// Requires authentication

{
  "inventoryItemId": "itemId",
  "quantity": 2
}

// Response
{
  "message": "Order placed successfully",
  "order": {
    "_id": "orderId",
    "inventoryItem": {...},
    "quantity": 2,
    "totalAmount": 599.98,
    "orderStatus": "placed",
    "paymentStatus": "cash_on_delivery",
    "vendor": {...},
    "supplier": {...},
    "statusHistory": [...]
  }
}
```

#### 2. Get My Orders (Vendors)
```javascript
GET /api/orders/my-orders?status=placed&page=1&limit=10
// Requires authentication

// Response with pagination
{
  "message": "Orders retrieved successfully",
  "orders": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalOrders": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### 3. Get Supplier Orders (Suppliers Only)
```javascript
GET /api/orders/supplier-orders?status=placed&page=1
// Requires authentication + supplier role
```

#### 4. Update Order Status (Suppliers Only)
```javascript
PUT /api/orders/update-status/{orderId}
Content-Type: application/json
// Requires authentication + supplier role

{
  "orderStatus": "accepted", // placed, accepted, processing, on_delivery, delivered, cancelled
  "notes": "Order accepted, will process soon"
}
```

#### 5. Confirm Payment (Suppliers Only)
```javascript
PUT /api/orders/confirm-payment/{orderId}
Content-Type: application/json
// Requires authentication + supplier role

{
  "notes": "Cash payment received successfully"
}
```

#### 6. Get Order History
```javascript
GET /api/orders/history/{orderId}
// Requires authentication (vendor or supplier of the order)

// Response
{
  "message": "Order history retrieved successfully",
  "orderHistory": [
    {
      "status": "placed",
      "updatedBy": {...},
      "timestamp": "2025-01-27T10:00:00Z",
      "notes": "Order placed by vendor"
    },
    {
      "status": "accepted", 
      "updatedBy": {...},
      "timestamp": "2025-01-27T11:00:00Z",
      "notes": "Order accepted by supplier"
    }
  ]
}
```

---

## 🔧 **Order Status Flow**

```
1. PLACED      → Order created by vendor (COD)
2. ACCEPTED    → Supplier accepts the order
3. PROCESSING  → Supplier preparing goods
4. ON_DELIVERY → Goods being delivered
5. DELIVERED   → Goods received by vendor  
6. PAYMENT_DONE → Cash payment confirmed
```

---

## 🚨 **Important Notes for Frontend**

1. **Authentication**: Backend uses HTTP-only cookies, so use `credentials: 'include'` in fetch requests
2. **CORS**: Backend has CORS enabled for frontend communication
3. **Error Handling**: All endpoints return consistent error format with `message` field
4. **Pagination**: Order endpoints support pagination with `page` and `limit` query params
5. **Role-Based Access**: Some endpoints require specific user roles (supplier/vendor)

---

## 📁 **Suggested Frontend Folder Structure**

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ProtectedRoute.jsx
│   ├── inventory/
│   │   ├── InventoryList.jsx
│   │   ├── InventoryItem.jsx
│   │   └── AddInventory.jsx
│   ├── cart/
│   │   ├── Cart.jsx
│   │   └── CartItem.jsx
│   ├── orders/
│   │   ├── OrderList.jsx
│   │   ├── OrderDetails.jsx
│   │   └── OrderStatus.jsx
│   └── common/
│       ├── Header.jsx
│       ├── Navigation.jsx
│       └── Loading.jsx
├── context/
│   ├── AuthContext.jsx
│   ├── CartContext.jsx
│   └── OrderContext.jsx
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── inventoryService.js
│   ├── cartService.js
│   └── orderService.js
├── hooks/
│   ├── useAuth.js
│   ├── useCart.js
│   └── useOrders.js
└── utils/
    ├── constants.js
    └── helpers.js
```

This guide will help your friend build a robust React frontend that integrates seamlessly with your backend! 🚀

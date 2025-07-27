# Street Vendor Marketplace - B2B Wholesale Platform

A comprehensive B2B wholesale marketplace backend connecting street vendors with wholesale suppliers, bridging the gap between vendors and suppliers for raw material procurement.

## 🎯 **Mission**
Connecting street vendors directly with wholesale suppliers to:
- Eliminate middlemen in the supply chain
- Provide competitive wholesale pricing
- Enable bulk purchasing for better margins
- Streamline vendor-supplier relationships
- Support small business growth

---

## 🚀 **Core B2B Features**

### ✅ **Business-Focused Authentication**
- **Street Vendors**: Small business owners, mobile vendors, kiosk operators
- **Wholesale Suppliers**: Distributors, manufacturers, bulk suppliers
- **Business Verification**: GST numbers, business registration
- **Credit Terms Management**: 15-day, 30-day payment terms

### ✅ **Wholesale Product Management**
- **Bulk Pricing**: Per unit, per carton, per kg pricing
- **Minimum Order Quantities (MOQ)**: Wholesale-specific requirements
- **Bulk Discounts**: Tiered pricing based on quantity
- **Packaging Units**: kg, grams, liters, pieces, boxes, cartons
- **Business Categories**: Raw materials, supplies, equipment

### ✅ **Supplier-Controlled Order Workflow**
- **Order Statuses**: placed → confirmed → processing → ready → delivered
- **Supplier Authority**: Only suppliers can update order progress
- **Business Terms**: Payment methods, delivery terms, return policies
- **Invoice Generation**: Tax calculations (CGST, SGST, IGST)

---

## 📁 **Project Structure**
```
backend/
├── src/
│   ├── controller/           # Business logic
│   │   ├── auth.controller.js
│   │   ├── inventory.controller.js
│   │   ├── cart.controller.js
│   │   ├── order.controller.js
│   │   └── search.controller.js
│   ├── model/               # Database schemas
│   │   ├── user.model.js
│   │   ├── inventory.model.js
│   │   ├── cart.model.js
│   │   └── order.model.js
│   ├── routes/              # API endpoints
│   ├── middleware/          # Auth & validation
│   └── config/              # Database config
├── .env                     # Environment variables
└── package.json
```

---

## 🔗 **API Endpoints**

### **Authentication (*/api/auth*)**
```
POST /api/auth/signUp        # Register vendor/supplier
POST /api/auth/login         # Login user
POST /api/auth/logout        # Logout user
```

### **Search & Discovery (*/api/search*)**
```
GET /api/search/products     # Search wholesale products
GET /api/search/trending     # Popular wholesale items
GET /api/search/suggestions  # Search autocomplete
GET /api/search/categories   # Wholesale categories
```

### **Inventory Management (*/api/inventory*)**
```
POST /api/inventory/add           # Add wholesale product (Supplier only)
GET /api/inventory/category/:cat  # Browse by category
PUT /api/inventory/:id           # Update product (Supplier only)
DELETE /api/inventory/:id        # Delete product (Supplier only)
PUT /api/inventory/restock/:id   # Restock product (Supplier only)
```

### **Cart Management (*/api/cart*)**
```
POST /api/cart/add           # Add items to cart
GET /api/cart               # View cart
PUT /api/cart/update/:id    # Update quantities
DELETE /api/cart/remove/:id # Remove items
```

### **Order Management (*/api/orders*)**
```
POST /api/orders/create             # Create order from cart (Vendor)
GET /api/orders/vendor/history      # Vendor's order history
GET /api/orders/supplier/orders     # Supplier's received orders
PUT /api/orders/:id/status          # Update order status (Supplier)
POST /api/orders/:id/confirm-payment # Confirm payment (Supplier)
GET /api/orders/:id                 # Order details
```

---

## 🧪 **Testing with Postman**

### **1. Register Wholesale Supplier**
```http
POST http://localhost:5000/api/auth/signUp
Content-Type: application/json

{
  "fullname": "ABC Wholesale Distributors",
  "email": "supplier@abcwholesale.com",
  "phone": "+919876543210",
  "password": "secure123",
  "role": "supplier",
  "businessInfo": {
    "businessName": "ABC Wholesale Distributors Pvt Ltd",
    "gstNumber": "27AAAAA0000A1Z5",
    "businessType": "wholesale",
    "establishedYear": 2010,
    "businessAddress": {
      "addressLine1": "123 Wholesale Market",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    }
  },
  "supplierDetails": {
    "minimumOrderValue": 5000,
    "deliveryRadius": 50,
    "paymentTerms": "credit_30_days"
  }
}
```

### **2. Add Wholesale Product**
```http
POST http://localhost:5000/api/inventory/add
Content-Type: application/json
Cookie: [JWT from login]

{
  "name": "Premium Basmati Rice",
  "description": "High-quality aged basmati rice for retail",
  "price": 80,
  "quantityAvailable": 500,
  "category": "grains_cereals",
  "subcategory": "rice",
  "brand": "Harvest Gold",
  "images": [
    {"url": "https://example.com/rice.jpg", "alt": "Basmati rice"}
  ],
  "wholesaleInfo": {
    "minimumOrderQuantity": 25,
    "packagingUnit": "kg",
    "unitSize": 25,
    "pricePerUnit": 80,
    "bulkDiscounts": [
      {"minimumQuantity": 100, "discountPercentage": 5},
      {"minimumQuantity": 200, "discountPercentage": 8}
    ]
  },
  "specifications": {
    "origin": "Punjab, India",
    "quality": "premium",
    "shelfLife": "12 months",
    "storageInstructions": "Store in cool, dry place",
    "certifications": ["FSSAI", "ISO"]
  },
  "supplierTerms": {
    "paymentTerms": "credit_30_days",
    "deliveryTime": "next_day",
    "returnPolicy": "7 days return for quality issues",
    "warrantyPeriod": "N/A"
  }
}
```

### **3. Register Street Vendor**
```http
POST http://localhost:5000/api/auth/signUp
Content-Type: application/json

{
  "fullname": "Raj Kumar",
  "email": "raj.vendor@gmail.com",
  "phone": "+919123456789",
  "password": "vendor123",
  "role": "vendor",
  "businessInfo": {
    "businessName": "Raj's Street Food Corner",
    "businessType": "retail"
  },
  "vendorDetails": {
    "stallLocation": "Station Road, Mumbai",
    "vendorType": "street_vendor",
    "dailyRequirement": "Rice: 50kg, Oil: 20L, Spices: 5kg"
  }
}
```

### **4. Search Wholesale Products**
```http
GET http://localhost:5000/api/search/products?category=grains_cereals&minPrice=50&maxPrice=100&sortBy=price_low
```

### **5. Create Wholesale Order**
```http
POST http://localhost:5000/api/orders/create
Content-Type: application/json
Cookie: [Vendor JWT]

{
  "orderType": "delivery",
  "deliveryAddress": {
    "addressLine1": "Raj's Food Stall, Station Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400002",
    "contactPerson": "Raj Kumar",
    "contactPhone": "+919123456789"
  },
  "vendorNotes": "Please deliver in morning hours (8-10 AM)"
}
```

### **6. Supplier Updates Order Status**
```http
PUT http://localhost:5000/api/orders/ORDER_ID/status
Content-Type: application/json
Cookie: [Supplier JWT]

{
  "status": "confirmed",
  "supplierNotes": "Order confirmed. Will be ready by tomorrow 2 PM",
  "expectedDate": "2025-07-28T14:00:00.000Z"
}
```

---

## 🏗️ **Enhanced Data Models**

### **User Model** (B2B focused)
```javascript
{
  fullname: String,
  email: String,
  phone: String,
  password: String,
  role: ["vendor", "supplier"],
  
  businessInfo: {
    businessName: String,
    gstNumber: String,
    businessType: ["wholesale", "retail", "distributor", "manufacturer"],
    establishedYear: Number,
    businessAddress: AddressSchema
  },
  
  supplierDetails: {
    minimumOrderValue: Number,
    deliveryRadius: Number,
    paymentTerms: ["cash_on_delivery", "advance_payment", "credit_30_days", "credit_15_days"],
    isVerified: Boolean
  },
  
  vendorDetails: {
    stallLocation: String,
    vendorType: ["street_vendor", "small_shop", "kiosk", "mobile_vendor"],
    dailyRequirement: String
  }
}
```

### **Wholesale Inventory Model**
```javascript
{
  name: String,
  description: String,
  price: Number,
  quantityAvailable: Number,
  category: [15 wholesale categories],
  subcategory: String,
  brand: String,
  images: [ImageSchema],
  
  wholesaleInfo: {
    minimumOrderQuantity: Number,
    packagingUnit: ["kg", "grams", "liters", "pieces", "boxes", "cartons"],
    unitSize: Number,
    pricePerUnit: Number,
    bulkDiscounts: [{ minimumQuantity, discountPercentage }]
  },
  
  specifications: {
    origin: String,
    quality: ["premium", "standard", "economy", "organic"],
    shelfLife: String,
    storageInstructions: String,
    certifications: [String]
  },
  
  supplierTerms: {
    paymentTerms: String,
    deliveryTime: ["same_day", "next_day", "2-3_days", "weekly"],
    returnPolicy: String,
    warrantyPeriod: String
  }
}
```

### **B2B Order Model**
```javascript
{
  vendor: ObjectId,
  supplier: ObjectId,
  items: [OrderItemSchema],
  orderStatus: ["placed", "pending", "confirmed", "processing", "ready", "delivered", "cancelled", "rejected"],
  paymentStatus: ["pending", "paid", "cash_on_delivery", "credit"],
  orderType: ["pickup", "delivery"],
  deliveryAddress: AddressSchema,
  vendorNotes: String,
  supplierNotes: String,
  expectedDate: Date,
  actualCompletionDate: Date,
  subtotal: Number,
  tax: { cgst, sgst, igst },
  discount: { amount, percentage, reason },
  deliveryCharges: Number,
  totalAmount: Number,
  statusHistory: [StatusHistorySchema]
}
```

---

## 🎯 **Wholesale Categories**

```javascript
const wholesaleCategories = [
  'vegetables',           // Fresh vegetables
  'fruits',              // Fresh fruits  
  'grains_cereals',      // Rice, wheat, cereals
  'spices_seasoning',    // Spices, masalas
  'dairy_products',      // Milk, paneer, butter
  'meat_poultry',        // Chicken, mutton
  'seafood',             // Fish, prawns
  'oils_fats',           // Cooking oils
  'beverages',           // Tea, coffee, drinks
  'snacks_confectionery', // Namkeen, sweets
  'bakery_items',        // Bread, biscuits
  'canned_preserved',    // Canned goods
  'cleaning_supplies',   // Detergents, soaps
  'packaging_materials', // Containers, bags
  'kitchen_equipment'    // Utensils, equipment
];
```

---

## 🔧 **Order Status Flow (Supplier Controlled)**

```
Vendor Places Order → placed
           ↓
Supplier Reviews → confirmed/rejected  
           ↓
Supplier Prepares → processing
           ↓
Order Ready → ready
           ↓
Vendor Picks Up/Receives → delivered
           ↓
Payment Confirmed → paid
```

**Key Points:**
- Only **suppliers can update** order status
- Vendors can **cancel** orders before confirmation
- **Automatic inventory management** with stock reservation
- **Tax calculations** for business invoicing
- **Payment terms** support (COD, Credit, Advance)

---

## 🚀 **Start Development**

```bash
cd backend
npm install
npm start
```

Server runs on: **http://localhost:5000**

---

## 🎉 **Perfect for B2B Wholesale Marketplace!**

Your backend now supports all essential wholesale marketplace features:
- ✅ **Business-focused user management**
- ✅ **Wholesale product catalog** with MOQ and bulk pricing
- ✅ **Supplier-controlled order workflow**
- ✅ **Business invoice generation** with tax calculation
- ✅ **Payment terms management**
- ✅ **Advanced wholesale search**
- ✅ **Vendor-supplier relationship management**
- ✅ **Bulk discount system**

Perfect foundation for connecting street vendors with wholesale suppliers! 🏪📦
import orderModel from '../model/order.model.js';
import inventoryModel from '../model/inventory.model.js';
import cartModel from '../model/cart.model.js';

// Create order from cart (B2B wholesale order)
export const createOrder = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { 
      deliveryAddress, 
      orderType = 'pickup', 
      paymentMethod = 'cash_on_delivery',
      vendorNotes
    } = req.body;

    // Get vendor's cart
    const cart = await cartModel.findOne({ user: vendorId }).populate({
      path: 'items.inventoryItem',
      populate: {
        path: 'supplier',
        select: 'fullname phone businessInfo'
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Group cart items by supplier to create separate orders
    const ordersBySupplier = {};
    let totalOrderValue = 0;

    for (const cartItem of cart.items) {
      const supplierId = cartItem.inventoryItem.supplier._id.toString();
      
      if (!ordersBySupplier[supplierId]) {
        ordersBySupplier[supplierId] = {
          supplier: cartItem.inventoryItem.supplier,
          items: [],
          subtotal: 0
        };
      }

      const itemTotal = cartItem.inventoryItem.price * cartItem.quantity;
      ordersBySupplier[supplierId].items.push({
        inventoryItem: cartItem.inventoryItem._id,
        name: cartItem.inventoryItem.name,
        quantity: cartItem.quantity,
        unitPrice: cartItem.inventoryItem.price,
        totalPrice: itemTotal
      });
      ordersBySupplier[supplierId].subtotal += itemTotal;
      totalOrderValue += itemTotal;
    }

    const createdOrders = [];

    // Create separate orders for each supplier
    for (const [supplierId, orderData] of Object.entries(ordersBySupplier)) {
      // Calculate taxes (customizable based on business needs)
      const cgst = orderData.subtotal * 0.09; // 9%
      const sgst = orderData.subtotal * 0.09; // 9%
      const totalAmount = orderData.subtotal + cgst + sgst;

      const newOrder = new orderModel({
        vendor: vendorId,
        supplier: supplierId,
        items: orderData.items,
        orderType,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
        vendorNotes,
        subtotal: orderData.subtotal,
        tax: { cgst, sgst },
        totalAmount,
        paymentStatus: paymentMethod === 'cash_on_delivery' ? 'cash_on_delivery' : 'pending',
        statusHistory: [{
          status: 'placed',
          timestamp: new Date(),
          updatedBy: vendorId,
          note: 'Order placed by vendor'
        }]
      });

      // Check inventory availability and update stock
      for (const item of orderData.items) {
        const inventoryItem = await inventoryModel.findById(item.inventoryItem);
        
        if (item.quantity > inventoryItem.quantityAvailable) {
          return res.status(400).json({
            message: `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.quantityAvailable}, Requested: ${item.quantity}`
          });
        }

        // Reserve stock (reduce available quantity)
        inventoryItem.quantityAvailable -= item.quantity;
        
        // Mark as out of stock if quantity reaches zero
        if (inventoryItem.quantityAvailable === 0) {
          inventoryItem.outOfStock = true;
        }
        
        await inventoryItem.save();
      }

      await newOrder.save();
      createdOrders.push(newOrder);
    }

    // Clear the cart after successful order creation
    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: `Successfully created ${createdOrders.length} order(s)`,
      data: {
        orders: createdOrders,
        totalValue: totalOrderValue
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to create order",
      error: error.message
    });
  }
};

// Update order status (Supplier controlled)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, supplierNotes, expectedDate } = req.body;
    const userId = req.user.id;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only supplier can update order status (except for cancellation by vendor)
    if (order.supplier.toString() !== userId && status !== 'cancelled') {
      return res.status(403).json({ 
        message: 'Only the supplier can update order status' 
      });
    }

    // Validate status transitions
    const validTransitions = {
      'placed': ['confirmed', 'rejected'],
      'pending': ['confirmed', 'rejected'], 
      'confirmed': ['processing'],
      'processing': ['ready'],
      'ready': ['delivered'],
      'delivered': [], // Final state
      'cancelled': [], // Final state
      'rejected': []   // Final state
    };

    if (!validTransitions[order.orderStatus].includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${order.orderStatus} to ${status}`
      });
    }

    // Update order
    order.orderStatus = status;
    if (supplierNotes) order.supplierNotes = supplierNotes;
    if (expectedDate) order.expectedDate = new Date(expectedDate);
    
    if (status === 'delivered') {
      order.actualCompletionDate = new Date();
    }

    // Add to status history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: userId,
      note: supplierNotes || `Status updated to ${status}`
    });

    await order.save();

    // If order is rejected or cancelled, restore inventory
    if (status === 'rejected' || status === 'cancelled') {
      for (const item of order.items) {
        const inventoryItem = await inventoryModel.findById(item.inventoryItem);
        inventoryItem.quantityAvailable += item.quantity;
        inventoryItem.outOfStock = false;
        await inventoryItem.save();
      }
    }

    res.status(200).json({
      message: `Order status updated to ${status}`,
      data: order
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Get order history for vendor
export const getVendorOrderHistory = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let filter = { vendor: vendorId };
    if (status) filter.orderStatus = status;

    const skip = (page - 1) * limit;

    const orders = await orderModel.find(filter)
      .populate('supplier', 'fullname phone businessInfo')
      .populate('items.inventoryItem', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await orderModel.countDocuments(filter);

    res.status(200).json({
      message: 'Vendor order history',
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: page < Math.ceil(totalOrders / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to get order history',
      error: error.message
    });
  }
};

// Get orders for supplier to manage
export const getSupplierOrders = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let filter = { supplier: supplierId };
    if (status) filter.orderStatus = status;

    const skip = (page - 1) * limit;

    const orders = await orderModel.find(filter)
      .populate('vendor', 'fullname phone businessInfo')
      .populate('items.inventoryItem', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await orderModel.countDocuments(filter);

    // Get order counts by status for dashboard
    const statusCounts = await orderModel.aggregate([
      { $match: { supplier: supplierId } },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      message: 'Supplier orders',
      data: {
        orders,
        statusCounts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: page < Math.ceil(totalOrders / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to get supplier orders',
      error: error.message
    });
  }
};

// Get single order details
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await orderModel.findById(orderId)
      .populate('vendor', 'fullname phone businessInfo')
      .populate('supplier', 'fullname phone businessInfo')
      .populate('items.inventoryItem', 'name category brand');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user has access to this order
    if (order.vendor.toString() !== userId && order.supplier.toString() !== userId) {
      return res.status(403).json({ 
        message: 'You do not have access to this order' 
      });
    }

    res.status(200).json({
      message: 'Order details',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to get order details',
      error: error.message
    });
  }
};

// Confirm payment (for COD orders)
export const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod = 'cash_on_delivery' } = req.body;
    const userId = req.user.id;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only supplier can confirm payment
    if (order.supplier.toString() !== userId) {
      return res.status(403).json({ 
        message: 'Only supplier can confirm payment' 
      });
    }

    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({
        message: 'Payment can only be confirmed for delivered orders'
      });
    }

    order.paymentStatus = 'paid';
    order.statusHistory.push({
      status: 'payment_confirmed',
      timestamp: new Date(),
      updatedBy: userId,
      note: `Payment confirmed via ${paymentMethod}`
    });

    await order.save();

    res.status(200).json({
      message: 'Payment confirmed successfully',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
};

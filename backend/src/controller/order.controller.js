import orderModel from '../model/order.model.js';
import inventoryModel from '../model/inventory.model.js';
import cartModel from '../model/cart.model.js';
import ApiResponse from "../utils/APIResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";

// Create order from cart (B2B wholesale order)
export const createOrder = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const {
    deliveryAddress,
    orderType = 'pickup',
    paymentMethod = 'cash_on_delivery',
    vendorNotes
  } = req.body;

  const cart = await cartModel.findOne({ user: vendorId }).populate({
    path: 'items.inventoryItem',
    populate: {
      path: 'supplier',
      select: 'fullname phone businessInfo'
    }
  });

  if (!cart || cart.items.length === 0) {
    throw new apiError(400, "Cart is empty");
  }

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

  for (const [supplierId, orderData] of Object.entries(ordersBySupplier)) {
    const cgst = orderData.subtotal * 0.09;
    const sgst = orderData.subtotal * 0.09;
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
      statusHistory: [
        {
          status: 'placed',
          timestamp: new Date(),
          updatedBy: vendorId,
          note: 'Order placed by vendor'
        }
      ]
    });

    for (const item of orderData.items) {
      const inventoryItem = await inventoryModel.findById(item.inventoryItem);

      if (item.quantity > inventoryItem.quantityAvailable) {
        throw new apiError(
          400,
          `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.quantityAvailable}, Requested: ${item.quantity}`
        );
      }

      inventoryItem.quantityAvailable -= item.quantity;

      if (inventoryItem.quantityAvailable === 0) {
        inventoryItem.outOfStock = true;
      }

      await inventoryItem.save();
    }

    await newOrder.save();
    createdOrders.push(newOrder);
  }

  cart.items = [];
  await cart.save();

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        orders: createdOrders,
        totalValue: totalOrderValue
      },
      `Successfully created ${createdOrders.length} order(s)`
    )
  );
});

// Update order status (Supplier controlled)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, supplierNotes, expectedDate } = req.body;
  const userId = req.user.id;

  const order = await orderModel.findById(orderId);
  if (!order) {
    throw new apiError(404, "Order not found");
  }

  // Only supplier can update status (except 'cancelled' by vendor)
  if (order.supplier.toString() !== userId && status !== "cancelled") {
    throw new apiError(403, "Only the supplier can update order status");
  }

  const validTransitions = {
    placed: ["confirmed", "rejected"],
    pending: ["confirmed", "rejected"],
    confirmed: ["processing"],
    processing: ["ready"],
    ready: ["delivered"],
    delivered: [],
    cancelled: [],
    rejected: []
  };

  if (!validTransitions[order.orderStatus]?.includes(status)) {
    throw new apiError(400, `Cannot change status from ${order.orderStatus} to ${status}`);
  }

  order.orderStatus = status;
  if (supplierNotes) order.supplierNotes = supplierNotes;
  if (expectedDate) order.expectedDate = new Date(expectedDate);
  if (status === "delivered") order.actualCompletionDate = new Date();

  order.statusHistory.push({
    status,
    timestamp: new Date(),
    updatedBy: userId,
    note: supplierNotes || `Status updated to ${status}`
  });

  await order.save();

  if (["rejected", "cancelled"].includes(status)) {
    for (const item of order.items) {
      const inventoryItem = await inventoryModel.findById(item.inventoryItem);
      inventoryItem.quantityAvailable += item.quantity;
      inventoryItem.outOfStock = false;
      await inventoryItem.save();
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, `Order status updated to ${status}`));
});


// Get order history for vendor
export const getVendorOrderHistory = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  const filter = { vendor: vendorId };
  if (status) filter.orderStatus = status;

  const skip = (page - 1) * limit;

  const orders = await orderModel.find(filter)
    .populate("supplier", "fullname phone businessInfo")
    .populate("items.inventoryItem", "name category")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalOrders = await orderModel.countDocuments(filter);
  const totalPages = Math.ceil(totalOrders / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, "Vendor order history")
  );
});

export const getSupplierOrders = asyncHandler(async (req, res) => {
  const supplierId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  const filter = { supplier: supplierId };
  if (status) filter.orderStatus = status;

  const skip = (page - 1) * limit;

  const orders = await orderModel.find(filter)
    .populate("vendor", "fullname phone businessInfo")
    .populate("items.inventoryItem", "name category")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalOrders = await orderModel.countDocuments(filter);
  const totalPages = Math.ceil(totalOrders / limit);

  const statusCounts = await orderModel.aggregate([
    { $match: { supplier: supplierId } },
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      orders,
      statusCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, "Supplier orders")
  );
});

// Get single order details
export const getOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await orderModel.findById(orderId)
    .populate("vendor", "fullname phone businessInfo")
    .populate("supplier", "fullname phone businessInfo")
    .populate("items.inventoryItem", "name category brand");

  if (!order) {
    throw new apiError(404, "Order not found");
  }

  // Check if user has access to this order
  if (
    order.vendor.toString() !== userId &&
    order.supplier.toString() !== userId
  ) {
    throw new apiError(403, "You do not have access to this order");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order details"));
});

// Confirm payment (for COD orders)
export const confirmPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { paymentMethod = "cash_on_delivery" } = req.body;
  const userId = req.user.id;

  const order = await orderModel.findById(orderId);
  if (!order) {
    throw new apiError(404, "Order not found");
  }

  // Only supplier can confirm payment
  if (order.supplier.toString() !== userId) {
    throw new apiError(403, "Only supplier can confirm payment");
  }

  if (order.orderStatus !== "delivered") {
    throw new apiError(400, "Payment can only be confirmed for delivered orders");
  }

  order.paymentStatus = "paid";
  order.statusHistory.push({
    status: "payment_confirmed",
    timestamp: new Date(),
    updatedBy: userId,
    note: `Payment confirmed via ${paymentMethod}`
  });

  await order.save();

  return res.status(200).json(
    new ApiResponse(200, order, "Payment confirmed successfully")
  );
});
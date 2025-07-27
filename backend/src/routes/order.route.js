import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createOrder,
  updateOrderStatus,
  getVendorOrderHistory,
  getSupplierOrders,
  getOrderDetails,
  confirmPayment
} from "../controller/order.controller.js";
import { isVendor } from "../middleware/isVendor.middleware.js";
import { isSupplier } from "../middleware/isSupplier.middleware.js";

const router = express.Router();

// Vendor routes
router.post("/create", authMiddleware, isVendor, createOrder);
router.get("/vendor/history", authMiddleware, isVendor, getVendorOrderHistory);

// Supplier routes  
router.get("/supplier/orders", authMiddleware, isSupplier, getSupplierOrders);
router.put("/:orderId/status", authMiddleware, isSupplier, updateOrderStatus);
router.post("/:orderId/confirm-payment", authMiddleware, isSupplier, confirmPayment);

// Shared routes (both vendor and supplier can access)
router.get("/:orderId", authMiddleware, getOrderDetails);

export default router;

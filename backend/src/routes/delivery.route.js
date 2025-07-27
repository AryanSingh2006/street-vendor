import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  assignDelivery,
  updateDeliveryStatus,
  getDeliveryDetails,
  trackDelivery,
  getPartnerDeliveries
} from "../controller/delivery.controller.js";

const router = express.Router();

// Admin/Manager routes
router.post("/assign", authMiddleware, assignDelivery);
router.get("/details/:deliveryId", authMiddleware, getDeliveryDetails);

// Delivery partner routes
router.put("/status/:deliveryId", authMiddleware, updateDeliveryStatus);
router.get("/partner/deliveries", authMiddleware, getPartnerDeliveries);

// Customer tracking route
router.get("/track/:orderId", trackDelivery);

export default router;

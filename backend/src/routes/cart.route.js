import express from "express";
import {
  addToCart,
  removeFromCart,
  getCart,
} from "../controller/cart.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/add", authMiddleware, addToCart);
router.get("/", authMiddleware, getCart);
router.delete("/:itemId", authMiddleware, removeFromCart);

export default router;

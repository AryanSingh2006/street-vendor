import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  addInventory,
  getInventoryByCategory,
  updateInventory,
  deleteInventory
} from "../controller/inventory.controller.js";
import { isSupplier } from "../middleware/isSupplier.middleware.js";

const router = express.Router();

router.post("/add", authMiddleware, isSupplier, addInventory);
router.get('/category/:category', getInventoryByCategory);
router.put("/:inventoryId", authMiddleware, isSupplier, updateInventory);
router.delete("/:inventoryId", authMiddleware, isSupplier, deleteInventory);

export default router;

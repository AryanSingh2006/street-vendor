import express from "express";
import {
  searchProducts,
  getTrendingProducts,
  getSearchSuggestions,
  getCategories
} from "../controller/search.controller.js";

const router = express.Router();

// Search and discovery routes
router.get("/products", searchProducts);
router.get("/trending", getTrendingProducts);
router.get("/suggestions", getSearchSuggestions);
router.get("/categories", getCategories);

export default router;

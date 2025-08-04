import inventoryModel from "../model/inventory.model.js";
import ApiResponse from "../utils/APIResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";

// Search wholesale products with B2B filters
export const searchProducts = asyncHandler(async (req, res) => {
  const {
    q, // search query
    category,
    subcategory,
    brand,
    minPrice,
    maxPrice,
    sortBy = 'relevance', // relevance, price_low, price_high, rating, newest
    page = 1,
    limit = 20,
    minOrderQty, // Minimum order quantity filter for wholesale
    tags
  } = req.query;

  let filter = { outOfStock: false };

  // Text search
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { brand: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } }
    ];
  }

  if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;
  if (brand) filter.brand = brand;

  if (minOrderQty) {
    filter['wholesaleInfo.minimumOrderQuantity'] = { $lte: parseInt(minOrderQty) };
  }

  if (tags) {
    const tagArray = tags.split(',');
    filter.tags = { $in: tagArray };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  let sortOptions = {};
  switch (sortBy) {
    case 'price_low':
      sortOptions = { price: 1 };
      break;
    case 'price_high':
      sortOptions = { price: -1 };
      break;
    case 'rating':
      sortOptions = { 'rating.average': -1 };
      break;
    case 'newest':
      sortOptions = { createdAt: -1 };
      break;
    default:
      sortOptions = { _id: 1 }; // Default relevance
  }

  const skip = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    inventoryModel.find(filter)
      .populate('supplier', 'fullname')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit)),
    inventoryModel.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      },
      filters: {
        query: q,
        category,
        subcategory,
        brand,
        priceRange: { min: minPrice, max: maxPrice },
        minOrderQty,
        sortBy
      }
    }, "Wholesale product search results")
  );
});

export const getTrendingProducts = asyncHandler(async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;

    let filter = { outOfStock: false };
    if (category) filter.category = category;

    const products = await inventoryModel.find(filter)
      .populate('supplier', 'fullname businessInfo.businessName')
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(parseInt(limit));

    return res
      .status(200)
      .json(new ApiResponse(200, products, "Trending wholesale products"));
  } catch (error) {
    throw new apiError(500, "Failed to get trending products");
  }
});

// Get product suggestions/autocomplete
export const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(200).json(new ApiResponse(200, [], "Search suggestions"));
  }

  const productSuggestions = await inventoryModel.distinct('name', {
    name: { $regex: q, $options: 'i' },
    outOfStock: false
  }).limit(5);

  const brandSuggestions = await inventoryModel.distinct('brand', {
    brand: { $regex: q, $options: 'i' },
    outOfStock: false
  }).limit(3);

  const categorySuggestions = await inventoryModel.distinct('category', {
    category: { $regex: q, $options: 'i' }
  }).limit(3);

  return res.status(200).json(
    new ApiResponse(200, {
      products: productSuggestions,
      brands: brandSuggestions,
      categories: categorySuggestions
    }, "Search suggestions")
  );
});

// Get all wholesale categories with subcategories
export const getCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await inventoryModel.aggregate([
      {
        $group: {
          _id: "$category",
          subcategories: { $addToSet: "$subcategory" },
          productCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, categories, "Wholesale product categories"));
  } catch (error) {
    throw new apiError(500, "Failed to get categories");
  }
});

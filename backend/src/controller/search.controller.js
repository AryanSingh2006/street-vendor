import inventoryModel from "../model/inventory.model.js";

// Search wholesale products with B2B filters
export const searchProducts = async (req, res) => {
  try {
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

    // Build search filter
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

    // Category filters
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (brand) filter.brand = brand;
    
    // Wholesale-specific filters
    if (minOrderQty) {
      filter['wholesaleInfo.minimumOrderQuantity'] = { $lte: parseInt(minOrderQty) };
    }
    
    // Tags filter
    if (tags) {
      const tagArray = tags.split(',');
      filter.tags = { $in: tagArray };
    }

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort options
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

    // Execute search with pagination
    const skip = (page - 1) * limit;
    
    const [products, totalCount] = await Promise.all([
      inventoryModel.find(filter)
        .populate('supplier', 'fullname')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      inventoryModel.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      message: "Wholesale product search results",
      data: {
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
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Search failed",
      error: error.message
    });
  }
};

// Get trending/popular wholesale products
export const getTrendingProducts = async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;

    let filter = { outOfStock: false };
    if (category) filter.category = category;

    const products = await inventoryModel.find(filter)
      .populate('supplier', 'fullname businessInfo.businessName')
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      message: "Trending wholesale products",
      data: products
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get trending products",
      error: error.message
    });
  }
};

// Get product suggestions/autocomplete
export const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        message: "Search suggestions",
        data: []
      });
    }

    // Get product name suggestions
    const productSuggestions = await inventoryModel.distinct('name', {
      name: { $regex: q, $options: 'i' },
      outOfStock: false
    }).limit(5);

    // Get brand suggestions
    const brandSuggestions = await inventoryModel.distinct('brand', {
      brand: { $regex: q, $options: 'i' },
      outOfStock: false
    }).limit(3);

    // Get category suggestions
    const categorySuggestions = await inventoryModel.distinct('category', {
      category: { $regex: q, $options: 'i' }
    }).limit(3);

    res.status(200).json({
      message: "Search suggestions",
      data: {
        products: productSuggestions,
        brands: brandSuggestions,
        categories: categorySuggestions
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get suggestions",
      error: error.message
    });
  }
};

// Get all wholesale categories with subcategories
export const getCategories = async (req, res) => {
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

    res.status(200).json({
      message: "Wholesale product categories",
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get categories",
      error: error.message
    });
  }
};

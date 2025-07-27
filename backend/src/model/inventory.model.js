import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantityAvailable: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'vegetables', 'fruits', 'grains_cereals', 'spices_seasoning', 
        'dairy_products', 'meat_poultry', 'seafood', 'oils_fats',
        'beverages', 'snacks_confectionery', 'bakery_items', 'canned_preserved',
        'cleaning_supplies', 'packaging_materials', 'kitchen_equipment'
      ]
    },
    
    // Enhanced product details for wholesale marketplace
    subcategory: {
      type: String,
      required: true
    },
    
    brand: {
      type: String,
      required: true
    },
    
    images: [{
      url: { type: String, required: true },
      alt: { type: String }
    }],
    
    // Wholesale specific details
    wholesaleInfo: {
      minimumOrderQuantity: { type: Number, required: true, default: 1 },
      packagingUnit: { 
        type: String, 
        required: true, 
        enum: ["kg", "grams", "liters", "pieces", "boxes", "bags", "cartons"]
      },
      unitSize: { type: Number, required: true }, // e.g., 25 for 25kg bags
      pricePerUnit: { type: Number, required: true },
      bulkDiscounts: [{
        minimumQuantity: { type: Number },
        discountPercentage: { type: Number }
      }]
    },
    
    // Product specifications
    specifications: {
      origin: { type: String }, // "Local", "Imported", specific region
      quality: { 
        type: String, 
        enum: ["premium", "standard", "economy", "organic"] 
      },
      shelfLife: { type: String }, // "30 days", "6 months", etc.
      storageInstructions: { type: String },
      certifications: [String] // ["ISO", "FSSAI", "Organic", etc.]
    },
    
    // Supplier terms
    supplierTerms: {
      paymentTerms: { 
        type: String, 
        enum: ["cash_on_delivery", "advance_payment", "credit_15_days", "credit_30_days"],
        default: "cash_on_delivery"
      },
      deliveryTime: { 
        type: String,
        enum: ["same_day", "next_day", "2-3_days", "weekly"],
        default: "next_day"
      },
      returnPolicy: { type: String },
      warrantyPeriod: { type: String }
    },
    
    // Inventory management
    currentStock: {
      type: Number,
      required: true,
      min: 0
    },
    
    reorderLevel: {
      type: Number,
      default: 10
    },
    
    lastRestocked: {
      type: Date,
      default: Date.now
    },
    
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    outOfStock: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory

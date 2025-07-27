import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  phone: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["vendor", "supplier"],
    required: true,
  },

  // Business information for B2B marketplace
  businessInfo: {
    businessName: { type: String },
    gstNumber: { type: String },
    businessType: { 
      type: String, 
      enum: ["wholesale", "retail", "distributor", "manufacturer"]
    },
    establishedYear: { type: Number },
    businessAddress: {
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String }
    }
  },

  // Supplier specific fields
  supplierDetails: {
    minimumOrderValue: { type: Number, default: 0 },
    deliveryRadius: { type: Number, default: 50 }, // km
    paymentTerms: { 
      type: String, 
      enum: ["cash_on_delivery", "advance_payment", "credit_30_days", "credit_15_days"],
      default: "cash_on_delivery"
    },
    isVerified: { type: Boolean, default: false }
  },

  // Vendor specific fields  
  vendorDetails: {
    stallLocation: { type: String },
    vendorType: { 
      type: String, 
      enum: ["street_vendor", "small_shop", "kiosk", "mobile_vendor"]
    },
    dailyRequirement: { type: String } // estimated daily purchase volume
  },

  isActive: {
    type: Boolean,
    default: true
  },

  isVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);

export default User;

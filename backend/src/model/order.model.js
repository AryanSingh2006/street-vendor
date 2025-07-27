import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderStatus: {
    type: String,
    enum: [
      'placed',        // Order placed by vendor
      'pending',       // Waiting for supplier confirmation
      'confirmed',     // Supplier confirmed the order
      'processing',    // Supplier is preparing the order
      'ready',         // Order ready for pickup/delivery
      'delivered',     // Order completed
      'cancelled',     // Order cancelled
      'rejected'       // Supplier rejected the order
    ],
    default: 'placed'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'cash_on_delivery', 'credit'],
    default: 'pending'
  },
  
  // B2B specific order details
  orderType: {
    type: String,
    enum: ['pickup', 'delivery'],
    default: 'pickup'
  },
  
  deliveryAddress: {
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    contactPerson: { type: String },
    contactPhone: { type: String }
  },
  
  // Supplier notes and vendor requirements
  vendorNotes: {
    type: String // Special requirements from vendor
  },
  
  supplierNotes: {
    type: String // Notes from supplier about the order
  },
  
  // Expected delivery/pickup date set by supplier
  expectedDate: {
    type: Date
  },
  
  actualCompletionDate: {
    type: Date
  },
  
  // Pricing breakdown for B2B
  subtotal: {
    type: Number,
    required: true
  },
  
  tax: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 }
  },
  
  discount: {
    amount: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    reason: { type: String } // "Bulk discount", "First time customer", etc.
  },
  
  deliveryCharges: {
    type: Number,
    default: 0
  },
  
  totalAmount: {
    type: Number,
    required: true
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String
    }
  }]
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);

import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    customerAddress: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      }
    },
    
    pickupAddress: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      }
    },
    
    status: {
      type: String,
      enum: [
        'assigned',
        'partner_confirmed',
        'picked_up',
        'on_the_way',
        'delivered',
        'failed',
        'cancelled'
      ],
      default: 'assigned'
    },
    
    estimatedDeliveryTime: {
      type: Date,
      required: true
    },
    
    actualDeliveryTime: {
      type: Date
    },
    
    deliveryInstructions: {
      type: String
    },
    
    // Live tracking
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      lastUpdated: { type: Date, default: Date.now }
    },
    
    deliveryFee: {
      type: Number,
      required: true,
      default: 0
    },
    
    distanceKm: {
      type: Number
    },
    
    // Delivery proof
    deliveryProof: {
      image: String,
      signature: String,
      otp: String
    },
    
    // Timeline tracking
    timeline: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      location: {
        latitude: Number,
        longitude: Number
      },
      note: String
    }]
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
deliverySchema.index({ orderId: 1 });
deliverySchema.index({ deliveryPartner: 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ "currentLocation.latitude": 1, "currentLocation.longitude": 1 });

const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery;

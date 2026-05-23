const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: String,
  timestamp: { type: Date, default: Date.now },
  note: String,
  location: { lat: Number, lng: Number, address: String },
});

const shipmentSchema = new mongoose.Schema({
  trackingId: { type: String, unique: true, sparse: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending','assigned','picked_up','in_transit','out_for_delivery','delivered','failed','returned'],
    default: 'pending',
  },
  priority: { type: String, enum: ['standard','express','urgent'], default: 'standard' },
  pickup: {
    address: { type: String, required: true },
    city: String,
    lat: Number,
    lng: Number,
    contactName: String,
    contactPhone: String,
  },
  delivery: {
    address: { type: String, required: true },
    city: String,
    lat: Number,
    lng: Number,
    contactName: String,
    contactPhone: String,
    instructions: String,
  },
  scheduledDate: { type: Date },
  estimatedDelivery: { type: Date },
  deliveredAt: { type: Date },
  packageDetails: {
    weight: Number,
    dimensions: String,
    description: String,
    fragile: { type: Boolean, default: false },
  },
  statusHistory: [statusHistorySchema],
  currentLocation: { lat: Number, lng: Number, address: String },
  failureReason: String,
  deliveryProof: String,
  isRescheduled: { type: Boolean, default: false },
  rescheduledFrom: Date,
  fuelCost: { type: Number, default: 0 },
  distance: { type: Number, default: 0 },
  deliveryTime: Number,
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);

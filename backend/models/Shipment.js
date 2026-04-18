const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
    status: String,
    note: String,
    location: {
        lat: Number,
        lng: Number,
        address: String
    },
});

const shipmentSchema = new mongoose.Schema({
    trackingId: { type: String, unique: true, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'],
        default: 'pending',
    },
    priority: { type: String, enum: ['standard', 'express', 'urgent'], default: 'standard'},
    pickup: {
        address: { type: String, required: true },
        city: String,
        lat: Number,
        lng: Number,
        contactName: String,
        contactPhone: String,
        instructions: String,
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
    scheduleDate: { type: Date},
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    packageDetails: {
        weight: Number,
        dimention: String,
        description: String,
        fragile: { type: Boolean, default: false },
    },
    statusHistory: [statusHistorySchema],
    currentLocation: { lat: Number, lng: Number, address: String },
    failureReason: String,
    deliveryProof: String,
    isResheduled: { type: Boolean, default: false },
    rescheduledFrom: Date,
    fuelCost: { type: Number, default: 0 },
    distance: { type: Number, default: 0 },
    deliveryTime: Date,
}, { timestamps: true });

// Auto-generate tracking ID
shipmentSchema.pre('save', async function (next) {
    if (!this.trackingId) {
        const count = await mongoose.model('Shipment').countDocuments();
        this.trackingId = `LGT${String(count + 1).padStart(6, '0')}`;
    }
    // Push to status history on status change
    if (this.isModified('status')) {
        this.statusHistory.push({ status: this.status, timestamp: new Date() });
        if (this.status === 'delivered') this.deliveredAt = new Date();
    }
    next();
});

module.exports = mongoose.model('Shipment', shipmentSchema);
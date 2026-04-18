const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
    type: { type: String, enum: ['status_update', 'assignemt', 'reschedule', 'alert', 'system'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: { type: String, enum: ['in_app', 'enail', 'sms'], default: 'in_app' },
    isRead: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
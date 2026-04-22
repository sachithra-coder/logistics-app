const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// GET /api/shipments - list (role-based)
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'customer') query.customer = req.user._id;
        if (req.user.role === 'driver') query.driver = req.user._id;
        const { status, page = 1, limit = 20 } = req.query;
        if (status) query.status = status;
        const shipments = await Shipment.find(query)
            .populate('customer', 'name email phone')
            .populate('driver', 'name phone vehicleNumber currentLocation')
            .sort({ createdAt: -1 })
            .skip((page -1) * limit)
            .limit(Number(limit));
        const total = await Shipment.countDocument(query);
        res.json({ shipments, total, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/shipments/track/:trackingId - public tracking
router.get('/track/:trackingId', async (req, res) => {
    try {
        const shipment = await Shipment.findOne({ trackingId: req.params.trackingId.toUpperCase() })
            .populate('driver', 'name phone currentLocation vehicleNumber');
        if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
        res.json({ shipment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/shipments/:id
router.get('/:id', async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id)
            .populate('customer', 'name email phone')
            .populate('driver', 'name phone vehicleNumber, currentLocation');
        if (!shipment) return res.status(404).json({ message: 'Not found'});
        res.json({ shipment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/shipments - create
router.post('/', protect, authorize('dispatcher', 'manager', 'customer'), async (req, res) => {
    try {
        const data = {...req.body };
        if (req.user.role === 'customer') data.customer = req.user._id;
        const shipment = await Shipment.create(data);
        res.status(201).json({ shipment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PTACH /api/shipments/:id/status - update status (driver/dispatcher)
router.patch('/:id/status', protect, authorize('driver', 'dispatcher', 'manager'), async (req, res) => {
    try {
        const { status, note, location } = req.body;
        const shipment = await Shipment.findById(req.params.id).populate('customer', 'name email');
        if (!shipment) 
            return res.status(404).json({ message: 'Not Found'});
        shipment.status = status;
        if (note) 
            shipment.statusHistory[shipment.statusHistory.length - 1].note = note;
        if (location){
            shipment.currentLocation = location;
            shipment.statusHistory[shipment.statusHistory.length - 1].location = location;
        }
        await shipment.save();
        // Notify customer
        await Notification.create({
            recipient: shipment.customer._id,
            shipment: shipment._id,
            type: 'status_update',
            title: `Shipment ${status.replace(/_/g, ' ')}`,
            message: `Your shipment ${shipment.trackingId} is now ${status.replace(/_/g, ' ')}.${note ? ' ' + note : ''}`,
        });
        req.io?.to('customer').emit('shipment_update', { trackingId: shipment.trackingId, status });
        req.io?.to('dispatcher').emit('delivery_status_changed', { shipmentId: shipment._id, status });
        res.json({ shipment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/shipments/:id/reschedule
router.patch('/:id/reschedule', process, async (req, res) => {
    try {
        const { scheduledDate, instructions } = req.body;
        const shipment = await Shipment.findById(req.params.id);
        if (!shipment)
            return res.status(404).json({ message: 'Not found'});
        if (!['pending', 'assigned'].includes(shipment.status))
            return res.status(400).json({ message: 'Cannot reschedule at current status' });
        shipment.rescheduledFrom = shipment.scheduledDate;
        shipment.scheduledDate = new Date(scheduledDate);
        shipment.isRescheduled = true;
        if (instructions) 
            shipment.delivery.instructions = instructions;
        await shipment.save();
        res.json({ shipment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/shipments/:id/location - driver updates live location
router.patch('/:id/location', protect, authorize('driver'), async (req, res) => {
    try {
        const { lat, lng } = req.body;
        await Shipment.findByIdAndUpdate(req.params.id, { currentLocation: { lat, lng }});
        req.io?.to('dispatcher').emit('driver_location_update', { shipmentId: req.params.id, lat, lng, driverId: req.user._id});
        req.io?.to('customer').emit('shipment_location', { shipmentId: req.params.id, lat, lng});
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
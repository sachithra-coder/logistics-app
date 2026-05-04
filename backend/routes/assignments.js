const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// POST /api/assignments - assign shipment to driver
router.post('/', protect, authorize('dispatcher', 'manager'), async (req, res) => {
  try {
    const { shipmentId, driverId } = req.body;
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') return res.status(404).json({ message: 'Driver not found' });

    shipment.driver = driverId;
    shipment.status = 'assigned';
    await shipment.save();

    // Notify driver
    await Notification.create({
      recipient: driverId, shipment: shipmentId, type: 'assignment',
      title: 'New Delivery Assigned',
      message: `You have been assigned delivery ${shipment.trackingId} to ${shipment.delivery.address}.`,
    });

    req.io?.to('driver').emit('new_assignment', { shipment: shipment.trackingId });
    res.json({ shipment });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/assignments/:shipmentId - unassign
router.delete('/:shipmentId', protect, authorize('dispatcher', 'manager'), async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.shipmentId,
      { driver: null, status: 'pending' },
      { new: true }
    );
    res.json({ shipment });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;

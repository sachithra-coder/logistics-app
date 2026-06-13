const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/drivers - list all drivers
router.get('/', protect, authorize('dispatcher', 'manager'), async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver', isActive: true });
    res.json({ drivers });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/drivers/location - driver updates own location
router.patch('/location', protect, authorize('driver'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      currentLocation: { lat, lng, updatedAt: new Date() }
    });
    req.io?.to('dispatcher').emit('driver_location_update', {
      driverId: req.user._id, driverName: req.user.name, lat, lng
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/drivers/availability
router.patch('/availability', protect, authorize('driver'), async (req, res) => {
  try {
    const driver = await User.findByIdAndUpdate(
      req.user._id, { isAvailable: req.body.isAvailable }, { new: true }
    );
    res.json({ driver });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;

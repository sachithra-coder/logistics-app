const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/reports/overview
router.get('/overview', protect, authorize('manager', 'dispatcher'), async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const query = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [total, delivered, failed, inTransit, pending] = await Promise.all([
      Shipment.countDocuments(query),
      Shipment.countDocuments({ ...query, status: 'delivered' }),
      Shipment.countDocuments({ ...query, status: 'failed' }),
      Shipment.countDocuments({ ...query, status: { $in: ['in_transit', 'out_for_delivery'] } }),
      Shipment.countDocuments({ ...query, status: 'pending' }),
    ]);

    const totalDrivers = await User.countDocuments({ role: 'driver', isActive: true });
    const avgDeliveryTime = await Shipment.aggregate([
      { $match: { ...query, status: 'delivered', deliveredAt: { $exists: true } } },
      { $project: { diff: { $subtract: ['$deliveredAt', '$createdAt'] } } },
      { $group: { _id: null, avg: { $avg: '$diff' } } },
    ]);

    const onTimeRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    res.json({
      overview: { total, delivered, failed, inTransit, pending, totalDrivers, onTimeRate,
        avgDeliveryHours: avgDeliveryTime[0] ? Math.round(avgDeliveryTime[0].avg / 3600000) : 0 }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/reports/daily - daily delivery counts for chart
router.get('/daily', protect, authorize('manager', 'dispatcher'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const from = new Date(); from.setDate(from.getDate() - days);
    const data = await Shipment.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ data });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/reports/drivers - driver performance
router.get('/drivers', protect, authorize('manager', 'dispatcher'), async (req, res) => {
  try {
    const data = await Shipment.aggregate([
      { $match: { driver: { $exists: true, $ne: null } } },
      { $group: { _id: '$driver', total: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'driver' } },
      { $unwind: '$driver' },
      { $project: { driverName: '$driver.name', total: 1, delivered: 1, failed: 1,
          successRate: { $cond: [{ $gt: ['$total', 0] }, { $multiply: [{ $divide: ['$delivered', '$total'] }, 100] }, 0] } } },
      { $sort: { delivered: -1 } },
    ]);
    res.json({ data });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;

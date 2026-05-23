const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, role: role || 'customer', phone });
    res.status(201).json({ token: signToken(user._id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    const userObj = user.toJSON();
    res.json({ token: signToken(user._id), user: userObj });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json({ user: req.user }));

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, notificationPreferences } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, notificationPreferences },
      { new: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/customers?q=searchterm  — dispatcher searches for customers
router.get('/customers', protect, authorize('dispatcher', 'manager'), async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ customers: [] });

    const customers = await User.find({
      role: 'customer',
      isActive: true,
      $or: [
        { name:  { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ],
    }).select('name email phone').limit(10);

    res.json({ customers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/seed - create demo accounts
router.post('/seed', async (req, res) => {
  try {
    const demos = [
      { name: 'Sarah (Manager)',    email: 'manager@demo.com',    password: 'demo1234', role: 'manager',    phone: '+94771234567' },
      { name: 'Alex (Dispatcher)', email: 'dispatcher@demo.com', password: 'demo1234', role: 'dispatcher', phone: '+94771234568' },
      { name: 'John (Driver)',     email: 'driver@demo.com',     password: 'demo1234', role: 'driver',     phone: '+94771234569', vehicleNumber: 'VH-001' },
      { name: 'Emma (Customer)',   email: 'customer@demo.com',   password: 'demo1234', role: 'customer',   phone: '+94771234570' },
    ];
    const created = [];
    for (const d of demos) {
      const exists = await User.findOne({ email: d.email });
      if (!exists) { await User.create(d); created.push(d.email); }
    }
    res.json({ message: 'Seed complete', created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

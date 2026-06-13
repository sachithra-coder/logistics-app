const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.IO for real-time features
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach io to request
app.use((req, _res, next) => { req.io = io; next(); });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_role', (role) => socket.join(role));
  socket.on('driver_location', (data) => io.to('dispatcher').emit('driver_location_update', data));
  socket.on('delivery_update', (data) => {
    io.to('dispatcher').emit('delivery_status_changed', data);
    io.to('customer').emit('shipment_update', data);
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5002;
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics')
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));

module.exports = { app, io };

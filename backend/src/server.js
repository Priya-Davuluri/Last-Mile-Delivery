const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.PORT) {
  dotenv.config({ path: path.join(__dirname, '../../.env') });
}

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Import Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const agentRoutes = require('./routes/agentRoutes');
const customerRoutes = require('./routes/customerRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/customer', customerRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Last-Mile Delivery Tracker API is running smoothly',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Placeholder for API routes (to be plugged in subsequent tasks)
app.get('/api', (req, res) => {
  res.json({
    name: 'Last-Mile Delivery Tracker API',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/auth',
      '/api/admin',
      '/api/orders',
      '/api/agent',
      '/api/customer',
      '/api/tracking'
    ]
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Last-Mile Delivery Tracker Server running on port ${PORT}`);
    console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;

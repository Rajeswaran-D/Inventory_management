require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const envelopeRoutes = require('./src/routes/envelopeRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const saleRoutes = require('./src/routes/saleRoutes');
const saleRoutesSimplified = require('./src/routes/saleRoutesSimplified');
const stockRoutes = require('./src/routes/stockRoutes');
const productRoutes = require('./src/routes/productRoutes');
const flexibleProductRoutes = require('./src/routes/flexibleProductRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const simpleInventoryRoutes = require('./src/routes/simpleInventoryRoutes');
const pricingTierRoutes = require('./src/routes/pricingTierRoutes');
const authRoutes = require('./src/routes/authRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

// Import auto-seeding utilities
const { autoSeed } = require('./src/autoSeed');
const { autoSeedUsers } = require('./src/autoSeedUsers');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swamy_envelope';

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
.then(async () => {
  console.log('Connected to MongoDB');
  // Run auto-seeding on startup
  await autoSeed();
  // Auto-seed users for authentication
  await autoSeedUsers();
})
.catch(err => console.error('Could not connect to MongoDB:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/envelopes', envelopeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutesSimplified);  // Use simplified sales routes for billing
app.use('/api/stock', stockRoutes);
app.use('/api/products', productRoutes);
app.use('/api/flexible-products', flexibleProductRoutes);  // New flexible product management
app.use('/api/inventory', inventoryRoutes);
app.use('/api/simple-inventory', simpleInventoryRoutes);  // Simple inventory management
app.use('/api/pricing-tiers', pricingTierRoutes);
app.use('/api/reports', reportRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Smart Inventory API is running.' });
});

// Root API route
app.get('/api', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Smart Inventory & Billing System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      envelopes: '/api/envelopes',
      customers: '/api/customers',
      sales: '/api/sales',
      stock: '/api/stock'
    }
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ ERROR:', err);
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  
  let statusCode = 500;
  let message = 'Internal Server Error';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate key error: ' + Object.keys(err.keyPattern).join(', ');
  } else if (err.message) {
    message = err.message;
  }
  
  res.status(statusCode).json({
    error: {
      message: message,
      status: statusCode,
      type: err.name
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

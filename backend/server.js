
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { initDb, pool, testConnection } = require('./src/lib/db');

const envelopeRoutes = require('./src/routes/envelopeRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const saleRoutesSimplified = require('./src/routes/saleRoutesSimplified');
const stockRoutes = require('./src/routes/stockRoutes');
const productRoutes = require('./src/routes/productRoutes');
const flexibleProductRoutes = require('./src/routes/flexibleProductRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const simpleInventoryRoutes = require('./src/routes/simpleInventoryRoutes');
const pricingTierRoutes = require('./src/routes/pricingTierRoutes');
const authRoutes = require('./src/routes/authRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

const { autoSeed } = require('./src/autoSeed');
const { autoSeedUsers } = require('./src/autoSeedUsers');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ REQUEST LOGGER (NEW - helps debugging)
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/envelopes', envelopeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', saleRoutesSimplified);
app.use('/api/stock', stockRoutes);
app.use('/api/products', productRoutes);
app.use('/api/flexible-products', flexibleProductRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/simple-inventory', simpleInventoryRoutes);
app.use('/api/pricing-tiers', pricingTierRoutes);
app.use('/api/reports', reportRoutes);

// ✅ Health Check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'OK',
      message: '✅ API running with PostgreSQL',
    });
  } catch (error) {
    console.error("DB Health Error:", error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// ✅ Root API
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Smart Inventory & Billing System API',
  });
});

// ❌ 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// ✅ 🔥 FIXED GLOBAL ERROR HANDLER (IMPORTANT)
app.use((err, req, res, next) => {
  console.error('❌ FULL ERROR OBJECT:');
  console.error(err); // full object

  console.error('❌ ERROR STACK:');
  console.error(err.stack); // stack trace

  res.status(err.status || 500).json({
    success: false,
    message: err.message,
    stack: err.stack, // 👈 THIS IS WHAT YOU NEED
  });
});

// ✅ START SERVER
async function startServer() {
  try {
    console.log("⏳ Connecting to database...");
    await testConnection();

    console.log("⏳ Initializing database...");
    await initDb();
    console.log("✅ Database initialized");

    await autoSeed();
    console.log("✅ Data seeded");

    await autoSeedUsers();
    console.log("✅ Users seeded");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const prisma = require('./src/utils/prismaClient');
const { seedUsers, seedProductMasters } = require('./src/seed');

// Import routes
const productRoutes = require('./src/routes/productRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const saleRoutes = require('./src/routes/saleRoutes');
const authRoutes = require('./src/routes/authRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const stockRoutes = require('./src/routes/stockRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// 🩺 HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

/**
 * 🚀 RESILIENT STARTUP
 */
async function startServer() {
  try {
    console.log('🔄 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    console.log('🌱 Seeding initial data...');
    await seedUsers().catch(err => console.error('⚠️ User seeding skipped:', err.message));
    await seedProductMasters().catch(err => console.error('⚠️ Product seeding skipped:', err.message));
    console.log('✅ Base data verification complete');

  } catch (err) {
    console.error('❌ CRITICAL: Database connection failed on startup');
    console.error(err);
    // Do not exit, allow server to stay up for health check and debugging
  }

  // Register routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/sales', saleRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/stock', stockRoutes);
  app.use('/api/reports', reportRoutes);

  // Error safety net
  app.use((err, req, res, next) => {
    console.error('🔴 [System Error]', err.message);
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error',
        code: err.code
      }
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running continuously at http://localhost:${PORT}`);
  });
}

// 🛡️ UNHANDLED SAFETY
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
});

startServer();

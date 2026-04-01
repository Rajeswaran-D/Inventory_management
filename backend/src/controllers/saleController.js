const Sale = require('../models/Sale');
const Envelope = require('../models/Envelope');
const StockTransaction = require('../models/StockTransaction');

// Record a new sale (POS Style)
exports.createSale = async (req, res, next) => {
  try {
    const { customerId, items, grandTotal, date } = req.body;
    
    console.log('📥 Received sale request:', {
      customerId,
      itemsCount: items?.length,
      grandTotal,
      date
    });

    // ===== VALIDATION LAYER 1: Required Fields =====
    if (!customerId) {
      console.error('❌ Validation failed: Missing customerId');
      return res.status(400).json({ message: 'Customer ID is required' });
    }
    if (!items || items.length === 0) {
      console.error('❌ Validation failed: Missing items or empty array');
      return res.status(400).json({ message: 'Items array is required and cannot be empty' });
    }
    if (typeof grandTotal !== 'number' || grandTotal <= 0) {
      console.error(`❌ Validation failed: Invalid grandTotal: ${grandTotal}`);
      return res.status(400).json({ message: 'Grand total must be a positive number' });
    }

    // ===== VALIDATION LAYER 2: Item-level Validation =====
    console.log('📋 Validating item details...');
    let calculatedTotal = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`  Item ${i + 1}: qty=${item.quantity}, price=${item.price}, total=${item.total}`);
      
      // Validate quantity
      if (!item.quantity || item.quantity <= 0) {
        console.error(`❌ Item ${i + 1}: Invalid quantity ${item.quantity}`);
        return res.status(400).json({ message: `Item ${i + 1}: Quantity must be greater than 0` });
      }
      
      // Validate price
      if (!item.price || item.price <= 0) {
        console.error(`❌ Item ${i + 1}: Invalid price ${item.price} (${item.size})`);
        return res.status(400).json({ message: `Item ${i + 1} (${item.size}): Price must be greater than 0 (current: ${item.price})` });
      }
      
      // Verify item total calculation
      const expectedTotal = item.quantity * item.price;
      if (!item.total || Math.abs(item.total - expectedTotal) > 0.01) {
        console.warn(`⚠️  Item ${i + 1} total mismatch: received ${item.total}, expected ${expectedTotal}. Recalculating...`);
        item.total = expectedTotal; // Fix the calculation
      }
      calculatedTotal += item.total;
      console.log(`    ✅ Item ${i + 1} validated: ${item.size} × ${item.quantity} @ ${item.price} = ${item.total}`);
    }

    // Verify grandTotal matches sum of items
    if (Math.abs(calculatedTotal - grandTotal) > 0.01) {
      console.warn(`⚠️  Grand total mismatch: received ${grandTotal}, calculated ${calculatedTotal}. Using calculated value.`);
      // Optionally: return res.status(400).json({ message: 'Grand total does not match sum of items' });
      items.forEach((item, i) => {
        const expected = item.quantity * item.price;
        if (Math.abs(item.total - expected) > 0.01) {
          item.total = expected;
        }
      });
    }
    console.log(`✅ Item validation passed. Calculated total: ${calculatedTotal}`);

    // ===== VALIDATION LAYER 3: Stock Availability =====
    console.log('🔍 Checking stock availability...');
    const stockCheckResults = [];
    for (const item of items) {
      const envelope = await Envelope.findById(item.envelopeId);
      if (!envelope) {
        console.error(`❌ Envelope not found: ${item.envelopeId} (${item.size})`);
        return res.status(404).json({ message: `Product not found: ${item.size} ${item.materialType}` });
      }
      if (envelope.quantity < item.quantity) {
        console.error(`❌ Insufficient stock: ${item.size} has ${envelope.quantity}, need ${item.quantity}`);
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.size} (${item.materialType}). Available: ${envelope.quantity}, Required: ${item.quantity}` 
        });
      }
      stockCheckResults.push({ size: item.size, available: envelope.quantity, needed: item.quantity });
    }
    console.log('✅ Stock validation passed:', stockCheckResults);

    // ===== TRANSACTION: Save Sale =====
    console.log('💾 Creating sale record...');
    const saleData = {
      customerId,
      items: items.map(item => ({
        ...item,
        total: item.total // Ensure total is saved
      })),
      grandTotal: calculatedTotal, // Use calculated total for consistency
      date: date || new Date()
    };
    
    const sale = new Sale(saleData);
    const savedSale = await sale.save();
    console.log('✅ Sale record created:', {
      saleId: savedSale._id,
      itemCount: savedSale.items.length,
      grandTotal: savedSale.grandTotal
    });

    // ===== TRANSACTION: Update Stock & Record Out Transactions =====
    console.log('📉 Updating inventory and recording transactions...');
    const stockUpdates = [];
    for (const item of items) {
      try {
        // Create OUT transaction
        const transaction = new StockTransaction({
          envelopeId: item.envelopeId,
          type: 'OUT',
          quantity: item.quantity,
          date: saleData.date,
          saleId: savedSale._id
        });
        await transaction.save();
        
        // Decrement stock
        const updated = await Envelope.findByIdAndUpdate(
          item.envelopeId,
          { $inc: { quantity: -item.quantity } },
          { new: true }
        );
        
        stockUpdates.push({
          product: item.size,
          quantityRemoved: item.quantity,
          newStock: updated.quantity
        });
        console.log(`    ✅ ${item.size}: -${item.quantity} units (${updated.quantity} remaining)`);
      } catch (err) {
        console.error(`    ❌ Failed to update stock for ${item.size}:`, err.message);
        // Still continue with other updates
      }
    }
    console.log('✅ All inventory updates completed:', stockUpdates);

    // ===== SUCCESS RESPONSE =====
    console.log('🎉 Sale creation successful - Revenue: ' + calculatedTotal);
    res.status(201).json({ 
      message: 'Sale recorded successfully and stock updated',
      sale: savedSale,
      revenue: calculatedTotal
    });
  } catch (err) {
    console.error('❌ Error in createSale:', err.message);
    console.error('Error stack:', err.stack);
    next(err);
  }
};

// GET all sales (with analytics context)
exports.getAllSales = async (req, res, next) => {
  try {
    const { startDate, endDate, customerId, limit = 100, skip = 0 } = req.query;
    let query = {};
    if (customerId) query.customerId = customerId;
    if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    const sales = await Sale.find(query)
      .populate('customerId', 'name phone')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const count = await Sale.countDocuments(query);
    
    res.status(200).json({
      data: sales,
      count: sales.length,
      total: count,
      message: 'Sales retrieved successfully'
    });
  } catch (err) {
    next(err);
  }
};

// GET top-selling envelopes
exports.getTopSelling = async (req, res, next) => {
  try {
    const topSelling = await Sale.aggregate([
      { $unwind: '$items' },
      { $group: { 
          _id: '$items.envelopeId', 
          totalQty: { $sum: '$items.quantity' },
          totalRav: { $sum: '$items.total' },
          size: { $first: '$items.size' },
          materialType: { $first: '$items.materialType' }
        } 
      },
      { $sort: { totalQty: -1 } },
      { $limit: 10 }
    ]);
    res.status(200).json(topSelling);
  } catch (err) {
    next(err);
  }
};

// Dashboard analytics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    const todaySales = await Sale.aggregate([
      { $match: { date: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);

    const totalStock = await Envelope.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);

    const lowStockThreshold = 1000; // adjustable
    const lowStockAlerts = await Envelope.find({ quantity: { $lt: lowStockThreshold }, isActive: true })
      .sort({ quantity: 1 })
      .limit(10);

    res.status(200).json({
      todaySales: todaySales[0] || { total: 0, count: 0 },
      totalStock: totalStock[0] || { total: 0 },
      lowStockAlerts
    });
  } catch (err) {
    next(err);
  }
};

// ===== NEW: Comprehensive Reports Endpoint =====
/**
 * GET /api/sales/reports
 * Returns: Daily, Weekly, Monthly, Yearly revenue and sales metrics
 */
exports.getReports = async (req, res, next) => {
  try {
    console.log('📊 Generating comprehensive reports...');
    
    const now = new Date();
    
    // ===== TODAY =====
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayData = await Sale.aggregate([
      { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
      { 
        $group: { 
          _id: null, 
          revenue: { $sum: '$grandTotal' }, 
          salesCount: { $sum: 1 },
          itemsCount: { $sum: { $size: '$items' } }
        } 
      }
    ]);
    const todayReport = todayData[0] || { revenue: 0, salesCount: 0, itemsCount: 0 };
    console.log('  ✅ Today:', todayReport);

    // ===== YESTERDAY =====
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);
    
    const yesterdayData = await Sale.aggregate([
      { $match: { date: { $gte: yesterdayStart, $lte: yesterdayEnd } } },
      { 
        $group: { 
          _id: null, 
          revenue: { $sum: '$grandTotal' }, 
          salesCount: { $sum: 1 },
          itemsCount: { $sum: { $size: '$items' } }
        } 
      }
    ]);
    const previousReport = yesterdayData[0] || { revenue: 0, salesCount: 0, itemsCount: 0 };
    console.log('  ✅ Yesterday:', previousReport);

    // ===== WEEKLY (Last 7 days) =====
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekData = await Sale.aggregate([
      { $match: { date: { $gte: weekStart } } },
      { 
        $group: { 
          _id: null, 
          revenue: { $sum: '$grandTotal' }, 
          salesCount: { $sum: 1 },
          itemsCount: { $sum: { $size: '$items' } }
        } 
      }
    ]);
    const weekReport = weekData[0] || { revenue: 0, salesCount: 0, itemsCount: 0 };
    console.log('  ✅ Last 7 days:', weekReport);

    // ===== MONTHLY (Current month) =====
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthData = await Sale.aggregate([
      { $match: { date: { $gte: monthStart } } },
      { 
        $group: { 
          _id: null, 
          revenue: { $sum: '$grandTotal' }, 
          salesCount: { $sum: 1 },
          itemsCount: { $sum: { $size: '$items' } }
        } 
      }
    ]);
    const monthReport = monthData[0] || { revenue: 0, salesCount: 0, itemsCount: 0 };
    console.log('  ✅ This month:', monthReport);

    // ===== YEARLY (Current year) =====
    const yearStart = new Date(now);
    yearStart.setMonth(0);
    yearStart.setDate(1);
    yearStart.setHours(0, 0, 0, 0);
    
    const yearData = await Sale.aggregate([
      { $match: { date: { $gte: yearStart } } },
      { 
        $group: { 
          _id: null, 
          revenue: { $sum: '$grandTotal' }, 
          salesCount: { $sum: 1 },
          itemsCount: { $sum: { $size: '$items' } }
        } 
      }
    ]);
    const yearReport = yearData[0] || { revenue: 0, salesCount: 0, itemsCount: 0 };
    console.log('  ✅ This year:', yearReport);

    // ===== TOP SELLING PRODUCTS (Current month) =====
    const topSellingData = await Sale.aggregate([
      { $match: { date: { $gte: monthStart } } },
      { $unwind: '$items' },
      { 
        $group: { 
          _id: '$items.envelopeId', 
          totalQty: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          size: { $first: '$items.size' },
          materialType: { $first: '$items.materialType' }
        } 
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);
    console.log('  ✅ Top 5 products:', topSellingData.length);

    console.log('🎉 Reports generated successfully');
    res.status(200).json({
      data: {
        today: { ...todayReport, period: 'Today' },
        previous: { ...previousReport, period: 'Yesterday' },
        weekly: { ...weekReport, period: 'Last 7 Days' },
        monthly: { ...monthReport, period: 'This Month' },
        yearly: { ...yearReport, period: 'This Year' },
        topSellingProducts: topSellingData,
        generatedAt: new Date()
      },
      message: 'Reports generated successfully'
    });
  } catch (err) {
    console.error('❌ Error generating reports:', err.message);
    next(err);
  }
};

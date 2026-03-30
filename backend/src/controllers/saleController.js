const Sale = require('../models/Sale');
const Envelope = require('../models/Envelope');
const StockTransaction = require('../models/StockTransaction');

// Record a new sale (POS Style)
exports.createSale = async (req, res, next) => {
  try {
    const { customerId, items, grandTotal, date } = req.body;

    // Validate quantities before making any changes
    for (const item of items) {
      const envelope = await Envelope.findById(item.envelopeId);
      if (!envelope || envelope.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for product ${item.size} (${item.materialType}). Current: ${envelope ? envelope.quantity : 0}` 
        });
      }
    }

    // Process sale and update stock
    const sale = new Sale({ customerId, items, grandTotal, date });
    await sale.save();

    // After saving sale, decrement inventory and record transactions
    for (const item of items) {
      // Record stock OUT
      const transaction = new StockTransaction({
        envelopeId: item.envelopeId,
        type: 'OUT',
        quantity: item.quantity,
        date: date || new Date()
      });
      await transaction.save();

      // Decrement envelope quantity
      await Envelope.findByIdAndUpdate(item.envelopeId, {
        $inc: { quantity: -item.quantity }
      });
    }

    res.status(201).json({ message: 'Sale recorded successfully', sale });
  } catch (err) {
    next(err);
  }
};

// GET all sales (with analytics context)
exports.getAllSales = async (req, res, next) => {
  try {
    const { startDate, endDate, customerId } = req.query;
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
      .sort({ date: -1 });
    res.status(200).json(sales);
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

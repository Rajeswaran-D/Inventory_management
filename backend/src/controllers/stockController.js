const StockTransaction = require('../models/StockTransaction');
const Envelope = require('../models/Envelope');

// Add stock (IN)
exports.recordStockIn = async (req, res, next) => {
  try {
    const { envelopeId, quantity, date } = req.body;
    
    // Create transaction record
    const transaction = new StockTransaction({ envelopeId, quantity, type: 'IN', date });
    await transaction.save();

    // Update envelope quantity
    const updated = await Envelope.findByIdAndUpdate(
      envelopeId,
      { $inc: { quantity: quantity } },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: 'Envelope not found' });
    res.status(201).json({ message: 'Stock added successfully', transaction, updatedEnvelope: updated });
  } catch (err) {
    next(err);
  }
};

// Record stock (OUT) (Manual or through Sale)
exports.recordStockOut = async (req, res, next) => {
  try {
    const { envelopeId, quantity, date } = req.body;

    // Check availability
    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) return res.status(404).json({ message: 'Envelope not found or deactivated.' });
    if (envelope.quantity < quantity) {
      return res.status(400).json({ message: `Insufficient stock. Current: ${envelope.quantity}` });
    }

    // Create transaction record
    const transaction = new StockTransaction({ envelopeId, quantity, type: 'OUT', date });
    await transaction.save();

    // Update envelope quantity
    const updated = await Envelope.findByIdAndUpdate(
      envelopeId,
      { $inc: { quantity: -quantity } },
      { new: true, runValidators: true }
    );

    res.status(201).json({ message: 'Stock removed successfully', transaction, updatedEnvelope: updated });
  } catch (err) {
    next(err);
  }
};

// GET all stock transactions (History)
exports.getStockHistory = async (req, res, next) => {
  try {
    const { envelopeId, type, startDate, endDate } = req.query;
    let query = {};
    if (envelopeId) query.envelopeId = envelopeId;
    if (type) query.type = type;
    if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    const history = await StockTransaction.find(query)
      .populate('envelopeId', 'size materialType gsm color')
      .sort({ date: -1 });
    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
};

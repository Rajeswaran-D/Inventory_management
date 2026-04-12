const prisma = require('../utils/prismaClient');

// Add stock (IN)
exports.recordStockIn = async (req, res, next) => {
  try {
    const { envelopeId, quantity, date } = req.body;
    
    // Check envelope exists
    const envelope = await prisma.envelope.findUnique({ where: { id: envelopeId } });
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' });

    // Create transaction record and update in transaction
    const [transaction, updated] = await prisma.$transaction([
      prisma.stockTransaction.create({
        data: { envelopeId, quantity: parseInt(quantity), type: 'IN', date: date ? new Date(date) : new Date() }
      }),
      prisma.envelope.update({
        where: { id: envelopeId },
        data: { quantity: { increment: parseInt(quantity) } }
      })
    ]);

    res.status(201).json({ message: 'Stock added successfully', transaction, updatedEnvelope: updated });
  } catch (err) {
    next(err);
  }
};

// Record stock (OUT) (Manual or through Sale)
exports.recordStockOut = async (req, res, next) => {
  try {
    const { envelopeId, quantity, date } = req.body;
    const parsedQty = parseInt(quantity);

    // Check availability
    const envelope = await prisma.envelope.findUnique({ where: { id: envelopeId } });
    if (!envelope || !envelope.isActive) return res.status(404).json({ message: 'Envelope not found or deactivated.' });
    if (envelope.quantity < parsedQty) {
      return res.status(400).json({ message: `Insufficient stock. Current: ${envelope.quantity}` });
    }

    const [transaction, updated] = await prisma.$transaction([
      prisma.stockTransaction.create({
        data: { envelopeId, quantity: parsedQty, type: 'OUT', date: date ? new Date(date) : new Date() }
      }),
      prisma.envelope.update({
        where: { id: envelopeId },
        data: { quantity: { decrement: parsedQty } }
      })
    ]);

    res.status(201).json({ message: 'Stock removed successfully', transaction, updatedEnvelope: updated });
  } catch (err) {
    next(err);
  }
};

// GET all stock transactions (History)
exports.getStockHistory = async (req, res, next) => {
  try {
    const { envelopeId, type, startDate, endDate } = req.query;
    let whereClause = {};
    if (envelopeId) whereClause.envelopeId = envelopeId;
    if (type) whereClause.type = type;
    if (startDate && endDate) {
      whereClause.date = { 
        gte: new Date(startDate), 
        lte: new Date(endDate) 
      };
    }

    const history = await prisma.stockTransaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });
    
    // Loose relation emulation (Manual populate)
    const envelopeIds = [...new Set(history.map(h => h.envelopeId).filter(Boolean))];
    const envelopes = await prisma.envelope.findMany({
      where: { id: { in: envelopeIds } },
      select: { id: true, size: true, materialType: true, gsm: true, color: true }
    });
    
    const envelopeMap = envelopes.reduce((acc, env) => { 
        // Emulate mongoose _id
        acc[env.id] = { ...env, _id: env.id }; 
        return acc; 
    }, {});
    
    const mappedHistory = history.map(h => {
        const obj = { ...h };
        if (h.envelopeId && envelopeMap[h.envelopeId]) {
            obj.envelopeId = envelopeMap[h.envelopeId];
        }
        return obj;
    });

    res.status(200).json(mappedHistory);
  } catch (err) {
    next(err);
  }
};

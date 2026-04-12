const prisma = require('../utils/prismaClient');

// GET all envelopes with filtering, search, and sorting
exports.getAllEnvelopes = async (req, res, next) => {
  try {
    const { search, materialType, size, gsm } = req.query;
    let whereClause = { isActive: true };

    if (materialType) whereClause.materialType = materialType;
    if (size) whereClause.size = size;
    if (gsm) whereClause.gsm = parseFloat(gsm);

    if (search) {
      whereClause.OR = [
        { size: { contains: search } },
        { materialType: { contains: search } }
      ];
    }

    const envelopes = await prisma.envelope.findMany({
      where: whereClause,
      orderBy: [
        { size: 'asc' },
        { materialType: 'asc' }
      ]
    });
    res.status(200).json(envelopes);
  } catch (err) {
    next(err);
  }
};

// GET a single envelope
exports.getEnvelopeById = async (req, res, next) => {
  try {
    const envelope = await prisma.envelope.findUnique({
      where: { id: req.params.id }
    });
    if (!envelope) return res.status(404).json({ message: 'Envelope not found' });
    res.status(200).json(envelope);
  } catch (err) {
    next(err);
  }
};

// POST a new envelope (with duplicate detection)
exports.createEnvelope = async (req, res, next) => {
  try {
    const { size, materialType, gsm, color, price } = req.body;

    const existing = await prisma.envelope.findFirst({
      where: { size, materialType, gsm: gsm ? parseFloat(gsm) : null, color: color || null }
    });
    if (existing) {
      return res.status(400).json({ message: 'A similar product already exists.' });
    }

    const newEnvelope = await prisma.envelope.create({
      data: { size, materialType, gsm: gsm ? parseFloat(gsm) : null, color, price: parseFloat(price) || 0 }
    });
    res.status(201).json(newEnvelope);
  } catch (err) {
    next(err);
  }
};

// PUT (update) an envelope
exports.updateEnvelope = async (req, res, next) => {
  try {
    const data = { ...req.body };
    // Prisma ensures fields match exact schemas, sanitize data here if needed
    if (data.gsm) data.gsm = parseFloat(data.gsm);
    if (data.price) data.price = parseFloat(data.price);
    
    // Check if exists
    const exists = await prisma.envelope.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ message: 'Envelope not found' });

    const updated = await prisma.envelope.update({
      where: { id: req.params.id },
      data
    });
    
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE (soft delete) an envelope
exports.deleteEnvelope = async (req, res, next) => {
  try {
    const exists = await prisma.envelope.findUnique({ where: { id: req.params.id } });
    if (!exists) return res.status(404).json({ message: 'Envelope not found' });

    const deleted = await prisma.envelope.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    
    res.status(200).json({ message: 'Envelope deleted successfully' });
  } catch (err) {
    next(err);
  }
};

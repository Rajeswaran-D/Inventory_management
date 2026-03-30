const Envelope = require('../models/Envelope');

// GET all envelopes with filtering, search, and sorting
exports.getAllEnvelopes = async (req, res, next) => {
  try {
    const { search, materialType, size, gsm } = req.query;
    let query = { isActive: true };

    if (materialType) query.materialType = materialType;
    if (size) query.size = size;
    if (gsm) query.gsm = gsm;

    if (search) {
      query.$or = [
        { size: { $regex: search, $options: 'i' } },
        { materialType: { $regex: search, $options: 'i' } }
      ];
    }

    const envelopes = await Envelope.find(query).sort({ size: 1, materialType: 1 });
    res.status(200).json(envelopes);
  } catch (err) {
    next(err);
  }
};

// GET a single envelope
exports.getEnvelopeById = async (req, res, next) => {
  try {
    const envelope = await Envelope.findById(req.params.id);
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

    // Check for existing product (size, type, gsm, color)
    const existing = await Envelope.findOne({ size, materialType, gsm, color });
    if (existing) {
      return res.status(400).json({ message: 'A similar product already exists.' });
    }

    const newEnvelope = new Envelope({ size, materialType, gsm, color, price });
    await newEnvelope.save();
    res.status(201).json(newEnvelope);
  } catch (err) {
    next(err);
  }
};

// PUT (update) an envelope
exports.updateEnvelope = async (req, res, next) => {
  try {
    const updated = await Envelope.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Envelope not found' });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE (soft delete) an envelope
exports.deleteEnvelope = async (req, res, next) => {
  try {
    const deleted = await Envelope.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!deleted) return res.status(404).json({ message: 'Envelope not found' });
    res.status(200).json({ message: 'Envelope deleted successfully' });
  } catch (err) {
    next(err);
  }
};

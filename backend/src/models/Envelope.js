const mongoose = require('mongoose');

const envelopeSchema = new mongoose.Schema({
  size: { type: String, required: true },
  materialType: { 
    type: String, 
    enum: ['Cloth', 'Maplitho', 'Buff', 'Kraft', 'Vibothi'], 
    required: true 
  },
  gsm: { type: Number },
  color: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Envelope', envelopeSchema);

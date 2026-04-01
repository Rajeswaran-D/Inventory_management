const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Envelope', required: true },
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  quantity: { type: Number, required: true },
  reference: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', nullable: true },
  reason: { type: String, default: '' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);

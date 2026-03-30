const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [{
    envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Envelope' },
    size: String,
    materialType: String,
    gsm: Number,
    color: String,
    price: Number,
    quantity: Number,
    total: Number
  }],
  grandTotal: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);

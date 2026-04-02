const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
  // Flexible reference — works with variants, products, or envelopes
  variantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ProductVariant',
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    index: true
  },
  // Legacy field kept for backward compatibility  
  envelopeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Envelope'
  },
  type: { 
    type: String, 
    enum: ['IN', 'OUT'], 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  reference: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Sale'
  },
  reason: { 
    type: String, 
    default: '' 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

stockTransactionSchema.index({ date: -1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);

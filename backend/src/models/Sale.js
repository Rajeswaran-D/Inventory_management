const mongoose = require('mongoose');

// ============================================================================
// COUNTER SCHEMA — For auto-incrementing bill numbers
// ============================================================================
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

// ============================================================================
// SALE SCHEMA — Complete billing record
// ============================================================================
const saleSchema = new mongoose.Schema({
  // Auto-generated bill number (SE-0001, SE-0002, ...)
  billNumber: {
    type: String,
    unique: true,
    index: true
  },

  // Customer information
  customerName: { 
    type: String, 
    required: true,
    trim: true
  },
  customerPhone: { 
    type: String, 
    default: ''
  },
  customerGSTIN: {
    type: String,
    default: ''
  },
  customerAddress: {
    type: String,
    default: ''
  },

  // Customer reference (for detailed lookups)
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: false 
  },
  
  // Sale items (line items on the bill)
  items: [{
    variantId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: false  // Not required — may not always have a variant reference
    },
    productId: {
      type: mongoose.Schema.Types.Mixed,  // Can be ObjectId or string
      required: false
    },
    productName: { type: String, default: 'Product' },
    displayName: { type: String, default: '' },
    gsm: { type: mongoose.Schema.Types.Mixed, default: null },
    size: { type: String, default: null },
    color: { type: String, default: null },
    price: { 
      type: Number, 
      required: true,
      default: 0
    },
    quantity: { 
      type: Number, 
      required: true,
      default: 0
    },
    itemTotal: { 
      type: Number, 
      default: 0
    }
  }],
  
  // Financial data — stored for accurate record keeping
  subtotal: {
    type: Number,
    default: 0
  },
  cgstRate: {
    type: Number,
    default: 9
  },
  sgstRate: {
    type: Number,
    default: 9
  },
  cgst: {
    type: Number,
    default: 0
  },
  sgst: {
    type: Number,
    default: 0
  },
  igst: {
    type: Number,
    default: 0
  },
  roundOff: {
    type: Number,
    default: 0
  },
  grandTotal: { 
    type: Number, 
    required: true 
  },
  
  // Metadata
  date: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// ============================================================================
// PRE-SAVE HOOK — Auto-generate bill number
// ============================================================================
saleSchema.pre('save', async function(next) {
  if (this.isNew && !this.billNumber) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'billNumber',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.billNumber = `SE-${String(counter.seq).padStart(4, '0')}`;
    } catch (err) {
      // Fallback: use timestamp-based bill number
      this.billNumber = `SE-${Date.now().toString().slice(-6)}`;
    }
  }

  // Auto-calculate GST if not provided
  if (this.subtotal > 0 && this.cgst === 0 && this.sgst === 0) {
    const cgstRate = this.cgstRate || 9;
    const sgstRate = this.sgstRate || 9;
    this.cgst = parseFloat(((this.subtotal * cgstRate) / 100).toFixed(2));
    this.sgst = parseFloat(((this.subtotal * sgstRate) / 100).toFixed(2));
    const totalBeforeRound = this.subtotal + this.cgst + this.sgst;
    const rounded = Math.round(totalBeforeRound);
    this.roundOff = parseFloat((rounded - totalBeforeRound).toFixed(2));
    this.grandTotal = rounded;
  }

  next();
});

// Indexes for quick lookups
saleSchema.index({ customerName: 1 });
saleSchema.index({ date: -1 });
saleSchema.index({ billNumber: 1 });

module.exports = mongoose.model('Sale', saleSchema);

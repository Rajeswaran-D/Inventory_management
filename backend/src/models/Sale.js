const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  // Customer information (stored directly for easy access)
  customerName: { 
    type: String, 
    required: true,
    trim: true
  },
  customerPhone: { 
    type: String, 
    default: ''
  },
  
  // Customer reference (for detailed lookups)
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  
  // Sale items (line items on the bill)
  items: [{
    productId: { 
      type: String,  // Can be product key string like "maplitho" or ObjectId
      required: true
    },
    productName: String,
    displayName: String,
    gsm: mongoose.Schema.Types.Mixed,
    size: String,
    color: String,
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
  
  // Financial data
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

// Index for quick lookups
saleSchema.index({ customerName: 1 });
saleSchema.index({ date: -1 });

module.exports = mongoose.model('Sale', saleSchema);

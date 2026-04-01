const mongoose = require('mongoose');

const productMasterSchema = new mongoose.Schema({
  // Product identifier
  name: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },

  // Field requirements for this product type
  hasGSM: { 
    type: Boolean, 
    default: true
  },
  hasSize: { 
    type: Boolean, 
    default: true
  },
  hasColor: { 
    type: Boolean, 
    default: false
  },

  // Metadata
  description: String,
  category: {
    type: String,
    enum: ['Standard Envelope', 'Cloth Cover', 'Specialty'],
    default: 'Standard Envelope'
  },

  // Available options for this product
  gsmOptions: [{
    type: Number,
    min: 0
  }],
  
  sizeOptions: [{
    type: String
  }],

  colorOptions: [{
    type: String
  }],

  isActive: { 
    type: Boolean, 
    default: true 
  },

  // Flag to indicate if product was created manually via variant creation
  isManualProduct: {
    type: Boolean,
    default: false
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Pre-save hook to set defaults based on product type
productMasterSchema.pre('save', function(next) {
  // Vibhoothi special handling
  if (this.name === 'Vibhoothi') {
    this.hasGSM = true;      // Vibhoothi has GSM
    this.hasSize = false;    // Vibhoothi does NOT have size selection (fixed as "Standard")
    this.hasColor = false;   // Vibhoothi does NOT have color
    
    if (!this.sizeOptions.includes('Standard')) {
      this.sizeOptions = ['Standard']; // Auto-set to Standard
    }
  }
  // Cloth Cover special handling
  else if (this.name === 'Cloth Cover') {
    this.hasGSM = false;     // Cloth doesn't have GSM
    this.hasSize = true;     // Cloth requires size
    this.hasColor = true;    // Cloth has colors
  }
  // Standard products (Maplitho, Buff, Kraft)
  else if (['Maplitho', 'Buff', 'Kraft'].includes(this.name)) {
    this.hasGSM = true;      // Standard products have GSM
    this.hasSize = true;     // Standard products require size
    this.hasColor = true;    // Standard products have colors
  }

  next();
});

module.exports = mongoose.model('ProductMaster', productMasterSchema);

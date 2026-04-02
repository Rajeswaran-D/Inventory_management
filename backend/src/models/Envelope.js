const mongoose = require('mongoose');

const envelopeSchema = new mongoose.Schema({
  size: { 
    type: String, 
    required: true,
    trim: true
  },
  materialType: { 
    type: String, 
    required: true,
    trim: true
  },
  gsm: { 
    type: Number,
    min: 0
  },
  color: { 
    type: String,
    default: null
  },
  price: { 
    type: Number, 
    required: true,
    default: 0,
    min: 0
  },
  quantity: { 
    type: Number, 
    required: true,
    default: 0,
    min: 0
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create unique compound index on size + materialType + gsm + color
envelopeSchema.index({ size: 1, materialType: 1, gsm: 1, color: 1 }, { unique: true, sparse: true });

// Pre-save validation
envelopeSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existing = await mongoose.model('Envelope').findOne({
      size: this.size,
      materialType: this.materialType
    });
    if (existing) {
      throw new Error(`Product with size "${this.size}" and material type "${this.materialType}" already exists.`);
    }
  }
  next();
});

module.exports = mongoose.model('Envelope', envelopeSchema);

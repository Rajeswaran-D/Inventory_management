const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
  // Link to ProductMaster
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ProductMaster',
    required: true
  },

  // Variant attributes (each actual product combination)
  gsm: { 
    type: Number,
    min: 0
  },

  size: { 
    type: String,
    required: function() {
      // Size is required if the product type requires it
      return this.hasSize !== false;
    }
  },

  color: { 
    type: String,
    enum: [null, 'White', 'Color', 'Natural', 'Mixed'],
    default: null
  },

  // Flag to indicate if this variant has size/gsm requirements
  hasSize: Boolean,
  hasGSM: Boolean,

  // SKU for unique product identification
  sku: {
    type: String,
    unique: true,
    sparse: true
  },

  // Description/name for display
  displayName: String,

  isActive: { 
    type: Boolean, 
    default: true 
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create compound unique index to prevent duplicate variants
productVariantSchema.index(
  { productId: 1, gsm: 1, size: 1, color: 1 },
  { 
    unique: true, 
    sparse: true,
    name: 'unique_variant'
  }
);

// Auto-generate display name before saving
productVariantSchema.pre('save', async function(next) {
  try {
    const ProductMaster = require('./ProductMaster');
    const product = await ProductMaster.findById(this.productId);
    
    if (!product) {
      return next(new Error('Product not found'));
    }

    // Copy flags from product master
    this.hasSize = product.hasSize;
    this.hasGSM = product.hasGSM;

    // Generate display name based on product type
    let parts = [product.name];
    if (product.hasGSM && this.gsm) parts.push(`${this.gsm} GSM`);
    if (product.hasSize && this.size) parts.push(this.size);
    if (product.hasColor && this.color && this.color !== 'null') parts.push(this.color);
    
    this.displayName = parts.join(' | ');

    // Generate SKU if not provided
    if (!this.sku) {
      const gsmPart = this.gsm ? `${this.gsm}G` : 'NoGSM';
      const sizePart = this.size ? this.size.replace(/x/g, 'x').substring(0, 3) : 'NoSize';
      const colorPart = this.color ? this.color[0] : 'X';
      this.sku = `${product.name.substring(0, 3).toUpperCase()}-${gsmPart}-${sizePart}-${colorPart}-${Date.now()}`;
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('ProductVariant', productVariantSchema);

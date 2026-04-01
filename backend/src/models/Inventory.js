const mongoose = require('mongoose');

/**
 * INVENTORY MODEL
 * Tracks quantity and price for each product variant
 * AUTO-CREATED when ProductVariant is created
 */

const inventorySchema = new mongoose.Schema({
  // ProductVariant reference
  variantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ProductVariant',
    required: true,
    unique: true,
    index: true
  },

  // Product reference (for backward compatibility)
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    index: true
  },

  // Stock and pricing information
  quantity: { 
    type: Number, 
    default: 0,
    min: 0
  },

  price: { 
    type: Number, 
    default: 0,
    min: 0
  },

  // Stock threshold
  minimumStockLevel: {
    type: Number,
    default: 50
  },

  // Status
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for quick lookups
inventorySchema.index({ variantId: 1 });
inventorySchema.index({ productId: 1 });
inventorySchema.index({ isActive: 1 });

// Populate variant details on query
inventorySchema.pre(/^find/, function(next) {
  if (this.options._recursed) {
    return next();
  }
  this.populate({
    path: 'variantId',
    populate: { path: 'productId' }
  });
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);

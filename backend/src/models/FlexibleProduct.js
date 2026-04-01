/**
 * FLEXIBLE PRODUCT MODEL
 * Supports custom product creation with flexible variants
 */

const mongoose = require('mongoose');

const flexibleProductSchema = new mongoose.Schema(
  {
    // Product identification
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: null
    },

    // Variants array
    variants: [
      {
        variant_id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true
        },
        type: {
          // "size", "gsm", "weight", "custom"
          type: String,
          required: true,
          lowercase: true
        },
        value: {
          // "XL", "80 GSM", "1kg", "CustomValue"
          type: String,
          required: true,
          trim: true
        },
        price: {
          type: Number,
          required: true,
          min: 0
        },
        stock: {
          type: Number,
          required: true,
          default: 0,
          min: 0
        },
        unit: {
          // Optional: "pcs", "kg", "box", etc.
          type: String,
          default: 'pcs'
        },
        created_at: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Metadata
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate products
flexibleProductSchema.index({ name: 1 });

// Virtual for total stock
flexibleProductSchema.virtual('totalStock').get(function () {
  return this.variants.reduce((sum, v) => sum + v.stock, 0);
});

// Pre-save middleware to update timestamp
flexibleProductSchema.pre('save', function (next) {
  if (this.isModified()) {
    this.updated_at = Date.now();
  }
  next();
});

module.exports = mongoose.model('FlexibleProduct', flexibleProductSchema);

/**
 * SIMPLIFIED PRODUCT MODEL
 * 
 * Represents a specific product variant:
 * - Product type (Maplitho, Buff, etc.)
 * - Specifications (GSM, Size, Color)
 * - SKU and display name
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // Product reference
    productId: {
      type: String,
      required: true,
      enum: ['maplitho', 'buff', 'kraft', 'cloth_cover', 'vibhoothi'],
      index: true
    },
    productName: {
      type: String,
      required: true
    },

    // Specifications
    gsm: {
      type: Number,
      default: null
    },
    size: {
      type: String,
      default: null
    },
    color: {
      type: String,
      default: null
    },

    // Display and identification
    displayName: {
      type: String,
      required: true,
      index: true,
      // Removed: unique constraint - not needed since we have composite index below
    },
    sku: {
      type: String,
      required: true,
      index: true,
      // Removed unique - can have variants with same base SKU
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate combinations
productSchema.index({ productId: 1, gsm: 1, size: 1, color: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);

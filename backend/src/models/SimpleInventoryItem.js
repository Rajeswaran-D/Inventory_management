const mongoose = require("mongoose");

const simpleInventoryItemSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    variantType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    variantValue: {
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
      min: 0,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for faster searches
simpleInventoryItemSchema.index({ productName: 1 });
simpleInventoryItemSchema.index({ variantType: 1 });
simpleInventoryItemSchema.index({ productName: 1, variantType: 1, variantValue: 1 });

module.exports = mongoose.model("SimpleInventoryItem", simpleInventoryItemSchema);

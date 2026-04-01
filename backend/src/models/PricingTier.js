/**
 * PricingTier Model
 * 
 * Manages volume-based and customer-based pricing tiers
 * Enables dynamic pricing based on order quantity or customer type
 */

const mongoose = require('mongoose');

const PricingTierSchema = new mongoose.Schema(
  {
    // Tier identification
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      description: 'e.g., Bulk Order 1000+, Premium Customer, Wholesale'
    },
    description: {
      type: String,
      default: ''
    },

    // Tier type and conditions
    tierType: {
      type: String,
      enum: ['volume', 'customer', 'seasonal', 'product'],
      default: 'volume',
      description: 'volume: based on quantity, customer: customer type, seasonal: time-based, product: specific products'
    },

    // Volume-based tier conditions
    minQuantity: {
      type: Number,
      default: 0,
      description: 'Minimum order quantity for this tier'
    },
    maxQuantity: {
      type: Number,
      default: null,
      description: 'Maximum order quantity (null = unlimited)'
    },

    // Customer-based tier
    customerType: {
      type: String,
      enum: ['retail', 'wholesale', 'corporate', 'distributors', null],
      default: null
    },

    // Pricing adjustments
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      default: 0,
      description: 'Discount as percentage (0-100) or fixed amount'
    },

    // alternatively, markup for premium tiers
    markup: {
      type: Number,
      default: 0,
      description: 'Markup percentage for premium tiers'
    },

    // Applicability
    applicableProducts: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'ProductMaster',
      default: [],
      description: 'Empty array = applies to all products'
    },

    applicableVariants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'ProductVariant',
      default: [],
      description: 'Empty array = applies to all variants'
    },

    // Time-based conditions (seasonal/special promotions)
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },

    // Priority and activity
    priority: {
      type: Number,
      default: 100,
      description: 'Higher priority applies first if multiple tiers match'
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Metadata
    appliedCount: {
      type: Number,
      default: 0,
      description: 'Number of times this tier has been applied'
    },
  },
  {
    timestamps: true,
    collection: 'pricing_tiers'
  }
);

// Indexes for common queries
PricingTierSchema.index({ tierType: 1, isActive: 1 });
PricingTierSchema.index({ minQuantity: 1, maxQuantity: 1 });
PricingTierSchema.index({ customerType: 1, isActive: 1 });
PricingTierSchema.index({ startDate: 1, endDate: 1 });
PricingTierSchema.index({ priority: -1, isActive: 1 });

// Static method to find applicable tier
PricingTierSchema.statics.getApplicableTier = async function(conditions = {}) {
  const {
    quantity = 0,
    customerType = null,
    productId = null,
    variantId = null,
    currentDate = new Date()
  } = conditions;

  const query = {
    isActive: true,
    $or: [
      { startDate: null, endDate: null },
      { startDate: { $lte: currentDate }, endDate: null },
      { startDate: null, endDate: { $gte: currentDate } },
      { startDate: { $lte: currentDate }, endDate: { $gte: currentDate } }
    ]
  };

  // Volume-based tier
  if (quantity > 0) {
    query.$or = query.$or || [];
    query.$or.push({
      tierType: 'volume',
      minQuantity: { $lte: quantity },
      $or: [
        { maxQuantity: null },
        { maxQuantity: { $gte: quantity } }
      ]
    });
  }

  // Customer-based tier
  if (customerType) {
    query.$or = query.$or || [];
    query.$or.push({
      tierType: 'customer',
      customerType: customerType
    });
  }

  // Product-specific tier
  if (productId || variantId) {
    query.$or = query.$or || [];
    query.$or.push({
      tierType: 'product',
      $or: [
        { applicableProducts: { $size: 0 }, applicableVariants: { $size: 0 } },
        productId ? { applicableProducts: productId } : {},
        variantId ? { applicableVariants: variantId } : {}
      ]
    });
  }

  // Get highest priority tier that applies
  return await this.findOne(query)
    .sort({ priority: -1 })
    .lean();
};

// Instance method to calculate discounted price
PricingTierSchema.methods.calculatePrice = function(basePrice) {
  if (this.discountType === 'percentage') {
    return basePrice * (1 - (this.discountValue / 100));
  } else if (this.discountType === 'fixed') {
    return Math.max(0, basePrice - this.discountValue);
  }
  return basePrice;
};

// Static method to get all active tiers
PricingTierSchema.statics.getActiveTiers = async function(filters = {}) {
  const query = { isActive: true };
  if (filters.tierType) query.tierType = filters.tierType;
  if (filters.customerType) query.customerType = filters.customerType;
  
  return await this.find(query)
    .sort({ tierType: 1, priority: -1 })
    .lean();
};

module.exports = mongoose.model('PricingTier', PricingTierSchema);

/**
 * Pricing Tier Controller
 * 
 * Manages pricing tiers for volume-based, customer-based, and seasonal pricing
 */

const PricingTier = require('../models/PricingTier');

// ============= GET OPERATIONS =============

/**
 * Get all pricing tiers with filtering and pagination
 */
exports.getAllTiers = async (req, res) => {
  try {
    console.log('💰 Fetching all pricing tiers');
    
    const { tierType, customerType, isActive, search } = req.query;
    const query = {};

    if (tierType) query.tierType = tierType;
    if (customerType) query.customerType = customerType;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const tiers = await PricingTier.find(query)
      .populate('applicableProducts', 'name')
      .populate('applicableVariants', 'displayName sku')
      .sort({ tierType: 1, priority: -1 })
      .lean();

    res.json({ 
      data: tiers,
      total: tiers.length 
    });
  } catch (err) {
    console.error('❌ Error fetching tiers:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get tier by ID
 */
exports.getTierById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`💰 Fetching tier: ${id}`);

    const tier = await PricingTier.findById(id)
      .populate('applicableProducts', 'name')
      .populate('applicableVariants', 'displayName sku');

    if (!tier) return res.status(404).json({ error: 'Tier not found' });

    res.json({ data: tier });
  } catch (err) {
    console.error('❌ Error fetching tier:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get applicable tier for conditions (quantity, customer type, etc.)
 */
exports.getApplicableTier = async (req, res) => {
  try {
    const { quantity = 0, customerType = null, productId = null, variantId = null } = req.query;
    console.log(`💰 Finding applicable tier for: qty=${quantity}, customer=${customerType}`);

    const tier = await PricingTier.getApplicableTier({
      quantity: parseInt(quantity),
      customerType,
      productId,
      variantId
    });

    res.json({ data: tier });
  } catch (err) {
    console.error('❌ Error finding applicable tier:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get pricing analysis for a price with applicable tiers
 */
exports.calculateTieredPrice = async (req, res) => {
  try {
    const { basePrice, quantity = 0, customerType = null } = req.body;
    console.log(`💰 Calculating tiered price: ₹${basePrice} for qty=${quantity}`);

    if (!basePrice) {
      return res.status(400).json({ error: 'basePrice is required' });
    }

    const tier = await PricingTier.getApplicableTier({
      quantity: parseInt(quantity),
      customerType
    });

    // Calculate price based on tier
    let finalPrice = basePrice;
    if (tier) {
      if (tier.discountType === 'percentage') {
        finalPrice = basePrice * (1 - (tier.discountValue / 100));
      } else if (tier.discountType === 'fixed') {
        finalPrice = Math.max(0, basePrice - tier.discountValue);
      }
    }

    const savings = basePrice - finalPrice;

    res.json({
      data: {
        basePrice,
        tier: tier ? {
          id: tier._id,
          name: tier.name,
          discountType: tier.discountType,
          discountValue: tier.discountValue
        } : null,
        finalPrice,
        savings,
        savingsPercentage: basePrice > 0 ? ((savings / basePrice) * 100).toFixed(2) : 0
      }
    });
  } catch (err) {
    console.error('❌ Error calculating price:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ============= CREATE OPERATIONS =============

/**
 * Create new pricing tier
 */
exports.createTier = async (req, res) => {
  try {
    console.log('📝 Creating new pricing tier');
    const tier = new PricingTier(req.body);
    await tier.save();
    console.log(`✅ Tier created: ${tier.name}`);

    res.status(201).json({ 
      data: tier,
      message: 'Pricing tier created successfully' 
    });
  } catch (err) {
    console.error('❌ Error creating tier:', err.message);
    res.status(400).json({ error: err.message });
  }
};

/**
 * Create bulk pricing tiers
 */
exports.createBulkTiers = async (req, res) => {
  try {
    const { tiers } = req.body;
    if (!Array.isArray(tiers) || tiers.length === 0) {
      return res.status(400).json({ error: 'tiers array is required' });
    }

    console.log(`📝 Creating ${tiers.length} pricing tiers`);
    const created = await PricingTier.insertMany(tiers);
    console.log(`✅ Created ${created.length} tiers`);

    res.status(201).json({ 
      data: created,
      message: `${created.length} pricing tiers created successfully` 
    });
  } catch (err) {
    console.error('❌ Error creating bulk tiers:', err.message);
    res.status(400).json({ error: err.message });
  }
};

// ============= UPDATE OPERATIONS =============

/**
 * Update pricing tier
 */
exports.updateTier = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✏️  Updating tier: ${id}`);

    const tier = await PricingTier.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!tier) return res.status(404).json({ error: 'Tier not found' });

    console.log(`✅ Tier updated: ${tier.name}`);
    res.json({ 
      data: tier,
      message: 'Pricing tier updated successfully' 
    });
  } catch (err) {
    console.error('❌ Error updating tier:', err.message);
    res.status(400).json({ error: err.message });
  }
};

/**
 * Activate/Deactivate tier
 */
exports.toggleTierStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    console.log(`⚡ Toggling tier status: ${id} -> ${isActive}`);

    const tier = await PricingTier.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!tier) return res.status(404).json({ error: 'Tier not found' });

    console.log(`✅ Tier status updated: ${tier.name} -> ${isActive ? 'Active' : 'Inactive'}`);
    res.json({ 
      data: tier,
      message: `Pricing tier ${isActive ? 'activated' : 'deactivated'}` 
    });
  } catch (err) {
    console.error('❌ Error toggling status:', err.message);
    res.status(400).json({ error: err.message });
  }
};

// ============= DELETE OPERATIONS =============

/**
 * Delete pricing tier
 */
exports.deleteTier = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️  Deleting tier: ${id}`);

    const tier = await PricingTier.findByIdAndDelete(id);

    if (!tier) return res.status(404).json({ error: 'Tier not found' });

    console.log(`✅ Tier deleted: ${tier.name}`);
    res.json({ 
      message: 'Pricing tier deleted successfully',
      deletedId: id
    });
  } catch (err) {
    console.error('❌ Error deleting tier:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ============= ANALYTICS =============

/**
 * Get pricing tier statistics
 */
exports.getTierStats = async (req, res) => {
  try {
    console.log('📊 Calculating tier statistics');

    const tiers = await PricingTier.find({ isActive: true }).lean();
    const stats = {
      totalTiers: tiers.length,
      byType: {},
      byDiscountType: {},
      averageDiscount: 0,
      maxDiscount: 0
    };

    let totalDiscount = 0;

    for (const tier of tiers) {
      // By type
      stats.byType[tier.tierType] = (stats.byType[tier.tierType] || 0) + 1;

      // By discount type
      stats.byDiscountType[tier.discountType] = (stats.byDiscountType[tier.discountType] || 0) + 1;

      // Calculate averages
      if (tier.discountType === 'percentage') {
        totalDiscount += tier.discountValue;
        stats.maxDiscount = Math.max(stats.maxDiscount, tier.discountValue);
      }
    }

    stats.averageDiscount = tiers.length > 0 ? (totalDiscount / tiers.length).toFixed(2) : 0;

    console.log(`📊 Stats: ${stats.totalTiers} tiers, avg discount: ${stats.averageDiscount}%`);
    res.json({ data: stats });
  } catch (err) {
    console.error('❌ Error calculating stats:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get tier usage report
 */
exports.getTierUsageReport = async (req, res) => {
  try {
    console.log('📋 Generating tier usage report');

    const tiers = await PricingTier.find()
      .sort({ appliedCount: -1 })
      .lean();

    const report = {
      totalTiers: tiers.length,
      activeTiers: tiers.filter(t => t.isActive).length,
      totalApplications: tiers.reduce((sum, t) => sum + t.appliedCount, 0),
      tiersByUsage: tiers.map(t => ({
        name: t.name,
        tierType: t.tierType,
        appliedCount: t.appliedCount,
        discount: `${t.discountValue}${t.discountType === 'percentage' ? '%' : '₹'}`,
        isActive: t.isActive
      }))
    };

    res.json({ data: report });
  } catch (err) {
    console.error('❌ Error generating report:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const prisma = require('../utils/prismaClient');

// Helper replacing Mongoose static getApplicableTier
const getApplicableTier = async (params) => {
  const { quantity, customerType } = params;
  let whereConditions = [{ isActive: true }];

  if (quantity) whereConditions.push({ minQuantity: { lte: quantity } });
  if (customerType) {
    whereConditions.push({ OR: [{ customerType: null }, { customerType: '' }, { customerType }] });
  }

  return await prisma.pricingTier.findFirst({
    where: { AND: whereConditions },
    orderBy: { priority: 'desc' }
  });
};

exports.getAllTiers = async (req, res) => {
  try {
    const { tierType, customerType, isActive, search } = req.query;
    let whereClause = {};

    if (tierType) whereClause.tierType = tierType;
    if (customerType) whereClause.customerType = customerType;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    if (search) whereClause.name = { contains: search };

    const tiers = await prisma.pricingTier.findMany({
      where: whereClause,
      orderBy: [{ tierType: 'asc' }, { priority: 'desc' }]
    });

    res.json({ data: tiers, total: tiers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTierById = async (req, res) => {
  try {
    const tier = await prisma.pricingTier.findUnique({ where: { id: req.params.id } });
    if (!tier) return res.status(404).json({ error: 'Tier not found' });
    res.json({ data: tier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getApplicableTier = async (req, res) => {
  try {
    const { quantity = 0, customerType = null } = req.query;
    const tier = await getApplicableTier({ quantity: parseInt(quantity), customerType });
    res.json({ data: tier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.calculateTieredPrice = async (req, res) => {
  try {
    const { basePrice, quantity = 0, customerType = null } = req.body;
    if (!basePrice) return res.status(400).json({ error: 'basePrice is required' });

    const tier = await getApplicableTier({ quantity: parseInt(quantity), customerType });
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
          id: tier.id, _id: tier.id, name: tier.name,
          discountType: tier.discountType, discountValue: tier.discountValue
        } : null,
        finalPrice,
        savings,
        savingsPercentage: basePrice > 0 ? ((savings / basePrice) * 100).toFixed(2) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTier = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.minQuantity) data.minQuantity = parseInt(data.minQuantity);
    if (data.maxQuantity) data.maxQuantity = parseInt(data.maxQuantity);
    if (data.discountValue) data.discountValue = parseFloat(data.discountValue);
    if (data.priority) data.priority = parseInt(data.priority);
    // Ignore applicableProducts arrays for loose emulation
    if (data.applicableProducts) delete data.applicableProducts;
    if (data.applicableVariants) delete data.applicableVariants;

    const tier = await prisma.pricingTier.create({ data });
    res.status(201).json({ data: tier, message: 'Pricing tier created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.createBulkTiers = async (req, res) => {
  try {
    const { tiers } = req.body;
    if (!Array.isArray(tiers) || tiers.length === 0) return res.status(400).json({ error: 'tiers array is required' });

    const cleanedTiers = tiers.map(t => {
      const data = { ...t };
      if (data.applicableProducts) delete data.applicableProducts;
      if (data.applicableVariants) delete data.applicableVariants;
      return data;
    });

    await prisma.pricingTier.createMany({ data: cleanedTiers });
    res.status(201).json({ data: cleanedTiers, message: 'Pricing tiers created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateTier = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.applicableProducts) delete data.applicableProducts;
    if (data.applicableVariants) delete data.applicableVariants;

    const tier = await prisma.pricingTier.update({
      where: { id: req.params.id },
      data
    });
    res.json({ data: tier, message: 'Pricing tier updated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.toggleTierStatus = async (req, res) => {
  try {
    const tier = await prisma.pricingTier.update({
      where: { id: req.params.id },
      data: { isActive: req.body.isActive }
    });
    res.json({ data: tier, message: `Pricing tier updated` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteTier = async (req, res) => {
  try {
    const tier = await prisma.pricingTier.delete({ where: { id: req.params.id } });
    res.json({ message: 'Pricing tier deleted successfully', deletedId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTierStats = async (req, res) => {
  try {
    const tiers = await prisma.pricingTier.findMany({ where: { isActive: true } });
    const stats = { totalTiers: tiers.length, byType: {}, byDiscountType: {}, averageDiscount: 0, maxDiscount: 0 };
    let totalDiscount = 0;

    for (const tier of tiers) {
      stats.byType[tier.tierType] = (stats.byType[tier.tierType] || 0) + 1;
      stats.byDiscountType[tier.discountType] = (stats.byDiscountType[tier.discountType] || 0) + 1;
      if (tier.discountType === 'percentage') {
        totalDiscount += tier.discountValue;
        stats.maxDiscount = Math.max(stats.maxDiscount, tier.discountValue);
      }
    }
    stats.averageDiscount = tiers.length > 0 ? (totalDiscount / tiers.length).toFixed(2) : 0;
    res.json({ data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTierUsageReport = async (req, res) => {
  try {
    const tiers = await prisma.pricingTier.findMany({ orderBy: { appliedCount: 'desc' } });
    const report = {
      totalTiers: tiers.length,
      activeTiers: tiers.filter(t => t.isActive).length,
      totalApplications: tiers.reduce((sum, t) => sum + t.appliedCount, 0),
      tiersByUsage: tiers.map(t => ({
        name: t.name, tierType: t.tierType, appliedCount: t.appliedCount,
        discount: `${t.discountValue}${t.discountType === 'percentage' ? '%' : '₹'}`,
        isActive: t.isActive
      }))
    };
    res.json({ data: report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

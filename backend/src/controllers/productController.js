const prisma = require('../utils/prismaClient');
const { 
  PRODUCT_RULES, 
  generateDisplayName, 
  validateVariantData,
  PREDEFINED_SIZES,
  COLOR_OPTIONS 
} = require('../utils/productUtils');

/**
 * GET Product Masters
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await prisma.productMaster.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, count: products.length, data: products || [] });
  } catch (err) {
    console.error("❌ Products Error:", err);
    res.status(200).json({ success: false, data: [] });
  }
};

/**
 * GET Variants
 * 🎯 FIXED PER USER REQUIREMENTS
 */
exports.getVariants = async (req, res) => {
  try {
    const { productId } = req.query;
    if (!productId) return res.json({ success: true, data: [] });

    const variants = await prisma.productVariant.findMany({
      where: { productId: productId, isActive: true },
      include: { productMaster: true, inventory: true }
    });

    const mapped = (variants || []).map(v => ({
      ...v,
      _id: v.id,
      quantity: v.inventory?.quantity || 0,
      price: v.inventory?.price || v.price || 0,
      productId: { ...(v.productMaster || {}), _id: v.productMaster?.id }
    }));

    res.status(200).json({ success: true, count: mapped.length, data: mapped || [] });
  } catch (error) {
    console.error("❌ Variant Error:", error);
    res.status(200).json({ success: false, data: [] });
  }
};

/**
 * GET Single Product with Variants
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.productMaster.findUnique({
      where: { id },
      include: {
        variants: {
          where: { isActive: true },
          include: { inventory: true }
        }
      }
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const mappedVariants = product.variants.map(v => ({
      ...v,
      _id: v.id,
      quantity: v.inventory?.quantity || 0,
      price: v.inventory?.price || v.price
    }));
    res.status(200).json({ success: true, data: { ...product, variants: mappedVariants } });
  } catch (err) { next(err); }
};

/**
 * CREATE Product Master
 */
exports.createProduct = async (req, res, next) => {
  try {
    const { name, materialType } = req.body;
    if (!name) return res.status(400).json({ message: 'Product Name is required' });
    
    // Auto-resolve rules if material type is provided
    let ruleData = { hasGSM: true, hasSize: true, hasColor: false };
    if (materialType) {
      const rules = PRODUCT_RULES[materialType];
      if (rules) {
        ruleData = { 
          hasGSM: rules.hasGSM, 
          hasSize: rules.hasSize, 
          hasColor: rules.hasColor 
        };
      }
    }

    const product = await prisma.productMaster.create({
      data: { 
        name, 
        materialType: materialType || null, 
        ...ruleData 
      }
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

/**
 * UPDATE Product Master
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, materialType } = req.body;
    
    // Auto-resolve rules if material type is changed
    let updateData = { name, materialType };
    if (materialType) {
      const rules = PRODUCT_RULES[materialType];
      if (rules) {
        updateData.hasGSM = rules.hasGSM;
        updateData.hasSize = rules.hasSize;
        updateData.hasColor = rules.hasColor;
      }
    }

    const product = await prisma.productMaster.update({
      where: { id },
      data: updateData
    });
    
    res.status(200).json({ success: true, data: product });
  } catch (err) { next(err); }
};

/**
 * DELETE Product Master
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 🎯 TASK 2: Prevent deletion if variants exist
    const variantCount = await prisma.productVariant.count({
      where: { productId: id, isActive: true }
    });

    if (variantCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete product. It has ${variantCount} active variants. Delete variants first.` 
      });
    }

    await prisma.productMaster.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(200).json({ success: true, message: 'Product Master deleted successfully' });
  } catch (err) { next(err); }
};

/**
 * CREATE Variant
 */
exports.createVariant = async (req, res, next) => {
  try {
    const { productId, size, gsm, color, price } = req.body;
    const product = await prisma.productMaster.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: 'Product Master not found' });
    const displayName = generateDisplayName(product.name, size, gsm, color);
    const result = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: { productId, size: size || null, gsm: gsm ? Number(gsm) : null, color: color || null, price: parseFloat(price) || 0, displayName }
      });
      await tx.inventory.create({ data: { variantId: variant.id, quantity: 0, price: parseFloat(price) || 0 } });
      return variant;
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

/**
 * UNIFIED CREATE FULL PRODUCT (New Category + Variant OR Existing + Variant)
 */
exports.createFullProduct = async (req, res, next) => {
  try {
    const { 
      productId, 
      name, 
      materialType, 
      attributes, 
      variant, 
      price 
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      let activeProductMaster;

      if (productId) {
        // Mode 1: Use Existing
        activeProductMaster = await tx.productMaster.findUnique({ where: { id: productId } });
        if (!activeProductMaster) throw new Error('Product Master not found');
      } else {
        // Mode 2: Create New
        if (!name) throw new Error('Product Name is required for new products');
        
        activeProductMaster = await tx.productMaster.create({
          data: {
            name,
            materialType: materialType || null,
            hasGSM: !!attributes?.gsm,
            hasSize: !!attributes?.size,
            hasColor: !!attributes?.color,
            isActive: true
          }
        });
      }

      // 2. Generate Display Name
      const displayName = generateDisplayName(
        activeProductMaster.name, 
        variant?.size, 
        variant?.gsm, 
        variant?.color
      );

      // 3. Create Variant
      const newVariant = await tx.productVariant.create({
        data: {
          productId: activeProductMaster.id,
          size: variant?.size || null,
          gsm: variant?.gsm ? Number(variant.gsm) : null,
          color: variant?.color || null,
          price: parseFloat(price) || 0,
          displayName,
          isActive: true
        }
      });

      // 4. Create Inventory record
      await tx.inventory.create({
        data: {
          variantId: newVariant.id,
          quantity: 0,
          price: parseFloat(price) || 0
        }
      });

      return { productMaster: activeProductMaster, variant: newVariant };
    });

    res.status(201).json({ 
      success: true, 
      message: productId ? 'Variant added successfully' : 'Product and variant created successfully',
      data: result 
    });
  } catch (err) {
    console.error("❌ createFullProduct error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * GET All Variants
 */
exports.getAllVariants = async (req, res, next) => {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { isActive: true },
      include: { productMaster: true, inventory: true },
      orderBy: { displayName: 'asc' }
    });
    const mapped = variants.map(v => ({
      ...v,
      _id: v.id,
      quantity: v.inventory?.quantity || 0,
      price: v.inventory?.price || v.price,
      productId: { ...(v.productMaster || {}), _id: v.productMaster?.id }
    }));
    res.status(200).json({ success: true, count: mapped.length, data: mapped || [] });
  } catch (err) { next(err); }
};

/**
 * UPDATE Variant
 */
exports.updateVariant = async (req, res, next) => {
  try {
    const variant = await prisma.productVariant.findUnique({ where: { id: req.params.id }, include: { productMaster: true } });
    if (!variant) return res.status(404).json({ message: 'Variant not found' });
    const { size, gsm, color, price } = req.body;
    const displayName = generateDisplayName(variant.productMaster.name, size ?? variant.size, gsm ? Number(gsm) : variant.gsm, color ?? variant.color);
    const updated = await prisma.productVariant.update({
      where: { id: req.params.id },
      data: { size, gsm: gsm ? Number(gsm) : undefined, color, price: price ? parseFloat(price) : undefined, displayName }
    });
    res.status(200).json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.getProductConfiguration = async (req, res) => res.status(200).json(PRODUCT_RULES);
exports.getMaterialOptions = async (req, res) => res.status(200).json(Object.keys(PRODUCT_RULES));
exports.getGSMOptions = async (req, res) => {
  try {
    const product = await prisma.productMaster.findUnique({ where: { id: req.query.productId } });
    res.status(200).json(PRODUCT_RULES[product?.materialType]?.gsmOptions || []);
  } catch (err) { res.json([]); }
};
exports.getSizeOptions = async (req, res) => res.json(PREDEFINED_SIZES);
exports.getColorOptions = async (req, res) => res.json(COLOR_OPTIONS);

exports.getVariantById = async (req, res) => {
  try {
    const variant = await prisma.productVariant.findUnique({ where: { id: req.params.id }, include: { productMaster: true, inventory: true } });
    res.status(200).json({ success: true, data: { ...variant, _id: variant?.id } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.deleteVariant = async (req, res) => {
  try {
    await prisma.productVariant.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.status(200).json({ success: true, message: 'Deactivated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

const prisma = require('../utils/prismaClient');
const { PRODUCTS } = require('../data/productDefinitions');

// ============================================================================
// GET PRODUCT DEFINITIONS & DROPDOWNS
// ============================================================================

exports.getProductDefinitions = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: PRODUCTS });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getProductOptions = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = PRODUCTS[productId.toUpperCase()];
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.status(200).json({ success: true, data: { gsmOptions: product.gsmOptions, sizeOptions: product.sizeOptions, colorOptions: product.colorOptions } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// INVENTORY OPERATIONS
// ============================================================================

/**
 * GET /api/inventory
 */
exports.getAllInventory = async (req, res) => {
  try {
    const { search, limit = 1000 } = req.query;
    let whereClause = { isActive: true };

    if (search && search.trim()) {
      const searchTerm = search.trim();
      const variants = await prisma.productVariant.findMany({
        where: {
          OR: [
            { displayName: { contains: searchTerm } },
            { sku: { contains: searchTerm } },
            { size: { contains: searchTerm } },
            { color: { contains: searchTerm } }
          ]
        },
        select: { id: true }
      });
      whereClause.variantId = { in: variants.map(v => v.id) };
    }

    const items = await prisma.inventory.findMany({
      where: whereClause,
      include: {
        variant: {
          include: {
            productMaster: true
          }
        }
      },
      take: parseInt(limit),
      orderBy: { updatedAt: 'desc' }
    });

    const transformedItems = items.map(item => {
      const v = item.variant || {};
      const pm = v.productMaster || {};

      return {
        _id: item.id,
        id: item.id,
        name: v.displayName || "Unknown Product",
        quantity: item.quantity || 0,
        price: item.price || v.price || 0,
        minimumStockLevel: item.minimumStockLevel || 0,
        isActive: item.isActive,
        variantId: {
          ...v,
          _id: v.id,
          productId: { ...pm, _id: pm.id }
        },
        variant: {
          ...v,
          _id: v.id,
          productMaster: { ...pm, _id: pm.id },
          productId: { ...pm, _id: pm.id }
        },
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    });

    console.log("📦 Billing Items fetched:", transformedItems.length);
    res.status(200).json({
      success: true,
      count: transformedItems.length,
      data: transformedItems
    });

  } catch (error) {
    console.error("❌ Inventory Error:", error);
    res.status(500).json({ success: false, error: error.message, data: [] });
  }
};

/**
 * GET /api/inventory/:inventoryId
 */
exports.getInventoryById = async (req, res) => {
  try {
    const item = await prisma.inventory.findUnique({
      where: { id: req.params.inventoryId },
      include: { variant: { include: { productMaster: true } } }
    });
    
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });

    const v = item.variant || {};
    const pm = v.productMaster || {};

    const transformed = {
      ...item,
      _id: item.id,
      variantId: {
        ...v,
        _id: v.id,
        productId: { ...pm, _id: pm.id }
      }
    };

    res.json({ success: true, data: transformed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PUT /api/inventory/:inventoryId
 */
exports.updateInventory = async (req, res) => {
  try {
    const { quantity, price, minimumStockLevel } = req.body;
    const updateData = {};
    if (quantity !== undefined) updateData.quantity = Math.max(0, parseInt(quantity));
    if (price !== undefined) updateData.price = Math.max(0, parseFloat(price));
    if (minimumStockLevel !== undefined) updateData.minimumStockLevel = parseInt(minimumStockLevel);

    const item = await prisma.inventory.update({
      where: { id: req.params.inventoryId },
      data: updateData,
      include: { variant: { include: { productMaster: true } } }
    });

    const v = item.variant || {};
    const pm = v.productMaster || {};

    const transformed = {
      ...item,
      _id: item.id,
      variantId: {
        ...v,
        _id: v.id,
        productId: { ...pm, _id: pm.id }
      }
    };

    res.json({ success: true, data: transformed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /api/inventory/:inventoryId
 */
exports.deleteInventory = async (req, res) => {
  try {
    await prisma.inventory.update({
      where: { id: req.params.inventoryId },
      data: { isActive: false }
    });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * BULK UPDATE
 */
exports.bulkUpdateInventory = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) return res.status(400).json({ success: false, error: 'Array required' });

    const results = [];
    for (const up of updates) {
      const id = up.id || up._id;
      if (!id) continue;
      const updated = await prisma.inventory.update({
        where: { id },
        data: {
          quantity: up.quantity !== undefined ? parseInt(up.quantity) : undefined,
          price: up.price !== undefined ? parseFloat(up.price) : undefined
        }
      });
      results.push(updated);
    }
    res.json({ success: true, updated: results.length, data: results });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

/**
 * SEARCH / FILTER
 */
exports.searchInventory = async (req, res) => {
  try {
    const { productName, gsm, size, color } = req.query;
    let variantWhere = { isActive: true };
    if (productName) variantWhere.productMaster = { name: { contains: productName } };
    if (gsm) variantWhere.gsm = parseInt(gsm);
    if (size) variantWhere.size = size;
    if (color) variantWhere.color = color;

    const items = await prisma.inventory.findMany({
      where: { isActive: true, variant: variantWhere },
      include: { variant: { include: { productMaster: true } } }
    });

    res.json({ success: true, count: items.length, data: items.map(i => ({ ...i, _id: i.id })) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

/**
 * LOW STOCK
 */
exports.getLowStock = async (req, res) => {
  try {
    const items = await prisma.inventory.findMany({
      where: { isActive: true },
      include: { variant: { include: { productMaster: true } } }
    });
    const lowStock = items.filter(i => i.quantity < (i.minimumStockLevel || 50));
    res.json({ success: true, count: lowStock.length, data: lowStock.map(i => ({ ...i, _id: i.id })) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

/**
 * GET BY PRODUCT
 */
exports.getByProduct = async (req, res) => {
  try {
    const { productName } = req.params;
    const items = await prisma.inventory.findMany({
      where: { isActive: true, variant: { productMaster: { name: productName } } },
      include: { variant: { include: { productMaster: true } } }
    });
    res.json({ success: true, count: items.length, data: items.map(i => ({ ...i, _id: i.id })) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

/**
 * STOCK IN
 */
exports.addStock = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { quantity } = req.body;
    const addQty = parseInt(quantity) || 0;
    const updated = await prisma.inventory.update({
      where: { id: inventoryId },
      data: { quantity: { increment: addQty } },
      include: { variant: { include: { productMaster: true } } }
    });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

/**
 * STOCK OUT
 */
exports.reduceStock = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { quantity } = req.body;
    const subQty = parseInt(quantity) || 0;
    const item = await prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (item.quantity < subQty) return res.status(400).json({ success: false, error: 'Insufficient stock' });
    const updated = await prisma.inventory.update({
      where: { id: inventoryId },
      data: { quantity: { decrement: subQty } },
      include: { variant: { include: { productMaster: true } } }
    });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

module.exports = exports;

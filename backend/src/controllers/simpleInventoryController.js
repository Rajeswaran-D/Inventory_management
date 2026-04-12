const prisma = require('../utils/prismaClient');

// Add a new inventory item
exports.addSimpleInventoryItem = async (req, res) => {
  try {
    const { productName, variantType, variantValue, price, stock } = req.body;

    // Validation
    if (!productName || !variantType || !variantValue) {
      return res.status(400).json({ success: false, message: "Product name, variant type, and variant value are required" });
    }
    if (price === undefined || stock === undefined) {
      return res.status(400).json({ success: false, message: "Price and stock are required" });
    }
    if (Number(price) <= 0) {
      return res.status(400).json({ success: false, message: "Price must be greater than 0" });
    }
    if (Number(stock) < 0) {
      return res.status(400).json({ success: false, message: "Stock cannot be negative" });
    }

    const existing = await prisma.simpleInventoryItem.findFirst({
      where: {
        productName: productName.trim().toLowerCase(),
        variantType: variantType.trim().toLowerCase(),
        variantValue: variantValue.trim()
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `${productName} - ${variantType}: ${variantValue} already exists in inventory`
      });
    }

    const newItem = await prisma.simpleInventoryItem.create({
      data: {
        productName: productName.trim(),
        variantType: variantType.trim(),
        variantValue: variantValue.trim(),
        price: Number(price),
        stock: Number(stock)
      }
    });

    res.status(201).json({ success: true, message: "Product added to inventory successfully", data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding inventory item", error: error.message });
  }
};

exports.getAllSimpleInventoryItems = async (req, res) => {
  try {
    const items = await prisma.simpleInventoryItem.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, message: "Inventory items retrieved", data: items, count: items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving inventory items", error: error.message });
  }
};

exports.getSimpleProductNames = async (req, res) => {
  try {
    const items = await prisma.simpleInventoryItem.findMany({
      select: { productName: true },
      distinct: ['productName']
    });
    const sorted = items.map(i => i.productName).sort();
    res.status(200).json({ success: true, data: sorted });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving product names", error: error.message });
  }
};

exports.getSimpleVariantsForProduct = async (req, res) => {
  try {
    const { productName } = req.params;
    const variants = await prisma.simpleInventoryItem.findMany({
      where: { productName: productName.toLowerCase() },
      select: { id: true, variantType: true, variantValue: true, price: true, stock: true }
    });
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving variants", error: error.message });
  }
};

exports.searchSimpleInventory = async (req, res) => {
  try {
    const { query, variantType } = req.query;
    let whereClause = {};

    if (query) {
      whereClause.productName = { contains: query.toLowerCase() };
    }
    if (variantType) {
      whereClause.variantType = { contains: variantType.toLowerCase() };
    }

    const items = await prisma.simpleInventoryItem.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: items, count: items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error searching inventory", error: error.message });
  }
};

exports.deleteSimpleInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.simpleInventoryItem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Inventory item not found" });

    const item = await prisma.simpleInventoryItem.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Inventory item deleted successfully", data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting inventory item", error: error.message });
  }
};

exports.updateSimpleInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, stock } = req.body;

    if (price !== undefined && Number(price) <= 0) return res.status(400).json({ success: false, message: "Price must be greater than 0" });
    if (stock !== undefined && Number(stock) < 0) return res.status(400).json({ success: false, message: "Stock cannot be negative" });

    const updateData = {};
    if (price !== undefined) updateData.price = Number(price);
    if (stock !== undefined) updateData.stock = Number(stock);

    const existing = await prisma.simpleInventoryItem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Inventory item not found" });

    const item = await prisma.simpleInventoryItem.update({
      where: { id },
      data: updateData
    });
    res.status(200).json({ success: true, message: "Inventory item updated successfully", data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating inventory item", error: error.message });
  }
};

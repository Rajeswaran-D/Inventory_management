const SimpleInventoryItem = require("../models/SimpleInventoryItem");

// Add a new inventory item
exports.addSimpleInventoryItem = async (req, res) => {
  try {
    const { productName, variantType, variantValue, price, stock } = req.body;

    // Validation
    if (!productName || !variantType || !variantValue) {
      return res.status(400).json({
        success: false,
        message: "Product name, variant type, and variant value are required"
      });
    }

    if (price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Price and stock are required"
      });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0"
      });
    }

    if (Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative"
      });
    }

    // Check for duplicate entry (case-insensitive)
    const existing = await SimpleInventoryItem.findOne({
      productName: productName.trim().toLowerCase(),
      variantType: variantType.trim().toLowerCase(),
      variantValue: variantValue.trim()
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `${productName} - ${variantType}: ${variantValue} already exists in inventory`
      });
    }

    // Create new item
    const newItem = new SimpleInventoryItem({
      productName: productName.trim(),
      variantType: variantType.trim(),
      variantValue: variantValue.trim(),
      price: Number(price),
      stock: Number(stock)
    });

    await newItem.save();

    res.status(201).json({
      success: true,
      message: "Product added to inventory successfully",
      data: newItem
    });
  } catch (error) {
    console.error("Error adding inventory item:", error);
    res.status(500).json({
      success: false,
      message: "Error adding inventory item",
      error: error.message
    });
  }
};

// Get all inventory items
exports.getAllSimpleInventoryItems = async (req, res) => {
  try {
    const items = await SimpleInventoryItem.find()
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Inventory items retrieved",
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error("Error getting inventory items:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving inventory items",
      error: error.message
    });
  }
};

// Get unique product names
exports.getSimpleProductNames = async (req, res) => {
  try {
    const products = await SimpleInventoryItem.distinct("productName");
    const sorted = products.sort();

    res.status(200).json({
      success: true,
      data: sorted
    });
  } catch (error) {
    console.error("Error getting product names:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving product names",
      error: error.message
    });
  }
};

// Get variants for a product
exports.getSimpleVariantsForProduct = async (req, res) => {
  try {
    const { productName } = req.params;

    const variants = await SimpleInventoryItem.find({
      productName: productName.toLowerCase()
    }).select("variantType variantValue price stock _id").lean();

    res.status(200).json({
      success: true,
      data: variants
    });
  } catch (error) {
    console.error("Error getting variants:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving variants",
      error: error.message
    });
  }
};

// Search inventory items
exports.searchSimpleInventory = async (req, res) => {
  try {
    const { query, variantType } = req.query;
    let filter = {};

    if (query) {
      filter.productName = { $regex: query.toLowerCase(), $options: "i" };
    }

    if (variantType) {
      filter.variantType = { $regex: variantType.toLowerCase(), $options: "i" };
    }

    const items = await SimpleInventoryItem.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error("Error searching inventory:", error);
    res.status(500).json({
      success: false,
      message: "Error searching inventory",
      error: error.message
    });
  }
};

// Delete inventory item
exports.deleteSimpleInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await SimpleInventoryItem.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully",
      data: item
    });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting inventory item",
      error: error.message
    });
  }
};

// Update inventory item (price/stock)
exports.updateSimpleInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, stock } = req.body;

    if (price !== undefined && Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0"
      });
    }

    if (stock !== undefined && Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative"
      });
    }

    const updateData = {};
    if (price !== undefined) updateData.price = Number(price);
    if (stock !== undefined) updateData.stock = Number(stock);

    const item = await SimpleInventoryItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      data: item
    });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    res.status(500).json({
      success: false,
      message: "Error updating inventory item",
      error: error.message
    });
  }
};

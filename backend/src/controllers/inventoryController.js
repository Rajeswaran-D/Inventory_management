/**
 * SIMPLIFIED PRODUCT & INVENTORY CONTROLLER
 * 
 * Handles:
 * - Loading products and inventory
 * - Getting dropdown options
 * - Updating inventory
 */

const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { PRODUCTS, validateSelection } = require('../data/productDefinitions');

// ============================================================================
// GET PRODUCT DEFINITIONS & DROPDOWNS
// ============================================================================

/**
 * GET /api/products/definitions
 * Returns all fixed product definitions with specifications
 */
exports.getProductDefinitions = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: PRODUCTS
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/products/options/:productId
 * Returns GSM, Size, Color options for a specific product
 */
exports.getProductOptions = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = PRODUCTS[productId.toUpperCase()];

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        gsmOptions: product.gsmOptions,
        sizeOptions: product.sizeOptions,
        colorOptions: product.colorOptions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// INVENTORY OPERATIONS
// ============================================================================

/**
 * GET /api/inventory
 * Returns all inventory items with product details
 * Supports search params: ?search=value (searches across all product fields)
 */
exports.getAllInventory = async (req, res) => {
  try {
    const { search, limit = 100 } = req.query;
    
    let query = { isActive: true };

    // If search param provided, build regex search across all product fields
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      
      // First find matching variants
      const variants = await require('../models/ProductVariant').find({
        $or: [
          { displayName: searchRegex },
          { sku: searchRegex },
          { size: searchRegex },
          { color: searchRegex }
        ]
      });

      const variantIds = variants.map(v => v._id);
      query.variantId = { $in: variantIds };
    }

    const items = await require('../models/Inventory').find(query)
      .populate({
        path: 'variantId',
        populate: { path: 'productId' }
      })
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 });

    // Transform data for frontend
    const transformedItems = items.map(item => ({
      _id: item._id,
      quantity: item.quantity,
      price: item.price,
      minimumStockLevel: item.minimumStockLevel,
      isActive: item.isActive,
      variant: item.variantId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: transformedItems.length,
      data: transformedItems
    });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/inventory/:inventoryId
 * Get specific inventory item
 */
exports.getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.inventoryId)
      .populate({
        path: 'variantId',
        populate: { path: 'productId' }
      });
    
    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PUT /api/inventory/:inventoryId
 * Update inventory (quantity and price)
 */
exports.updateInventory = async (req, res) => {
  try {
    const { quantity, price } = req.body;

    if (quantity === undefined && price === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Provide at least quantity or price to update' 
      });
    }

    const updates = {};
    if (quantity !== undefined) updates.quantity = Math.max(0, quantity);
    if (price !== undefined) updates.price = Math.max(0, price);

    const item = await Inventory.findByIdAndUpdate(
      req.params.inventoryId,
      updates,
      { new: true }
    ).populate({
      path: 'variantId',
      populate: { path: 'productId' }
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }

    res.status(200).json({
      success: true,
      data: item,
      message: 'Inventory updated successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /api/inventory/:inventoryId
 * Delete inventory item (soft delete)
 */
exports.deleteInventory = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.inventoryId,
      { isActive: false },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// SEARCH & FILTERING
// ============================================================================

/**
 * GET /api/inventory/search
 * Search inventory by product specs
 * ?productName=Maplitho&gsm=80&size=9x6
 */
exports.searchInventory = async (req, res) => {
  try {
    const { productName, gsm, size, color } = req.query;
    
    // Build product filter
    const productFilter = { isActive: true };

    if (productName) productFilter.productName = productName;
    if (gsm && gsm !== 'null' && gsm !== '') productFilter.gsm = parseInt(gsm);
    if (size && size !== 'null' && size !== '') productFilter.size = size;
    if (color && color !== 'null' && color !== '') productFilter.color = color;

    // Step 1: Find matching products
    const matchingProducts = await Product.find(productFilter);
    const productIds = matchingProducts.map(p => p._id);

    console.log('🔍 Search filter:', productFilter);
    console.log('   Found products:', productIds.length);

    // Step 2: Find inventory items for these products
    const inventoryFilter = { 
      isActive: true,
      productId: { $in: productIds }
    };

    const results = await Inventory.find(inventoryFilter)
      .populate('productId')
      .sort({ 'productId.productName': 1, 'productId.gsm': 1, 'productId.size': 1 });

    console.log('   Found inventory items:', results.length);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/inventory/low-stock
 * Get low stock items (below minimumStockLevel)
 */
exports.getLowStock = async (req, res) => {
  try {
    const items = await Inventory.find({
      isActive: true,
      $expr: { $lt: ['$quantity', '$minimumStockLevel'] }
    })
      .populate('productId')
      .sort({ quantity: 1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/inventory/product/:productName
 * Get all inventory for a specific product
 */
exports.getByProduct = async (req, res) => {
  try {
    const { productName } = req.params;

    const items = await Inventory.find({ isActive: true })
      .populate({
        path: 'productId',
        match: { productName: productName }
      });

    const results = items.filter(item => item.productId !== null);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * POST /api/inventory/bulk-update
 * Update multiple inventory items at once
 * Body: { updates: [{ id, quantity, price }, ...] }
 */
exports.bulkUpdateInventory = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ success: false, error: 'updates must be an array' });
    }

    const results = [];
    for (const update of updates) {
      const { id, ...data } = update;
      const item = await Inventory.findByIdAndUpdate(
        id,
        data,
        { new: true }
      ).populate('productId');
      if (item) results.push(item);
    }

    res.status(200).json({
      success: true,
      updated: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = exports;

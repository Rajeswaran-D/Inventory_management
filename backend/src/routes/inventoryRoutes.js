/**
 * SIMPLIFIED INVENTORY ROUTES
 * Clean, simple inventory management
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// ============================================================================
// INVENTORY CRUD
// ============================================================================

/**
 * GET /api/inventory - Get all inventory items
 */
router.get('/', inventoryController.getAllInventory);

/**
 * GET /api/inventory/search - Search inventory
 */
router.get('/search', inventoryController.searchInventory);

/**
 * GET /api/inventory/low-stock - Get low stock items
 */
router.get('/low-stock', inventoryController.getLowStock);

/**
 * GET /api/inventory/product/:productName - Get inventory for specific product
 */
router.get('/product/:productName', inventoryController.getByProduct);

/**
 * GET /api/inventory/:inventoryId - Get specific inventory item
 */
router.get('/:inventoryId', inventoryController.getInventoryById);

/**
 * PUT /api/inventory/:inventoryId - Update inventory
 */
router.put('/:inventoryId', inventoryController.updateInventory);

/**
 * DELETE /api/inventory/:inventoryId - Delete (soft delete) inventory item
 */
router.delete('/:inventoryId', inventoryController.deleteInventory);

// ============================================================================
// STOCK IN/OUT OPERATIONS
// ============================================================================

/**
 * POST /api/inventory/:inventoryId/stock-in
 * Add quantity to inventory
 */
router.post('/:inventoryId/stock-in', inventoryController.addStock);

/**
 * POST /api/inventory/:inventoryId/stock-out
 * Reduce quantity from inventory
 */
router.post('/:inventoryId/stock-out', inventoryController.reduceStock);

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * POST /api/inventory/bulk-update - Update multiple items
 */
router.post('/bulk-update', inventoryController.bulkUpdateInventory);

module.exports = router;

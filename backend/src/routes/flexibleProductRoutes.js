/**
 * FLEXIBLE PRODUCT ROUTES
 */

const express = require('express');
const productController = require('../controllers/flexibleProductController');

const router = express.Router();

// ==================== PRODUCT ROUTES ====================

// Get all products
router.get('/', productController.getAllProducts);

// Search products
router.get('/search/query', productController.searchProducts);

// Get low stock variants
router.get('/stock/low', productController.getLowStockVariants);

// Get product by ID
router.get('/:productId', productController.getProductById);

// Create new product
router.post('/', productController.createProduct);

// Update product
router.put('/:productId', productController.updateProduct);

// Delete product
router.delete('/:productId', productController.deleteProduct);

// ==================== VARIANT ROUTES ====================

// Get all variants for a product
router.get('/:productId/variants', productController.getVariants);

// Add variant to product
router.post('/:productId/variants', productController.addVariant);

// Update variant
router.put('/:productId/variants/:variantId', productController.updateVariant);

// Delete variant
router.delete('/:productId/variants/:variantId', productController.deleteVariant);

// Reduce variant stock (after sale)
router.patch('/:productId/variants/:variantId/stock', productController.reduceVariantStock);

module.exports = router;

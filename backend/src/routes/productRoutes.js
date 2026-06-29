const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const inventoryController = require('../controllers/inventoryController');
const { protect, isAdmin } = require('../middleware/auth');

// ===== NEW SIMPLIFIED SYSTEM ROUTES =====

// Get fixed product definitions
router.get('/definitions', protect, inventoryController.getProductDefinitions);

// Get options for a product
router.get('/options/:productId', protect, inventoryController.getProductOptions);

// ===== PRODUCT MASTER ROUTES =====

// Get all products
router.get('/master', protect, productController.getAllProducts);

// Get product by ID (with variants)
router.get('/master/:id', protect, productController.getProductById);

// Create new product
router.post('/master', protect, isAdmin, productController.createProduct);

// Update product (add options)
router.put('/master/:id', protect, isAdmin, productController.updateProduct);

// Delete product (soft delete)
router.delete('/master/:id', protect, isAdmin, productController.deleteProduct);

// ===== PRODUCT VARIANT ROUTES =====

// Get all variants
router.get('/variants', protect, productController.getAllVariants);

// Get variant by ID
router.get('/variants/:id', protect, productController.getVariantById);

// Create new variant
router.post('/variants', protect, isAdmin, productController.createVariant);

// Update variant
router.put('/variants/:id', protect, isAdmin, productController.updateVariant);

// Delete variant (with inventory cleanup)
router.delete('/variants/:id', protect, isAdmin, productController.deleteVariant);

// ===== DROPDOWN DATA ROUTES (Dynamic UI Support) =====

// Get product configuration (for conditional field rendering)
router.get('/config', protect, productController.getProductConfiguration);

// Get material options for dropdown
router.get('/dropdowns/materials', protect, productController.getMaterialOptions);

// Get GSM options for a product
router.get('/dropdowns/gsm', protect, productController.getGSMOptions);

// Get size options for a product
router.get('/dropdowns/sizes', protect, productController.getSizeOptions);

// Get color options for a product
router.get('/dropdowns/colors', protect, productController.getColorOptions);

module.exports = router;

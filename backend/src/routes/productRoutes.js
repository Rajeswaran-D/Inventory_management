const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const inventoryController = require('../controllers/inventoryController');

// ===== NEW SIMPLIFIED SYSTEM ROUTES =====

// Get fixed product definitions
router.get('/definitions', inventoryController.getProductDefinitions);

// Get options for a product
router.get('/options/:productId', inventoryController.getProductOptions);

// ===== PRODUCT MASTER ROUTES =====

// Get all products
router.get('/master', productController.getAllProducts);

// Get product by ID (with variants)
router.get('/master/:id', productController.getProductById);

// Create new product
router.post('/master', productController.createProduct);

// Update product (add options)
router.put('/master/:id', productController.updateProduct);

// Delete product (soft delete)
router.delete('/master/:id', productController.deleteProduct);

// ===== PRODUCT VARIANT ROUTES =====

// Get all variants
router.get('/variants', productController.getAllVariants);

// Get variant by ID
router.get('/variants/:id', productController.getVariantById);

// Create new variant
router.post('/variants', productController.createVariant);

// Delete variant (soft delete)
router.delete('/variants/:id', productController.deleteVariant);

// ===== DROPDOWN DATA ROUTES (Dynamic UI Support) =====

// Get product configuration (for conditional field rendering)
router.get('/config', productController.getProductConfiguration);

// Get material options for dropdown
router.get('/dropdowns/materials', productController.getMaterialOptions);

// Get GSM options for a product
router.get('/dropdowns/gsm', productController.getGSMOptions);

// Get size options for a product
router.get('/dropdowns/sizes', productController.getSizeOptions);

// Get color options for a product
router.get('/dropdowns/colors', productController.getColorOptions);

module.exports = router;

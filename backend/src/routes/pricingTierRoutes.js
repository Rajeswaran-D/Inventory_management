/**
 * Pricing Tier Routes
 * Dynamic pricing management endpoints
 */

const express = require('express');
const router = express.Router();
const pricingTierController = require('../controllers/pricingTierController');

// Get operations
router.get('/', pricingTierController.getAllTiers);
router.get('/stats', pricingTierController.getTierStats);
router.get('/usage-report', pricingTierController.getTierUsageReport);
router.get('/applicable', pricingTierController.getApplicableTier);
router.get('/:id', pricingTierController.getTierById);

// Create operations
router.post('/', pricingTierController.createTier);
router.post('/bulk/create', pricingTierController.createBulkTiers);
router.post('/calculate-price', pricingTierController.calculateTieredPrice);

// Update operations
router.put('/:id', pricingTierController.updateTier);
router.patch('/:id/status', pricingTierController.toggleTierStatus);

// Delete operations
router.delete('/:id', pricingTierController.deleteTier);

module.exports = router;

const express = require('express');
const router = express.Router();
const controller = require('../controllers/envelopeController');
const { protect, isAdmin } = require('../middleware/auth');

// Get all envelopes - anyone can view
router.get('/', protect, controller.getAllEnvelopes);

// Get single envelope - anyone can view
router.get('/:id', protect, controller.getEnvelopeById);

// Create envelope - admin only
router.post('/', protect, isAdmin, controller.createEnvelope);

// Update envelope - admin only
router.put('/:id', protect, isAdmin, controller.updateEnvelope);

// Delete envelope - admin only
router.delete('/:id', protect, isAdmin, controller.deleteEnvelope);

module.exports = router;

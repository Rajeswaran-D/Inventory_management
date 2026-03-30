const express = require('express');
const router = express.Router();
const controller = require('../controllers/envelopeController');

router.get('/', controller.getAllEnvelopes);
router.get('/:id', controller.getEnvelopeById);
router.post('/', controller.createEnvelope);
router.put('/:id', controller.updateEnvelope);
router.delete('/:id', controller.deleteEnvelope);

module.exports = router;

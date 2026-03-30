const express = require('express');
const router = express.Router();
const controller = require('../controllers/customerController');

router.get('/', controller.getAllCustomers);
router.post('/get-or-create', controller.getOrCreateCustomer);
router.get('/:id', controller.getCustomerById);

module.exports = router;

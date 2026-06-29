const express = require('express');
const router = express.Router();
const controller = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', controller.getAllCustomers);
router.post('/get-or-create', controller.getOrCreateCustomer);
router.get('/:id', controller.getCustomerById);

module.exports = router;

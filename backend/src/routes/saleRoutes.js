const express = require('express');
const router = express.Router();
const controller = require('../controllers/saleController');

router.post('/', controller.createSale);
router.get('/', controller.getAllSales);
router.get('/top-selling', controller.getTopSelling);
router.get('/dashboard-stats', controller.getDashboardStats);

module.exports = router;

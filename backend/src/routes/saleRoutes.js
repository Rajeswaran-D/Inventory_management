const express = require('express');
const router = express.Router();
const controller = require('../controllers/saleController');

router.post('/', controller.createSale);
router.get('/reports', controller.getReports);
router.get('/top-selling', controller.getTopSelling);
router.get('/dashboard-stats', controller.getDashboardStats);
router.get('/', controller.getAllSales);

module.exports = router;

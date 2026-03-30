const express = require('express');
const router = express.Router();
const controller = require('../controllers/stockController');

router.post('/in', controller.recordStockIn);
router.post('/out', controller.recordStockOut);
router.get('/history', controller.getStockHistory);

module.exports = router;

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/', reportController.getReports);
router.get('/download', reportController.downloadReportExcel);

module.exports = router;

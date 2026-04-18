/**
 * SIMPLIFIED SALES ROUTES
 * Bill generation and retrieval endpoints
 */

const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleControllerSimplified');

// ============================================================================
// ✅ IMPORTANT: SPECIFIC ROUTES FIRST
// ============================================================================

router.get('/reports', saleController.getReports);

router.get('/filter/data', saleController.getFilteredSalesData);

router.get('/search/query', saleController.searchBills);

router.get('/export/excel', saleController.exportToExcel);

router.get('/export/csv', saleController.exportToCSV);

router.get('/stats/data', saleController.getSalesStatistics);

router.get('/summary', saleController.getSalesSummary);

router.get('/pdf/:saleId', saleController.generatePDF);

router.get('/download', saleController.downloadSales);

// ✅ FIXED: move this BEFORE "/:saleId"
router.get('/customer/:customerId', saleController.getSalesByCustomer);

// ============================================================================
// ✅ GENERIC ROUTES
// ============================================================================

router.post('/', saleController.createSale);

router.get('/', saleController.getAllSales);

// ❗ MUST BE LAST (very important)
router.get('/:saleId', saleController.getSaleById);

router.put('/:saleId', saleController.updateBill);

router.delete('/:saleId', saleController.deleteBill);

module.exports = router;
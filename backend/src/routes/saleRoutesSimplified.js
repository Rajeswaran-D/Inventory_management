/**
 * SIMPLIFIED SALES ROUTES
 * Bill generation and retrieval endpoints
 */

const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleControllerSimplified');
const { protect, isAdmin } = require('../middleware/auth');

router.use(protect);

// ============================================================================
// ✅ IMPORTANT: SPECIFIC ROUTES FIRST
// ============================================================================

router.get('/reports', isAdmin, saleController.getReports);

router.get('/filter/data', saleController.getFilteredSalesData);

router.get('/search/query', saleController.searchBills);

router.get('/export/excel', isAdmin, saleController.exportToExcel);

router.get('/export/csv', isAdmin, saleController.exportToCSV);

router.get('/stats/data', saleController.getSalesStatistics);

router.get('/summary', saleController.getSalesSummary);

router.get('/pdf/:saleId', saleController.generatePDF);

router.get('/download', isAdmin, saleController.downloadSales);

// ✅ FIXED: move this BEFORE "/:saleId"
router.get('/customer/:customerId', saleController.getSalesByCustomer);

// ✅ Last bill by phone number
router.get('/by-phone/:phone', saleController.getLastBillByPhone);

// ============================================================================
// ✅ GENERIC ROUTES
// ============================================================================

router.post('/', saleController.createSale);

router.get('/', saleController.getAllSales);

// ❗ MUST BE LAST (very important)
router.get('/:saleId', saleController.getSaleById);

router.put('/:saleId', isAdmin, saleController.updateBill);

router.delete('/:saleId', isAdmin, saleController.deleteBill);

module.exports = router;
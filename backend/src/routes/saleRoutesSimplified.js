/**
 * SIMPLIFIED SALES ROUTES
 * Bill generation and retrieval endpoints
 */

const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleControllerSimplified');

// ============================================================================
// IMPORTANT: SPECIFIC ROUTES FIRST (BEFORE PARAMETERIZED ROUTES)
// ============================================================================

/**
 * GET /api/sales/reports - Get sales reports (for dashboard)
 */
router.get('/reports', saleController.getReports);

/**
 * GET /api/sales/filter/data - Get filtered sales (day/week/month/year)
 * Query: ?filter=today|week|month|year|all&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/filter/data', saleController.getFilteredSalesData);

/**
 * GET /api/sales/search - Search bills by ID or customer name
 * Query: ?query=searchTerm&limit=50
 */
router.get('/search/query', saleController.searchBills);

/**
 * GET /api/sales/export/excel - Export sales to Excel
 * Query: ?filter=today|week|month|year|all&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/export/excel', saleController.exportToExcel);

/**
 * GET /api/sales/export/csv - Export sales to CSV
 * Query: ?filter=today|week|month|year|all&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/export/csv', saleController.exportToCSV);

/**
 * GET /api/sales/stats/data - Get sales statistics
 * Query: ?filter=today|week|month|year|all&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/stats/data', saleController.getSalesStatistics);

/**
 * GET /api/sales/summary - Get sales summary
 * Query: ?period=daily|weekly|monthly
 */
router.get('/summary', saleController.getSalesSummary);

/**
 * GET /api/sales/pdf/:saleId - Generate PDF for a bill
 */
router.get('/pdf/:saleId', saleController.generatePDF);

/**
 * GET /api/sales/download - Download in-depth sales items report
 * Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/download', saleController.downloadSales);

// ============================================================================
// GENERIC ROUTES (AFTER SPECIFIC ROUTES)
// ============================================================================

/**
 * POST /api/sales - Create a new bill
 * Body: { customerName, customerPhone, items[], grandTotal, date? }
 */
router.post('/', saleController.createSale);

/**
 * GET /api/sales - Get all bills
 */
router.get('/', saleController.getAllSales);

/**
 * GET /api/sales/:saleId - Get specific bill
 */
router.get('/:saleId', saleController.getSaleById);

/**
 * PUT /api/sales/:saleId - Update bill (customer info only)
 * Body: { customerName?, customerPhone? }
 */
router.put('/:saleId', saleController.updateBill);

/**
 * DELETE /api/sales/:saleId - Delete a bill
 */
router.delete('/:saleId', saleController.deleteBill);

/**
 * GET /api/sales/customer/:customerId - Get bills for customer
 */
router.get('/customer/:customerId', saleController.getSalesByCustomer);

module.exports = router;

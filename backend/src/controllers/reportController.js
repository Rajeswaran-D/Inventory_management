const ExcelJS = require('exceljs');

const { getInventoryItems, getSales } = require('../lib/store');

function buildDateRange(startDate, endDate) {
  if (startDate && endDate) {
    return {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };
  }

  const defaultStart = new Date();
  defaultStart.setHours(0, 0, 0, 0);
  defaultStart.setDate(defaultStart.getDate() - 30);
  return { startDate: defaultStart, endDate: null };
}

function buildAnalytics(sales, inventory) {
  const revenueByDateMap = new Map();
  const salesCountMap = new Map();
  const productStatsMap = new Map();

  for (const sale of sales) {
    const dateKey = new Date(sale.date).toISOString().slice(0, 10);
    revenueByDateMap.set(dateKey, (revenueByDateMap.get(dateKey) || 0) + sale.grandTotal);
    salesCountMap.set(dateKey, (salesCountMap.get(dateKey) || 0) + 1);

    for (const item of sale.items) {
      const key = item.displayName || item.productName || 'Unknown';
      const current = productStatsMap.get(key) || { name: key, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.itemTotal;
      productStatsMap.set(key, current);
    }
  }

  const lowStock = inventory.filter((item) => item.quantity < (item.minimumStockLevel || 50)).length;
  const sufficientStock = inventory.length - lowStock;

  const revenueByDate = [...revenueByDateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }));

  const salesCount = [...salesCountMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const productStats = [...productStatsMap.values()].sort((a, b) => b.revenue - a.revenue);
  const topProducts = productStats.slice(0, 10).map(({ name, quantity }) => ({ name, quantity }));

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const totalItems = sales.reduce((sum, sale) => sum + sale.items.length, 0);

  return {
    revenueByDate,
    salesCount,
    topProducts,
    lowStockCount: lowStock,
    lowStockAnalytics: [
      { name: 'Low Stock', value: lowStock, fill: '#ef4444' },
      { name: 'Sufficient', value: sufficientStock, fill: '#10b981' },
    ],
    productStats,
    summary: {
      totalSales: sales.length,
      totalRevenue,
      totalItems,
      averageOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0,
    },
  };
}

exports.getReports = async (req, res) => {
  try {
    const { startDate, endDate } = buildDateRange(req.query.startDate, req.query.endDate);
    const sales = await getSales({ startDate, endDate, limit: 5000 });
    const inventory = await getInventoryItems({ limit: 5000, isActive: true });

    res.status(200).json({
      success: true,
      data: buildAnalytics(sales, inventory),
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to generate reports' });
  }
};

exports.downloadReportExcel = async (req, res) => {
  try {
    const { startDate, endDate } = buildDateRange(req.query.startDate, req.query.endDate);
    const sales = await getSales({ startDate, endDate, limit: 5000 });
    const inventory = await getInventoryItems({ limit: 5000, isActive: true });
    const analytics = buildAnalytics(sales, inventory);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    worksheet.columns = [
      { header: 'Product Name', key: 'name', width: 45 },
      { header: 'Quantity Sold', key: 'quantity', width: 20 },
      { header: 'Total Revenue', key: 'revenue', width: 20 },
    ];
    worksheet.getRow(1).font = { bold: true };

    analytics.productStats.forEach((stat) => {
      worksheet.addRow(stat);
    });

    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating detailed report Excel:', err);
    res.status(500).json({ success: false, message: 'Failed to generate Excel file' });
  }
};

const prisma = require('../utils/prismaClient');
const ExcelJS = require('exceljs');

exports.getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery.date = { 
        gte: new Date(startDate), 
        lte: new Date(endDate) 
      };
    } else {
      const defaultStart = new Date();
      defaultStart.setHours(0,0,0,0);
      defaultStart.setDate(defaultStart.getDate() - 30);
      matchQuery.date = { gte: defaultStart };
    }

    // Fetch all applicable sales with items
    const sales = await prisma.sale.findMany({
      where: matchQuery,
      include: { items: true },
      orderBy: { date: 'asc' }
    });

    // 1. Revenue and Sales by Date
    const dailyAnalyticsMap = {};
    sales.forEach(sale => {
      const dateStr = sale.date.toISOString().split('T')[0];
      if (!dailyAnalyticsMap[dateStr]) {
        dailyAnalyticsMap[dateStr] = { revenue: 0, count: 0 };
      }
      dailyAnalyticsMap[dateStr].revenue += sale.grandTotal;
      dailyAnalyticsMap[dateStr].count += 1;
    });

    const revenueByDate = [];
    const salesCount = [];
    Object.keys(dailyAnalyticsMap).sort().forEach(date => {
      revenueByDate.push({ date, revenue: parseFloat(dailyAnalyticsMap[date].revenue.toFixed(2)) });
      salesCount.push({ date, count: dailyAnalyticsMap[date].count });
    });

    // 2. Top Selling Products
    const productStatsMap = {};
    let totalRevenue = 0;
    let totalItems = 0;
    
    sales.forEach(sale => {
      totalRevenue += sale.grandTotal;
      totalItems += sale.items.length;
      sale.items.forEach(item => {
        const name = item.displayName || 'Unknown';
        if (!productStatsMap[name]) {
          productStatsMap[name] = { quantity: 0, revenue: 0 };
        }
        productStatsMap[name].quantity += item.quantity;
        productStatsMap[name].revenue += item.itemTotal;
      });
    });

    const productStatsArr = Object.keys(productStatsMap).map(name => ({
      name,
      quantity: productStatsMap[name].quantity,
      revenue: parseFloat(productStatsMap[name].revenue.toFixed(2))
    }));

    const topProducts = [...productStatsArr].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    const productStats = [...productStatsArr].sort((a, b) => b.revenue - a.revenue);

    // 3. Low Stock Analytics
    const inventory = await prisma.inventory.findMany({ where: { isActive: true } });
    let lowStock = 0;
    let sufficientStock = 0;

    inventory.forEach(item => {
      const minStock = item.minimumStockLevel || 50;
      if (item.quantity < minStock) lowStock++;
      else sufficientStock++;
    });

    const lowStockAnalytics = [
      { name: 'Low Stock', value: lowStock, fill: '#ef4444' }, 
      { name: 'Sufficient', value: sufficientStock, fill: '#10b981' } 
    ];

    const totalSales = sales.length;
    const averageOrderValue = totalSales > 0 ? (totalRevenue / totalSales) : 0;

    res.status(200).json({
      success: true,
      data: {
        revenueByDate,
        salesCount,
        topProducts,
        lowStockCount: lowStock,
        lowStockAnalytics,
        productStats,
        summary: { totalSales, totalRevenue, totalItems, averageOrderValue }
      }
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to generate reports' });
  }
};

exports.downloadReportExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery.date = { gte: new Date(startDate), lte: new Date(endDate) };
    } else {
      const defaultStart = new Date();
      defaultStart.setHours(0,0,0,0);
      defaultStart.setDate(defaultStart.getDate() - 30);
      matchQuery.date = { gte: defaultStart };
    }

    const sales = await prisma.sale.findMany({
      where: matchQuery,
      include: { items: true }
    });

    const productStatsMap = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const name = item.displayName || 'Unknown';
        if (!productStatsMap[name]) productStatsMap[name] = { quantity: 0, revenue: 0 };
        productStatsMap[name].quantity += item.quantity;
        productStatsMap[name].revenue += item.itemTotal;
      });
    });

    const productStats = Object.keys(productStatsMap)
      .map(name => ({
        name,
        quantity: productStatsMap[name].quantity,
        revenue: productStatsMap[name].revenue
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
      { header: 'Product Name', key: 'name', width: 45 },
      { header: 'Quantity Sold', key: 'quantity', width: 20 },
      { header: 'Total Revenue', key: 'revenue', width: 20 }
    ];
    worksheet.getRow(1).font = { bold: true };

    productStats.forEach(stat => worksheet.addRow(stat));

    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating detailed report Excel:', err);
    res.status(500).json({ success: false, message: 'Failed to generate Excel file' });
  }
};

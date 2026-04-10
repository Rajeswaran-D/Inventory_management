const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const ExcelJS = require('exceljs');

exports.getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    } else {
      // Default to last 30 days
      const defaultStart = new Date();
      defaultStart.setHours(0,0,0,0);
      defaultStart.setDate(defaultStart.getDate() - 30);
      matchQuery.date = { $gte: defaultStart };
    }

    // 1. Revenue and Sales by Date
    const dailyAnalytics = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          revenue: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const revenueByDate = dailyAnalytics.map(day => ({
      date: day._id,
      revenue: parseFloat(day.revenue.toFixed(2))
    }));

    const salesCount = dailyAnalytics.map(day => ({
      date: day._id,
      count: day.count
    }));

    // 2. Top Selling Products
    const topProducts = await Sale.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.displayName', 
          quantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 },
      { 
        $project: {
          _id: 0,
          name: { $ifNull: ['$_id', 'Unknown'] },
          quantity: 1
        }
      }
    ]);

    // 3. Low Stock Analytics
    const inventory = await Inventory.find({ isActive: true });
    let lowStock = 0;
    let sufficientStock = 0;

    inventory.forEach(item => {
      const minStock = item.minimumStockLevel || 50;
      if (item.quantity < minStock) {
        lowStock++;
      } else {
        sufficientStock++;
      }
    });

    const lowStockAnalytics = [
      { name: 'Low Stock', value: lowStock, fill: '#ef4444' }, // red-500
      { name: 'Sufficient', value: sufficientStock, fill: '#10b981' } // emerald-500
    ];

    // 4. Complete Product Stats (for detailed view)
    const productStats = await Sale.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.displayName', 
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.itemTotal' }
        }
      },
      { $sort: { revenue: -1 } },
      { 
        $project: {
          _id: 0,
          name: { $ifNull: ['$_id', 'Unknown'] },
          quantity: 1,
          revenue: 1
        }
      }
    ]);

    // 5. Summary Metrics
    const summaryAgg = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$grandTotal' },
          totalItems: { $sum: { $size: '$items' } }
        }
      }
    ]);
    
    const summaryData = summaryAgg[0] || { totalSales: 0, totalRevenue: 0, totalItems: 0 };
    const averageOrderValue = summaryData.totalSales > 0 ? (summaryData.totalRevenue / summaryData.totalSales) : 0;

    res.status(200).json({
      success: true,
      data: {
        revenueByDate,
        salesCount,
        topProducts,
        lowStockCount: lowStock,
        lowStockAnalytics,
        productStats,
        summary: {
          totalSales: summaryData.totalSales,
          totalRevenue: summaryData.totalRevenue,
          totalItems: summaryData.totalItems,
          averageOrderValue: averageOrderValue
        }
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
      matchQuery.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    } else {
      const defaultStart = new Date();
      defaultStart.setHours(0,0,0,0);
      defaultStart.setDate(defaultStart.getDate() - 30);
      matchQuery.date = { $gte: defaultStart };
    }

    const productStats = await Sale.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.displayName', 
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.itemTotal' }
        }
      },
      { $sort: { revenue: -1 } },
      { 
        $project: {
          _id: 0,
          name: { $ifNull: ['$_id', 'Unknown'] },
          quantity: 1,
          revenue: 1
        }
      }
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
      { header: 'Product Name', key: 'name', width: 45 },
      { header: 'Quantity Sold', key: 'quantity', width: 20 },
      { header: 'Total Revenue', key: 'revenue', width: 20 }
    ];
    worksheet.getRow(1).font = { bold: true };

    productStats.forEach(stat => {
      worksheet.addRow({
        name: stat.name,
        quantity: stat.quantity,
        revenue: stat.revenue
      });
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

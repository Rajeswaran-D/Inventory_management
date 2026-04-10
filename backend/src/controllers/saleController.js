const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const ExcelJS = require('exceljs');

// Record a new sale (POS Style)
exports.createSale = async (req, res, next) => {
  try {
    const { customerId, customerName, customerPhone, items, grandTotal, date } = req.body;
    
    console.log('📥 Received sale request:', {
      customerName,
      itemsCount: items?.length,
      grandTotal,
      date
    });

    // ===== VALIDATION LAYER 1: Required Fields =====
    if (!items || items.length === 0) {
      console.error('❌ Validation failed: Missing items or empty array');
      return res.status(400).json({ message: 'Items array is required and cannot be empty' });
    }
    if (typeof grandTotal !== 'number' || grandTotal <= 0) {
      console.error(`❌ Validation failed: Invalid grandTotal: ${grandTotal}`);
      return res.status(400).json({ message: 'Grand total must be a positive number' });
    }

    // ===== VALIDATION LAYER 2: Item-level Validation =====
    console.log('📋 Validating item details...');
    let calculatedTotal = 0;
    const variantIds = items.map(i => i.variantId);
    
    // Fetch all relevant inventories in ONE go
    const inventories = await Inventory.find({ variantId: { $in: variantIds } });
    const inventoryMap = new Map(inventories.map(inv => [inv.variantId._id?.toString() || inv.variantId.toString(), inv]));

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
      // Validate quantity
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: `Item ${i + 1}: Quantity must be greater than 0` });
      }
      // Validate price
      if (!item.price || item.price <= 0) {
        return res.status(400).json({ message: `Item ${i + 1}: Price must be greater than 0` });
      }
      
      const expectedTotal = item.quantity * item.price;
      item.total = expectedTotal; // strictly use expected
      calculatedTotal += expectedTotal;

      const inv = inventoryMap.get(item.variantId);
      if (!inv) {
        return res.status(404).json({ message: `Product variant not found in inventory: ${item.displayName}` });
      }
      if (inv.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.displayName}. Available: ${inv.quantity}, Required: ${item.quantity}` 
        });
      }
    }

    // Verify grandTotal matches sum of items
    if (Math.abs(calculatedTotal - grandTotal) > 0.01) {
      console.warn(`⚠️  Grand total mismatch. Expected: ${calculatedTotal}, Actual: ${grandTotal}. Using calculated.`);
    }

    // ===== TRANSACTION: Save Sale =====
    console.log('💾 Creating sale record...');
    const saleData = {
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      items: items.map(item => ({
        ...item,
        itemTotal: item.total
      })),
      grandTotal: calculatedTotal,
      date: date || new Date()
    };
    if (customerId) {
       saleData.customerId = customerId;
    }
    
    const sale = new Sale(saleData);
    const savedSale = await sale.save();
    console.log('✅ Sale record created:', savedSale._id);

    // ===== TRANSACTION: Update Stock =====
    console.log('📉 Updating inventory values...');
    const stockUpdates = [];
    
    for (const item of items) {
      const inv = inventoryMap.get(item.variantId);
      await Inventory.findByIdAndUpdate(inv._id, { $inc: { quantity: -item.quantity } });
      
      const newQty = inv.quantity - item.quantity;
      stockUpdates.push({
        product: item.displayName,
        quantityRemoved: item.quantity,
        newStock: newQty
      });
      console.log(`    ✅ ${item.displayName}: -${item.quantity} units (${newQty} remaining)`);
    }

    console.log('🎉 Sale creation successful - Revenue: ' + calculatedTotal);
    res.status(201).json({ 
      success: true,
      message: 'Sale recorded successfully and stock updated',
      data: savedSale,
      revenue: calculatedTotal
    });
  } catch (err) {
    console.error('❌ Error in createSale:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET all sales (with analytics context)
exports.getAllSales = async (req, res, next) => {
  try {
    const { startDate, endDate, customerId, limit = 100, skip = 0 } = req.query;
    let query = {};
    if (customerId) query.customerId = customerId;
    if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    const sales = await Sale.find(query)
      .populate('customerId', 'name phone')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const count = await Sale.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: sales,
      count: sales.length,
      total: count,
      message: 'Sales retrieved successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET top-selling variants
exports.getTopSelling = async (req, res, next) => {
  try {
    const topSelling = await Sale.aggregate([
      { $unwind: '$items' },
      { $group: { 
          _id: '$items.variantId', 
          totalQty: { $sum: '$items.quantity' },
          totalRav: { $sum: '$items.itemTotal' },
          displayName: { $first: '$items.displayName' },
          size: { $first: '$items.size' }
        } 
      },
      { $sort: { totalQty: -1 } },
      { $limit: 10 }
    ]);
    res.status(200).json(topSelling);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Dashboard analytics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    const todaySales = await Sale.aggregate([
      { $match: { date: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);

    const totalStockRes = await Inventory.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const totalStock = totalStockRes[0] ? totalStockRes[0].total : 0;

    const lowStockAlerts = await Inventory.find({
      isActive: true,
      $expr: { $lt: ['$quantity', '$minimumStockLevel'] }
    }).sort({ quantity: 1 }).limit(10).populate({
        path: 'variantId',
        populate: { path: 'productId' }
    });

    res.status(200).json({
      success: true,
      todaySales: todaySales[0] || { total: 0, count: 0 },
      totalStock: { total: totalStock },
      lowStockAlerts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Comprehensive Reports Endpoint
exports.getReports = async (req, res, next) => {
  try {
    const now = new Date();
    
    // Function to calculate aggregate per time chunk
    const getAgg = async (start, end) => {
      const matchQuery = end ? { date: { $gte: start, $lte: end } } : { date: { $gte: start } };
      const data = await Sale.aggregate([
        { $match: matchQuery },
        { 
          $group: { 
            _id: null, 
            revenue: { $sum: '$grandTotal' }, 
            salesCount: { $sum: 1 },
            itemsCount: { $sum: { $size: '$items' } }
          } 
        }
      ]);
      return data[0] || { revenue: 0, salesCount: 0, itemsCount: 0 };
    };

    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    
    const yesterdayStart = new Date(now); yesterdayStart.setDate(yesterdayStart.getDate() - 1); yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterdayStart); yesterdayEnd.setHours(23, 59, 59, 999);
    
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const yearStart = new Date(now); yearStart.setMonth(0); yearStart.setDate(1); yearStart.setHours(0, 0, 0, 0);

    const [todayReport, previousReport, weekReport, monthReport, yearReport] = await Promise.all([
      getAgg(todayStart, todayEnd),
      getAgg(yesterdayStart, yesterdayEnd),
      getAgg(weekStart),
      getAgg(monthStart),
      getAgg(yearStart)
    ]);

    // Top Selling Products
    const topSellingData = await Sale.aggregate([
      { $match: { date: { $gte: monthStart } } },
      { $unwind: '$items' },
      { 
        $group: { 
          _id: '$items.variantId', 
          totalQty: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.itemTotal' },
          displayName: { $first: '$items.displayName' },
          size: { $first: '$items.size' }
        } 
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    // Inventory metrics
    const inventoryCount = await Inventory.countDocuments({ isActive: true });
    const stockAgg = await Inventory.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalQty: { $sum: '$quantity' }, totalValue: { $sum: { $multiply: ['$quantity', '$price'] } } } }
    ]);
    const lowStockCount = await Inventory.countDocuments({ isActive: true, $expr: { $lt: ['$quantity', '$minimumStockLevel'] } });

    res.status(200).json({
      success: true,
      data: {
        today: { ...todayReport, period: 'Today' },
        previous: { ...previousReport, period: 'Yesterday' },
        weekly: { ...weekReport, period: 'Last 7 Days' },
        monthly: { ...monthReport, period: 'This Month' },
        yearly: { ...yearReport, period: 'This Year' },
        topSellingProducts: topSellingData,
        inventory: {
            totalProducts: inventoryCount,
            totalStock: stockAgg[0] ? stockAgg[0].totalQty : 0,
            totalStockValue: stockAgg[0] ? stockAgg[0].totalValue : 0,
            lowStockCount: lowStockCount
        },
        generatedAt: new Date()
      },
      message: 'Reports generated successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DOWNLOAD bulk sales report
exports.downloadSales = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    
    const sales = await Sale.find(query).sort({ date: -1 });
    
    if (sales.length === 0) {
      return res.status(404).json({ message: 'No bills found in the selected range' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bills');

    // Make the header bold
    worksheet.columns = [
      { header: 'Bill No', key: 'billNo', width: 25 },
      { header: 'Date', key: 'date', width: 22 },
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'GSTIN', key: 'gstin', width: 20 },
      { header: 'Product Details', key: 'productDetails', width: 45 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Rate', key: 'rate', width: 12 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Grand Total', key: 'grandTotal', width: 15 }
    ];
    
    worksheet.getRow(1).font = { bold: true };

    sales.forEach(sale => {
      const billNo = sale.billNumber || sale._id.toString();
      const date = new Date(sale.date || sale.createdAt).toLocaleDateString('en-IN') + ' ' + new Date(sale.date || sale.createdAt).toLocaleTimeString('en-IN');
      const customerName = sale.customerName || 'Walk-in';
      const grandTotal = sale.grandTotal;

      if (sale.items && sale.items.length > 0) {
        sale.items.forEach((item, index) => {
          worksheet.addRow({
            billNo: index === 0 ? billNo : '',
            date: index === 0 ? date : '',
            customerName: index === 0 ? customerName : '',
            phone: index === 0 ? (sale.customerPhone || '') : '',
            gstin: index === 0 ? (sale.customerGSTIN || '') : '',
            productDetails: item.displayName || item.productName || 'Product',
            quantity: item.quantity,
            rate: item.price,
            amount: item.itemTotal || (item.quantity * item.price),
            grandTotal: index === 0 ? grandTotal : ''
          });
        });
      } else {
        worksheet.addRow({
          billNo: billNo,
          date: date,
          customerName: customerName,
          grandTotal: grandTotal
        });
      }
      
      // Separator row
      worksheet.addRow({});
    });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=bills.xlsx'
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating Excel file:', err);
    res.status(500).json({ success: false, message: 'Failed to generate Excel file' });
  }
};

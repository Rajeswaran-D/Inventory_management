/**
 * SIMPLIFIED SALES CONTROLLER
 * Handles bill generation with inventory tracking
 */

const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const StockTransaction = require('../models/StockTransaction');
const ExcelJS = require('exceljs');
const XLSX = require('xlsx');

// ============================================================================
// CREATE SALE / GENERATE BILL
// ============================================================================

exports.createSale = async (req, res) => {
  try {
    const { customerName, customerPhone, items, grandTotal, date } = req.body;

    console.log('📥 Received sale (bill) request:', {
      customerName,
      itemsCount: items?.length,
      grandTotal,
      date
    });

    // ===== VALIDATION =====
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ message: 'Customer name is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required and cannot be empty' });
    }

    if (typeof grandTotal !== 'number' || grandTotal < 0) {
      return res.status(400).json({ message: 'Grand total must be a non-negative number' });
    }

    // Validate each item
    let calculatedTotal = 0;
    const validatedItems = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: `Item ${i + 1}: Quantity must be greater than 0` });
      }

      if (item.price === undefined || item.price < 0) {
        return res.status(400).json({ message: `Item ${i + 1}: Price cannot be negative` });
      }

      const itemTotal = item.quantity * item.price;
      calculatedTotal += itemTotal;

      validatedItems.push({
        productId: item.productId,
        productName: item.productName || 'Unknown Product',
        gsm: item.gsm || null,
        size: item.size || null,
        color: item.color || null,
        displayName: item.displayName,
        price: item.price,
        quantity: item.quantity,
        itemTotal: itemTotal
      });

      console.log(`  ✅ Item ${i + 1}: ${item.displayName} × ${item.quantity} @ ₹${item.price} = ₹${itemTotal}`);
    }

    // Check grand total
    if (Math.abs(calculatedTotal - grandTotal) > 0.01) {
      console.warn(`⚠️  Grand total mismatch: received ₹${grandTotal}, calculated ₹${calculatedTotal}. Using calculated value.`);
    }

    // ===== CREATE CUSTOMER IF NEW =====
    console.log('👤 Creating/finding customer...');
    let customer = await Customer.findOne({ name: customerName.trim() });

    if (!customer) {
      const customerData = {
        name: customerName.trim()
      };
      
      // Only add phone if provided
      if (customerPhone && customerPhone.trim()) {
        customerData.phone = customerPhone.trim();
      }
      
      customer = new Customer(customerData);
      await customer.save();
      console.log('✅ New customer created:', customer._id);
    } else {
      console.log('✅ Existing customer found:', customer._id);
    }

    // ===== CREATE SALE (BILL) =====
    console.log('📄 Creating bill record...');
    const saleData = {
      customerName: customerName.trim(),
      customerId: customer._id,
      items: validatedItems,
      grandTotal: calculatedTotal,
      date: date ? new Date(date) : new Date()
    };

    // Only add phone if provided
    if (customerPhone && customerPhone.trim()) {
      saleData.customerPhone = customerPhone.trim();
    }

    const sale = new Sale(saleData);
    const savedSale = await sale.save();

    console.log('🎉 Bill generated successfully!');
    console.log('  Bill ID:', savedSale._id);
    console.log('  Customer Name: ' + savedSale.customerName);
    console.log('  Customer Phone: ' + (savedSale.customerPhone || '-'));
    console.log('  Items:', savedSale.items.length);
    console.log('  Total: ₹', savedSale.grandTotal);

    // ===== UPDATE INVENTORY =====
    console.log('📦 Updating inventory for sold items...');
    for (const item of validatedItems) {
      try {
        // Step 1: Search for Product by name and variant details
        const productFilter = { 
          isActive: true,
          productName: item.productName
        };

        if (item.gsm) {
          productFilter.gsm = item.gsm;
        }
        if (item.size) {
          productFilter.size = item.size;
        }
        if (item.color) {
          productFilter.color = item.color;
        }

        console.log(`  🔍 Searching Product with GSM=${item.gsm}, Size=${item.size}, Color=${item.color}`);

        const product = await Product.findOne(productFilter);

        if (!product) {
          console.warn(`⚠️  Product not found for: ${item.displayName}`);
          console.warn(`     Filter:`, productFilter);
          continue;
        }

        // Step 2: Find inventory for this product
        const inventoryItem = await Inventory.findOne({
          productId: product._id,
          isActive: true
        });

        if (!inventoryItem) {
          console.warn(`⚠️  Inventory item not found for product: ${product._id}`);
          continue;
        }

        // Check if enough stock
        if (inventoryItem.quantity < item.quantity) {
          console.warn(`⚠️  Insufficient stock for ${item.productName}: have ${inventoryItem.quantity}, sold ${item.quantity}`);
        }

        // Update quantity
        const oldQuantity = inventoryItem.quantity;
        inventoryItem.quantity = Math.max(0, inventoryItem.quantity - item.quantity);
        await inventoryItem.save();

        console.log(`  ✅ Updated ${item.productName}: ${oldQuantity} → ${inventoryItem.quantity} (sold ${item.quantity})`);

        // Record stock transaction
        const transaction = new StockTransaction({
          envelopeId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          date: new Date(),
          reference: savedSale._id,
          reason: `Sale Bill #${savedSale._id.toString().slice(-6).toUpperCase()}`
        });
        await transaction.save();

        console.log(`  📝 Stock transaction recorded: OUT ${item.quantity} units`);
      } catch (invErr) {
        console.error(`❌ Error updating inventory for ${item.productName}:`, invErr.message);
        // Don't fail the sale, just log the error
      }
    }

    res.status(201).json({
      message: 'Bill generated successfully',
      data: savedSale
    });
  } catch (err) {
    console.error('❌ Error creating sale:', err);
    res.status(500).json({
      message: 'Failed to generate bill',
      error: err.message
    });
  }
};

// ============================================================================
// GET ALL SALES
// ============================================================================

exports.getAllSales = async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const sales = await Sale.find()
      .populate('customerId', 'name phone')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Sale.countDocuments();

    res.status(200).json({
      message: 'Sales retrieved successfully',
      data: sales,
      total,
      count: sales.length
    });
  } catch (err) {
    console.error('❌ Error getting sales:', err);
    res.status(500).json({
      message: 'Failed to retrieve sales',
      error: err.message
    });
  }
};

// ============================================================================
// GET SALE BY ID
// ============================================================================

exports.getSaleById = async (req, res) => {
  try {
    const { saleId } = req.params;

    const sale = await Sale.findById(saleId).populate('customerId', 'name phone email address');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.status(200).json({
      message: 'Sale retrieved successfully',
      data: sale
    });
  } catch (err) {
    console.error('❌ Error getting sale:', err);
    res.status(500).json({
      message: 'Failed to retrieve sale',
      error: err.message
    });
  }
};

// ============================================================================
// GET SALES BY CUSTOMER
// ============================================================================

exports.getSalesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 50 } = req.query;

    const sales = await Sale.find({ customerId })
      .populate('customerId', 'name phone')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      message: 'Sales retrieved successfully',
      data: sales,
      count: sales.length
    });
  } catch (err) {
    console.error('❌ Error getting sales by customer:', err);
    res.status(500).json({
      message: 'Failed to retrieve sales',
      error: err.message
    });
  }
};

// ============================================================================
// GET SALES SUMMARY (DAILY/MONTHLY)
// ============================================================================

exports.getSalesSummary = async (req, res) => {
  try {
    const { period = 'daily' } = req.query; // daily, weekly, monthly

    let groupBy;
    if (period === 'daily') {
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    } else if (period === 'weekly') {
      groupBy = { $week: '$date' };
    } else {
      groupBy = { $month: '$date' };
    }

    const summary = await Sale.aggregate([
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$grandTotal' },
          totalItems: { $sum: { $size: '$items' } }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
      message: 'Sales summary retrieved',
      data: summary,
      period
    });
  } catch (err) {
    console.error('❌ Error getting sales summary:', err);
    res.status(500).json({
      message: 'Failed to retrieve sales summary',
      error: err.message
    });
  }
};

// ============================================================================
// GET REPORTS (FOR DASHBOARD) - COMPREHENSIVE METRICS
// ============================================================================

exports.getReports = async (req, res) => {
  try {
    // ===== TIME PERIOD CALCULATIONS =====
    
    // TODAY
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // YESTERDAY
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // WEEKLY (Last 7 days)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    
    // MONTHLY (From first day of month)
    const monthStart = new Date(today);
    monthStart.setDate(1);
    
    // YEARLY (From Jan 1)
    const yearStart = new Date(today.getFullYear(), 0, 1);

    console.log('📊 Dashboard Report Calculation:');
    console.log(`   Today: ${today.toDateString()} to ${tomorrow.toDateString()}`);
    console.log(`   Weekly: ${weekStart.toDateString()} onwards`);
    console.log(`   Monthly: ${monthStart.toDateString()} onwards`);

    // ===== FETCH SALES DATA =====
    
    // Today's sales
    const todaysSales = await Sale.find({
      date: { $gte: today, $lt: tomorrow }
    });

    // Yesterday's sales
    const yesterdaysSales = await Sale.find({
      date: { $gte: yesterday, $lt: today }
    });

    // Weekly sales
    const weeklySales = await Sale.find({
      date: { $gte: weekStart, $lt: tomorrow }
    });

    // Monthly sales
    const monthlySales = await Sale.find({
      date: { $gte: monthStart, $lt: tomorrow }
    });

    // Yearly sales
    const yearlySales = await Sale.find({
      date: { $gte: yearStart, $lt: tomorrow }
    });

    // ===== CALCULATE REVENUES =====
    
    const todayRevenue = todaysSales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
    const yesterdayRevenue = yesterdaysSales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
    const weeklyRevenue = weeklySales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
    const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
    const yearlyRevenue = yearlySales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);

    console.log(`   Today Revenue: ₹${todayRevenue} (${todaysSales.length} sales)`);
    console.log(`   Weekly Revenue: ₹${weeklyRevenue} (${weeklySales.length} sales)`);
    console.log(`   Monthly Revenue: ₹${monthlyRevenue} (${monthlySales.length} sales)`);
    console.log(`   Yearly Revenue: ₹${yearlyRevenue} (${yearlySales.length} sales)`);

    // ===== INVENTORY INSIGHTS =====
    
    const inventoryItems = await Inventory.find({ isActive: true }).populate('productId');
    
    let totalStock = 0;
    let totalStockValue = 0;
    let lowStockCount = 0;
    
    inventoryItems.forEach(item => {
      const qty = item.quantity || 0;
      const price = item.price || 0;
      totalStock += qty;
      totalStockValue += (qty * price);
      
      if (qty < (item.minimumStockLevel || 50)) {
        lowStockCount++;
      }
    });

    const totalProducts = inventoryItems.length;

    console.log(`📦 Inventory Insights:`);
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Total Stock: ${totalStock} units`);
    console.log(`   Total Stock Value: ₹${totalStockValue.toFixed(2)}`);
    console.log(`   Low Stock Items: ${lowStockCount}`);

    // ===== BUILD RESPONSE =====
    
    res.status(200).json({
      success: true,
      data: {
        today: {
          salesCount: todaysSales.length,
          revenue: todayRevenue,
          timestamp: new Date()
        },
        previous: {
          salesCount: yesterdaysSales.length,
          revenue: yesterdayRevenue
        },
        weekly: {
          salesCount: weeklySales.length,
          revenue: weeklyRevenue
        },
        monthly: {
          salesCount: monthlySales.length,
          revenue: monthlyRevenue
        },
        yearly: {
          salesCount: yearlySales.length,
          revenue: yearlyRevenue
        },
        inventory: {
          totalProducts,
          totalStock,
          totalStockValue: parseFloat(totalStockValue.toFixed(2)),
          lowStockCount
        }
      }
    });
  } catch (err) {
    console.error('❌ Error getting reports:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports',
      error: err.message
    });
  }
};

// ============================================================================
// HELPER: GET FILTERED SALES (WITH DATE FILTERING)
// ============================================================================

const getFilteredSales = async (filterType = 'all', customStartDate = null, customEndDate = null) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate, endDate;

    switch (filterType.toLowerCase()) {
      case 'today':
        startDate = today;
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        break;

      case 'week':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        break;

      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        break;

      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear() + 1, 0, 1);
        break;

      case 'custom':
        if (!customStartDate || !customEndDate) {
          throw new Error('Custom date range requires both start and end dates');
        }
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      default: // 'all'
        const allSales = await Sale.find()
          .populate('customerId', 'name phone')
          .sort({ date: -1 });
        return allSales;
    }

    const filteredSales = await Sale.find({
      date: { $gte: startDate, $lt: endDate }
    })
      .populate('customerId', 'name phone')
      .sort({ date: -1 });

    return filteredSales;
  } catch (err) {
    console.error('❌ Error filtering sales:', err);
    throw err;
  }
};

// ============================================================================
// FILTERED SALES ENDPOINT
// ============================================================================

exports.getFilteredSalesData = async (req, res) => {
  try {
    const { filter = 'all', startDate = null, endDate = null } = req.query;

    console.log(`📊 Filtering sales by: ${filter}`, {
      startDate,
      endDate
    });

    const filteredSales = await getFilteredSales(filter, startDate, endDate);

    if (!filteredSales || filteredSales.length === 0) {
      return res.status(200).json({
        message: 'No records found for the selected period',
        data: [],
        count: 0,
        total: 0,
        filter
      });
    }

    // Calculate totals
    const total = filteredSales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
    const totalItems = filteredSales.reduce((sum, sale) => {
      return sum + (sale.items ? sale.items.length : 0);
    }, 0);

    res.status(200).json({
      message: `Found ${filteredSales.length} sales records`,
      data: filteredSales,
      count: filteredSales.length,
      total: total,
      totalItems: totalItems,
      filter
    });
  } catch (err) {
    console.error('❌ Error getting filtered sales:', err);
    res.status(500).json({
      message: 'Failed to retrieve filtered sales',
      error: err.message
    });
  }
};

// ============================================================================
// EXPORT TO EXCEL
// ============================================================================

exports.exportToExcel = async (req, res) => {
  try {
    const { filter = 'all', startDate = null, endDate = null } = req.query;

    console.log(`📊 Exporting to Excel with filter: ${filter}`);

    const sales = await getFilteredSales(filter, startDate, endDate);

    if (!sales || sales.length === 0) {
      return res.status(400).json({
        message: 'No data available to export'
      });
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Define columns
    worksheet.columns = [
      { header: 'Bill ID', key: 'billId', width: 15 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Time', key: 'time', width: 10 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Items Count', key: 'itemsCount', width: 12 },
      { header: 'Total Amount (₹)', key: 'totalAmount', width: 15 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center' };

    // Add data rows
    let totalRevenue = 0;
    let totalItemsSold = 0;

    sales.forEach((sale, index) => {
      const saleDate = new Date(sale.date);
      const dateStr = saleDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = saleDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const itemsCount = sale.items ? sale.items.length : 0;
      const totalAmount = sale.grandTotal || 0;

      worksheet.addRow({
        billId: sale._id.toString().slice(-8).toUpperCase(),
        date: dateStr,
        time: timeStr,
        customerName: sale.customerName || 'N/A',
        itemsCount: itemsCount,
        totalAmount: totalAmount
      });

      totalRevenue += totalAmount;
      totalItemsSold += itemsCount;
    });

    // Add summary rows
    const lastRow = worksheet.lastRow.number;
    worksheet.addRow({}); // Empty row
    worksheet.addRow({
      customerName: 'TOTAL',
      itemsCount: totalItemsSold,
      totalAmount: totalRevenue
    });

    // Style summary row
    const summaryRow = worksheet.getRow(lastRow + 2);
    summaryRow.font = { bold: true, size: 11 };
    summaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };

    // Format currency columns
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const totalCell = row.getCell('totalAmount');
        totalCell.numFmt = '₹ #,##0.00';
        totalCell.alignment = { horizontal: 'right' };
      }
    });

    // Generate file
    const fileName = `Sales_Report_${filter}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    
    console.log(`✅ Excel file exported successfully: ${fileName}`);
    res.end();
  } catch (err) {
    console.error('❌ Error exporting to Excel:', err);
    res.status(500).json({
      message: 'Failed to export to Excel',
      error: err.message
    });
  }
};

// ============================================================================
// EXPORT TO CSV
// ============================================================================

exports.exportToCSV = async (req, res) => {
  try {
    const { filter = 'all', startDate = null, endDate = null } = req.query;

    console.log(`📊 Exporting to CSV with filter: ${filter}`);

    const sales = await getFilteredSales(filter, startDate, endDate);

    if (!sales || sales.length === 0) {
      return res.status(400).json({
        message: 'No data available to export'
      });
    }

    // Create CSV header
    let csvContent = 'Bill ID,Date,Time,Customer Name,Items Count,Total Amount (₹)\n';

    let totalRevenue = 0;
    let totalItemsSold = 0;

    // Add data rows
    sales.forEach((sale) => {
      const saleDate = new Date(sale.date);
      const dateStr = saleDate.toISOString().split('T')[0];
      const timeStr = saleDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const billId = sale._id.toString().slice(-8).toUpperCase();
      const customerName = sale.customerName || 'N/A';
      const itemsCount = sale.items ? sale.items.length : 0;
      const totalAmount = sale.grandTotal || 0;

      csvContent += `"${billId}","${dateStr}","${timeStr}","${customerName}",${itemsCount},${totalAmount}\n`;

      totalRevenue += totalAmount;
      totalItemsSold += itemsCount;
    });

    // Add summary
    csvContent += '\n"TOTAL","","","",';
    csvContent += `${totalItemsSold},${totalRevenue}\n`;

    const fileName = `Sales_Report_${filter}_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csvContent);

    console.log(`✅ CSV file exported successfully: ${fileName}`);
  } catch (err) {
    console.error('❌ Error exporting to CSV:', err);
    res.status(500).json({
      message: 'Failed to export to CSV',
      error: err.message
    });
  }
};

// ============================================================================
// GET SALES STATISTICS (FOR UI FILTERING)
// ============================================================================

exports.getSalesStatistics = async (req, res) => {
  try {
    const { filter = 'all', startDate = null, endDate = null } = req.query;

    const filteredSales = await getFilteredSales(filter, startDate, endDate);

    if (!filteredSales || filteredSales.length === 0) {
      return res.status(200).json({
        message: 'No records found',
        data: {
          totalSales: 0,
          totalOrders: 0,
          totalItemsSold: 0,
          averageOrderValue: 0
        }
      });
    }

    const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
    const totalOrders = filteredSales.length;
    const totalItemsSold = filteredSales.reduce((sum, sale) => {
      return sum + (sale.items ? sale.items.length : 0);
    }, 0);
    const averageOrderValue = totalSales / totalOrders;

    res.status(200).json({
      message: 'Statistics retrieved successfully',
      data: {
        totalSales: parseFloat(totalSales.toFixed(2)),
        totalOrders,
        totalItemsSold,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
      }
    });
  } catch (err) {
    console.error('❌ Error getting statistics:', err);
    res.status(500).json({
      message: 'Failed to retrieve statistics',
      error: err.message
    });
  }
};

// ============================================================================
// SEARCH BILLS
// ============================================================================

exports.searchBills = async (req, res) => {
  try {
    const { query = '', limit = 50 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(200).json({
        message: 'Please enter a search query',
        data: [],
        count: 0
      });
    }

    const searchRegex = new RegExp(query, 'i');

    // Search by bill ID or customer name
    const sales = await Sale.find({
      $or: [
        { _id: searchRegex },
        { customerName: searchRegex }
      ]
    })
      .populate('customerId', 'name phone')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      message: `Found ${sales.length} bills matching "${query}"`,
      data: sales,
      count: sales.length,
      query
    });
  } catch (err) {
    console.error('❌ Error searching bills:', err);
    res.status(500).json({
      message: 'Failed to search bills',
      error: err.message
    });
  }
};

// ============================================================================
// DELETE BILL
// ============================================================================

exports.deleteBill = async (req, res) => {
  try {
    const { saleId } = req.params;

    console.log(`🗑️  Attempting to delete bill: ${saleId}`);

    const sale = await Sale.findById(saleId);

    if (!sale) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Optional: Restore inventory if needed
    // For now, we'll just delete the bill
    // In future, you might want to reverse the stock reduction

    await Sale.findByIdAndDelete(saleId);

    console.log(`✅ Bill deleted: ${saleId}`);

    res.status(200).json({
      message: 'Bill deleted successfully',
      data: {
        deletedId: saleId,
        deletedCustomer: sale.customerName,
        deletedAmount: sale.grandTotal
      }
    });
  } catch (err) {
    console.error('❌ Error deleting bill:', err);
    res.status(500).json({
      message: 'Failed to delete bill',
      error: err.message
    });
  }
};

// ============================================================================
// UPDATE BILL (limited fields)
// ============================================================================

exports.updateBill = async (req, res) => {
  try {
    const { saleId } = req.params;
    const { customerName, customerPhone } = req.body;

    console.log(`✏️  Updating bill: ${saleId}`);

    const sale = await Sale.findById(saleId);

    if (!sale) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Only allow updating customer info, not items or total
    if (customerName) {
      sale.customerName = customerName.trim();
    }
    if (customerPhone !== undefined) {
      sale.customerPhone = customerPhone || '';
    }

    await sale.save();

    console.log(`✅ Bill updated: ${saleId}`);

    res.status(200).json({
      message: 'Bill updated successfully',
      data: sale
    });
  } catch (err) {
    console.error('❌ Error updating bill:', err);
    res.status(500).json({
      message: 'Failed to update bill',
      error: err.message
    });
  }
};

// ============================================================================
// GENERATE PDF BILL
// ============================================================================

exports.generatePDF = async (req, res) => {
  try {
    const { saleId } = req.params;

    console.log(`📄 Generating PDF for bill: ${saleId}`);

    const sale = await Sale.findById(saleId).populate('customerId', 'name phone email address');

    if (!sale) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // For now, return the sale data in a format that can be printed
    // Frontend can use html2pdf or similar to convert to PDF

    res.status(200).json({
      message: 'Bill data retrieved for PDF generation',
      data: sale
    });
  } catch (err) {
    console.error('❌ Error generating PDF:', err);
    res.status(500).json({
      message: 'Failed to generate PDF',
      error: err.message
    });
  }
};

module.exports = exports;

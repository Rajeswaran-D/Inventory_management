/**
 * SIMPLIFIED SALES CONTROLLER
 * Handles bill generation with inventory tracking
 * 
 * FIXES APPLIED:
 * 1. Inventory update uses variantId (not Product model lookup)
 * 2. GST calculation stored in Sale record
 * 3. Auto-generated bill numbers
 * 4. StockTransaction uses correct references
 * 5. Proper validation and error handling
 */

const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const StockTransaction = require('../models/StockTransaction');
const ExcelJS = require('exceljs');
const XLSX = require('xlsx');

// ============================================================================
// GST CALCULATION HELPER
// ============================================================================

const calculateGST = (subtotal, cgstRate = 9, sgstRate = 9) => {
  const cgst = parseFloat(((subtotal * cgstRate) / 100).toFixed(2));
  const sgst = parseFloat(((subtotal * sgstRate) / 100).toFixed(2));
  const totalBeforeRound = subtotal + cgst + sgst;
  const grandTotal = Math.round(totalBeforeRound);
  const roundOff = parseFloat((grandTotal - totalBeforeRound).toFixed(2));
  
  return { subtotal, cgst, sgst, roundOff, grandTotal };
};

// ============================================================================
// CREATE SALE / GENERATE BILL
// ============================================================================

exports.createSale = async (req, res) => {
  try {
    const { 
      customerName, customerPhone, customerGSTIN, customerAddress,
      items, grandTotal, date 
    } = req.body;

    console.log('📥 Received sale (bill) request:', {
      customerName,
      itemsCount: items?.length,
      grandTotal,
      date
    });

    // ===== VALIDATION =====
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer name is required' 
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Items array is required and cannot be empty' 
      });
    }

    // Validate each item and calculate totals
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Item ${i + 1}: Quantity must be greater than 0` 
        });
      }

      if (item.price === undefined || item.price < 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Item ${i + 1}: Price cannot be negative` 
        });
      }

      const itemTotal = item.quantity * item.price;
      calculatedSubtotal += itemTotal;

      // Build validated item — accept both variantId and productId flexibly
      const validatedItem = {
        productName: item.productName || item.displayName || 'Unknown Product',
        displayName: item.displayName || item.productName || 'Product',
        gsm: item.gsm || null,
        size: item.size || null,
        color: item.color || null,
        price: item.price,
        quantity: item.quantity,
        itemTotal: itemTotal
      };

      // Set variantId if provided (ObjectId reference)
      if (item.variantId) {
        validatedItem.variantId = item.variantId;
      }
      // Set productId if provided
      if (item.productId) {
        validatedItem.productId = item.productId;
      }

      validatedItems.push(validatedItem);
      console.log(`  ✅ Item ${i + 1}: ${validatedItem.displayName} × ${item.quantity} @ ₹${item.price} = ₹${itemTotal}`);
    }

    // Calculate GST
    const gst = calculateGST(calculatedSubtotal);
    
    console.log(`  📊 Subtotal: ₹${gst.subtotal} | CGST: ₹${gst.cgst} | SGST: ₹${gst.sgst} | Grand Total: ₹${gst.grandTotal}`);

    // ===== CREATE CUSTOMER IF NEW =====
    console.log('👤 Creating/finding customer...');
    let customer = null;
    try {
      customer = await Customer.findOne({ name: customerName.trim() });
      if (!customer) {
        const customerData = { name: customerName.trim() };
        if (customerPhone && customerPhone.trim()) {
          customerData.phone = customerPhone.trim();
        }
        customer = new Customer(customerData);
        await customer.save();
        console.log('✅ New customer created:', customer._id);
      } else {
        console.log('✅ Existing customer found:', customer._id);
      }
    } catch (custErr) {
      console.warn('⚠️  Customer creation error (non-fatal):', custErr.message);
    }

    // ===== CREATE SALE (BILL) =====
    console.log('📄 Creating bill record...');
    const saleData = {
      customerName: customerName.trim(),
      customerPhone: (customerPhone || '').trim(),
      customerGSTIN: (customerGSTIN || '').trim(),
      customerAddress: (customerAddress || '').trim(),
      items: validatedItems,
      subtotal: gst.subtotal,
      cgstRate: 9,
      sgstRate: 9,
      cgst: gst.cgst,
      sgst: gst.sgst,
      roundOff: gst.roundOff,
      grandTotal: gst.grandTotal,
      date: date ? new Date(date) : new Date()
    };

    if (customer) {
      saleData.customerId = customer._id;
    }

    const sale = new Sale(saleData);
    const savedSale = await sale.save();

    console.log('🎉 Bill generated successfully!');
    console.log('  Bill Number:', savedSale.billNumber);
    console.log('  Bill ID:', savedSale._id);
    console.log('  Customer:', savedSale.customerName);
    console.log('  Items:', savedSale.items.length);
    console.log('  Grand Total: ₹', savedSale.grandTotal);

    // ===== UPDATE INVENTORY =====
    console.log('📦 Updating inventory for sold items...');
    const inventoryUpdates = [];

    for (const item of validatedItems) {
      try {
        let inventoryItem = null;

        // Strategy 1: Find by variantId (most accurate)
        if (item.variantId) {
          inventoryItem = await Inventory.findOne({
            variantId: item.variantId,
            isActive: true
          }).setOptions({ _recursed: true }); // Skip auto-populate for performance
        }

        // Strategy 2: If no variantId match, search by populated variant displayName
        if (!inventoryItem) {
          const allInventory = await Inventory.find({ isActive: true });
          inventoryItem = allInventory.find(inv => {
            const variant = inv.variantId; // populated by pre-find hook
            if (!variant) return false;
            
            // Match by display name
            if (item.displayName && variant.displayName === item.displayName) return true;
            
            // Match by product name + specs
            const product = variant.productId;
            if (!product) return false;
            
            const nameMatch = product.name === item.productName;
            const gsmMatch = !item.gsm || variant.gsm == item.gsm;
            const sizeMatch = !item.size || variant.size === item.size;
            const colorMatch = !item.color || variant.color === item.color;
            
            return nameMatch && gsmMatch && sizeMatch && colorMatch;
          });
        }

        if (!inventoryItem) {
          console.warn(`⚠️  Inventory item not found for: ${item.displayName}`);
          continue;
        }

        // Check stock level
        if (inventoryItem.quantity < item.quantity) {
          console.warn(`⚠️  Insufficient stock for ${item.displayName}: have ${inventoryItem.quantity}, sold ${item.quantity}`);
        }

        // Update quantity
        const oldQuantity = inventoryItem.quantity;
        inventoryItem.quantity = Math.max(0, inventoryItem.quantity - item.quantity);
        inventoryItem.updatedAt = new Date();
        await inventoryItem.save();

        console.log(`  ✅ Updated ${item.displayName}: ${oldQuantity} → ${inventoryItem.quantity} (sold ${item.quantity})`);

        // Record stock transaction
        const transactionData = {
          type: 'OUT',
          quantity: item.quantity,
          date: new Date(),
          reference: savedSale._id,
          reason: `Sale Bill #${savedSale.billNumber}`
        };

        // Set the correct reference on the transaction
        if (item.variantId) {
          transactionData.variantId = item.variantId;
        }
        if (inventoryItem.variantId && inventoryItem.variantId._id) {
          transactionData.variantId = inventoryItem.variantId._id;
        }

        const transaction = new StockTransaction(transactionData);
        await transaction.save();

        inventoryUpdates.push({
          displayName: item.displayName,
          oldQty: oldQuantity,
          newQty: inventoryItem.quantity,
          sold: item.quantity
        });

        console.log(`  📝 Stock transaction recorded: OUT ${item.quantity} units`);
      } catch (invErr) {
        console.error(`❌ Error updating inventory for ${item.displayName}:`, invErr.message);
        // Don't fail the sale, just log the error
      }
    }

    // ===== RESPOND =====
    res.status(201).json({
      success: true,
      message: 'Bill generated successfully',
      data: savedSale,
      inventoryUpdates
    });

  } catch (err) {
    console.error('❌ Error creating sale:', err);
    console.error('Error details:', err.message);
    if (err.errors) {
      Object.keys(err.errors).forEach(key => {
        console.error(`  Field "${key}":`, err.errors[key].message);
      });
    }
    res.status(500).json({
      success: false,
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
      success: true,
      message: 'Sales retrieved successfully',
      data: sales,
      total,
      count: sales.length
    });
  } catch (err) {
    console.error('❌ Error getting sales:', err);
    res.status(500).json({
      success: false,
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
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Sale retrieved successfully',
      data: sale
    });
  } catch (err) {
    console.error('❌ Error getting sale:', err);
    res.status(500).json({
      success: false,
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
      success: true,
      message: 'Sales retrieved successfully',
      data: sales,
      count: sales.length
    });
  } catch (err) {
    console.error('❌ Error getting sales by customer:', err);
    res.status(500).json({
      success: false,
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
    const { period = 'daily' } = req.query;

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
      success: true,
      message: 'Sales summary retrieved',
      data: summary,
      period
    });
  } catch (err) {
    console.error('❌ Error getting sales summary:', err);
    res.status(500).json({
      success: false,
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const monthStart = new Date(today);
    monthStart.setDate(1);
    
    const yearStart = new Date(today.getFullYear(), 0, 1);

    console.log('📊 Dashboard Report Calculation:');
    console.log(`   Today: ${today.toDateString()} to ${tomorrow.toDateString()}`);

    // ===== FETCH SALES DATA =====
    const todaysSales = await Sale.find({
      date: { $gte: today, $lt: tomorrow }
    });
    const yesterdaysSales = await Sale.find({
      date: { $gte: yesterday, $lt: today }
    });
    const weeklySales = await Sale.find({
      date: { $gte: weekStart, $lt: tomorrow }
    });
    const monthlySales = await Sale.find({
      date: { $gte: monthStart, $lt: tomorrow }
    });
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
      default:
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

    console.log(`📊 Filtering sales by: ${filter}`);

    const filteredSales = await getFilteredSales(filter, startDate, endDate);

    if (!filteredSales || filteredSales.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No records found for the selected period',
        data: [],
        count: 0,
        total: 0,
        filter
      });
    }

    const total = filteredSales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
    const totalItems = filteredSales.reduce((sum, sale) => {
      return sum + (sale.items ? sale.items.length : 0);
    }, 0);

    res.status(200).json({
      success: true,
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
      success: false,
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
        success: false,
        message: 'No data available to export'
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
      { header: 'Bill No.', key: 'billNumber', width: 15 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Time', key: 'time', width: 10 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Items Count', key: 'itemsCount', width: 12 },
      { header: 'Subtotal (₹)', key: 'subtotal', width: 15 },
      { header: 'CGST (₹)', key: 'cgst', width: 12 },
      { header: 'SGST (₹)', key: 'sgst', width: 12 },
      { header: 'Grand Total (₹)', key: 'totalAmount', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center' };

    let totalRevenue = 0;
    let totalItemsSold = 0;

    sales.forEach((sale) => {
      const saleDate = new Date(sale.date);
      const dateStr = saleDate.toISOString().split('T')[0];
      const timeStr = saleDate.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });

      const itemsCount = sale.items ? sale.items.length : 0;
      const totalAmount = sale.grandTotal || 0;

      worksheet.addRow({
        billNumber: sale.billNumber || sale._id.toString().slice(-8).toUpperCase(),
        date: dateStr,
        time: timeStr,
        customerName: sale.customerName || 'N/A',
        itemsCount: itemsCount,
        subtotal: sale.subtotal || 0,
        cgst: sale.cgst || 0,
        sgst: sale.sgst || 0,
        totalAmount: totalAmount
      });

      totalRevenue += totalAmount;
      totalItemsSold += itemsCount;
    });

    const lastRow = worksheet.lastRow.number;
    worksheet.addRow({});
    worksheet.addRow({
      customerName: 'TOTAL',
      itemsCount: totalItemsSold,
      totalAmount: totalRevenue
    });

    const summaryRow = worksheet.getRow(lastRow + 2);
    summaryRow.font = { bold: true, size: 11 };
    summaryRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };

    const fileName = `Sales_Report_${filter}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    
    console.log(`✅ Excel file exported successfully: ${fileName}`);
    res.end();
  } catch (err) {
    console.error('❌ Error exporting to Excel:', err);
    res.status(500).json({
      success: false,
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
        success: false,
        message: 'No data available to export'
      });
    }

    let csvContent = 'Bill No.,Date,Time,Customer Name,Items Count,Subtotal,CGST,SGST,Grand Total\n';

    let totalRevenue = 0;

    sales.forEach((sale) => {
      const saleDate = new Date(sale.date);
      const dateStr = saleDate.toISOString().split('T')[0];
      const timeStr = saleDate.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });

      const billNo = sale.billNumber || sale._id.toString().slice(-8).toUpperCase();
      const customerName = sale.customerName || 'N/A';
      const itemsCount = sale.items ? sale.items.length : 0;
      const totalAmount = sale.grandTotal || 0;

      csvContent += `"${billNo}","${dateStr}","${timeStr}","${customerName}",${itemsCount},${sale.subtotal || 0},${sale.cgst || 0},${sale.sgst || 0},${totalAmount}\n`;
      totalRevenue += totalAmount;
    });

    csvContent += `\n"TOTAL","","","",,,${totalRevenue}\n`;

    const fileName = `Sales_Report_${filter}_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csvContent);

    console.log(`✅ CSV file exported successfully: ${fileName}`);
  } catch (err) {
    console.error('❌ Error exporting to CSV:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to export to CSV',
      error: err.message
    });
  }
};

// ============================================================================
// GET SALES STATISTICS
// ============================================================================

exports.getSalesStatistics = async (req, res) => {
  try {
    const { filter = 'all', startDate = null, endDate = null } = req.query;

    const filteredSales = await getFilteredSales(filter, startDate, endDate);

    if (!filteredSales || filteredSales.length === 0) {
      return res.status(200).json({
        success: true,
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
      success: true,
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
      success: false,
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
        success: true,
        message: 'Please enter a search query',
        data: [],
        count: 0
      });
    }

    const searchRegex = new RegExp(query, 'i');

    // Search by bill number, bill ID, or customer name
    const sales = await Sale.find({
      $or: [
        { billNumber: searchRegex },
        { customerName: searchRegex }
      ]
    })
      .populate('customerId', 'name phone')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: `Found ${sales.length} bills matching "${query}"`,
      data: sales,
      count: sales.length,
      query
    });
  } catch (err) {
    console.error('❌ Error searching bills:', err);
    res.status(500).json({
      success: false,
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
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    // Restore inventory quantities
    for (const item of sale.items) {
      try {
        if (item.variantId) {
          const inventoryItem = await Inventory.findOne({ 
            variantId: item.variantId, 
            isActive: true 
          }).setOptions({ _recursed: true });
          
          if (inventoryItem) {
            inventoryItem.quantity += item.quantity;
            await inventoryItem.save();
            console.log(`  ↩️ Restored ${item.quantity} units for ${item.displayName}`);
          }
        }
      } catch (restoreErr) {
        console.warn(`  ⚠️ Could not restore stock for ${item.displayName}:`, restoreErr.message);
      }
    }

    await Sale.findByIdAndDelete(saleId);

    console.log(`✅ Bill deleted: ${saleId}`);

    res.status(200).json({
      success: true,
      message: 'Bill deleted successfully',
      data: {
        deletedId: saleId,
        deletedBillNumber: sale.billNumber,
        deletedCustomer: sale.customerName,
        deletedAmount: sale.grandTotal
      }
    });
  } catch (err) {
    console.error('❌ Error deleting bill:', err);
    res.status(500).json({
      success: false,
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
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    if (customerName) sale.customerName = customerName.trim();
    if (customerPhone !== undefined) sale.customerPhone = customerPhone || '';

    await sale.save();

    console.log(`✅ Bill updated: ${saleId}`);

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully',
      data: sale
    });
  } catch (err) {
    console.error('❌ Error updating bill:', err);
    res.status(500).json({
      success: false,
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
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Bill data retrieved for PDF generation',
      data: sale
    });
  } catch (err) {
    console.error('❌ Error generating PDF:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: err.message
    });
  }
};

module.exports = exports;

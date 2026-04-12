const prisma = require('../utils/prismaClient');
const ExcelJS = require('exceljs');

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

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    let calculatedSubtotal = 0;
    const itemsData = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.quantity || item.quantity <= 0) {
            return res.status(400).json({ success: false, message: `Item ${i + 1}: Quantity > 0 required` });
        }
        const itemTotal = item.quantity * (item.price || 0);
        calculatedSubtotal += itemTotal;
        itemsData.push({
            productName: item.productName || item.displayName || 'Unknown',
            displayName: item.displayName || item.productName || 'Product',
            gsm: item.gsm ? parseFloat(item.gsm) : null,
            size: item.size || null,
            color: item.color || null,
            price: parseFloat(item.price || 0),
            quantity: parseInt(item.quantity),
            itemTotal,
            variantId: item.variantId || null,
            productId: item.productId || null
        });
    }

    const gst = calculateGST(calculatedSubtotal);

    // 1. Get/Create Customer
    let customer = await prisma.customer.findUnique({ where: { name: customerName.trim() } });
    if (!customer) {
        customer = await prisma.customer.create({
            data: { 
                name: customerName.trim(), 
                phone: (customerPhone || '').trim(),
                address: (customerAddress || '').trim()
            }
        });
    }

    // 2. Generate Bill Number (Sequential)
    const counter = await prisma.counter.upsert({
        where: { id: 'sale' },
        update: { seq: { increment: 1 } },
        create: { id: 'sale', seq: 1 }
    });
    const billNumber = `BILL-${String(counter.seq).padStart(5, '0')}`;

    // 3. Create Sale Record
    const sale = await prisma.sale.create({
        data: {
            billNumber,
            customerName: customerName.trim(),
            customerPhone: (customerPhone || '').trim(),
            customerGSTIN: (customerGSTIN || '').trim(),
            customerAddress: (customerAddress || '').trim(),
            customerId: customer.id,
            subtotal: gst.subtotal,
            cgst: gst.cgst,
            sgst: gst.sgst,
            roundOff: gst.roundOff,
            grandTotal: gst.grandTotal,
            date: date ? new Date(date) : new Date(),
            items: {
                create: itemsData.map(it => ({
                    variantId: it.variantId,
                    productId: it.productId,
                    productName: it.productName,
                    displayName: it.displayName,
                    gsm: it.gsm,
                    size: it.size,
                    color: it.color,
                    price: it.price,
                    quantity: it.quantity,
                    itemTotal: it.itemTotal
                }))
            }
        },
        include: { items: true }
    });

    // 4. Update Inventory & Transactions
    const inventoryUpdates = [];
    for (const item of itemsData) {
        let inv = null;
        if (item.variantId) {
            inv = await prisma.inventory.findUnique({ where: { variantId: item.variantId } });
        }
        
        if (!inv) {
            // Strategy 2: Search by specs
            const variants = await prisma.productVariant.findMany({
                where: {
                    product: { name: item.productName },
                    gsm: item.gsm,
                    size: item.size,
                    color: item.color
                },
                include: { inventories: true }
            });
            if (variants.length > 0 && variants[0].inventories) {
                inv = variants[0].inventories;
            }
        }

        if (inv) {
            const oldQty = inv.quantity;
            const updatedInv = await prisma.inventory.update({
                where: { id: inv.id },
                data: { quantity: { decrement: item.quantity } }
            });

            await prisma.stockTransaction.create({
                data: {
                    type: 'OUT',
                    quantity: item.quantity,
                    variantId: inv.variantId,
                    reference: sale.id,
                    reason: `Sale Bill #${sale.billNumber}`,
                    date: sale.date
                }
            });

            inventoryUpdates.push({ displayName: item.displayName, oldQty, newQty: updatedInv.quantity, sold: item.quantity });
        }
    }

    res.status(201).json({ success: true, message: 'Bill generated successfully', data: sale, inventoryUpdates });

  } catch (err) {
    console.error('Sale error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate bill', error: err.message });
  }
};

exports.getAllSales = async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const sales = await prisma.sale.findMany({
      include: { customer: true, items: true },
      orderBy: { date: 'desc' },
      take: parseInt(limit),
      skip: parseInt(skip)
    });
    const total = await prisma.sale.count();
    res.status(200).json({ success: true, data: sales, total, count: sales.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.saleId },
      include: { customer: true, items: true }
    });
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.status(200).json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate()-7);
    const monthStart = new Date(today); monthStart.setDate(1);

    const calcRev = (list) => list.reduce((sum, s) => sum + s.grandTotal, 0);

    const [tSales, ySales, wSales, mSales] = await Promise.all([
        prisma.sale.findMany({ where: { date: { gte: today, lt: tomorrow } } }),
        prisma.sale.findMany({ where: { date: { gte: yesterday, lt: today } } }),
        prisma.sale.findMany({ where: { date: { gte: weekStart } } }),
        prisma.sale.findMany({ where: { date: { gte: monthStart } } })
    ]);

    const inv = await prisma.inventory.findMany({ where: { isActive: true } });
    let totalStock = 0, totalStockValue = 0, lowStockCount = 0;
    inv.forEach(i => {
        totalStock += i.quantity;
        totalStockValue += (i.quantity * i.price);
        if (i.quantity < i.minimumStockLevel) lowStockCount++;
    });

    res.json({
        success: true,
        data: {
            today: { salesCount: tSales.length, revenue: calcRev(tSales) },
            previous: { salesCount: ySales.length, revenue: calcRev(ySales) },
            weekly: { salesCount: wSales.length, revenue: calcRev(wSales) },
            monthly: { salesCount: mSales.length, revenue: calcRev(mSales) },
            inventory: { totalProducts: inv.length, totalStock, totalStockValue, lowStockCount }
        }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.exportToExcel = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({ include: { items: true }, orderBy: { date: 'desc' } });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
        { header: 'Bill No.', key: 'billNumber', width: 15 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Customer', key: 'customerName', width: 20 },
        { header: 'Items', key: 'itemsCount', width: 10 },
        { header: 'Total', key: 'grandTotal', width: 15 }
    ];

    sales.forEach(s => {
        worksheet.addRow({
            billNumber: s.billNumber,
            date: s.date.toISOString().split('T')[0],
            customerName: s.customerName,
            itemsCount: s.items.length,
            grandTotal: s.grandTotal
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Sales_Report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.saleId },
      include: { items: true }
    });
    if (!sale) return res.status(404).json({ success: false, message: 'Bill not found' });

    // Restore stock
    for (const item of sale.items) {
      if (item.variantId) {
        await prisma.inventory.updateMany({
           where: { variantId: item.variantId },
           data: { quantity: { increment: item.quantity } }
        });
      }
    }

    await prisma.sale.delete({ where: { id: req.params.saleId } });
    res.json({ success: true, message: 'Bill deleted and stock restored' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const updated = await prisma.sale.update({
      where: { id: req.params.saleId },
      data: {
        customerName: req.body.customerName ? req.body.customerName.trim() : undefined,
        customerPhone: req.body.customerPhone !== undefined ? req.body.customerPhone.trim() : undefined
      }
    });
    res.json({ success: true, data: updated });
  } catch (err) {
      res.status(500).json({ success: false, error: err.message });
  }
};

exports.searchBills = async (req, res) => {
  try {
    const { query = '' } = req.query;
    const sales = await prisma.sale.findMany({
      where: {
        OR: [
          { billNumber: { contains: query } },
          { customerName: { contains: query } }
        ]
      },
      orderBy: { date: 'desc' },
      take: 50
    });
    res.json({ success: true, data: sales, count: sales.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getFilteredSalesData = async (req, res) => {
  try {
    const { filter = 'all', startDate, endDate } = req.query;
    let where = {};
    if (startDate && endDate) {
        where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    const sales = await prisma.sale.findMany({ where, include: { items: true }, orderBy: { date: 'desc' } });
    res.json({ success: true, data: sales, count: sales.length });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.exportToCSV = async (req, res) => {
    // Just a placeholder for CSV export to prevent route crash
    res.status(501).json({ message: 'CSV export not implemented yet' });
};

exports.getSalesStatistics = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany();
    const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
    res.json({ success: true, data: { totalRevenue, salesCount: sales.length } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.getSalesSummary = async (req, res) => {
    res.status(501).json({ message: 'Sales summary not implemented yet' });
};

exports.generatePDF = async (req, res) => {
    try {
        const sale = await prisma.sale.findUnique({ where: { id: req.params.saleId }, include: { items: true } });
        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
        res.json({ success: true, data: sale });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.downloadSales = async (req, res) => {
    res.status(501).json({ message: 'Download sales report not implemented yet' });
};

exports.getSalesByCustomer = async (req, res) => {
    try {
        const sales = await prisma.sale.findMany({ where: { customerId: req.params.customerId }, include: { items: true } });
        res.json({ success: true, data: sales });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

/**
 * GET REPORTS (FOR DASHBOARD) - COMPREHENSIVE METRICS
 */
exports.getDashboardReports = exports.getReports;

module.exports = exports;

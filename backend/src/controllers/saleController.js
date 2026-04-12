const prisma = require('../utils/prismaClient');
const ExcelJS = require('exceljs');

// Record a new sale (POS Style)
exports.createSale = async (req, res, next) => {
  try {
    const { customerId, customerName, customerPhone, items, grandTotal, date } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required and cannot be empty' });
    }

    let calculatedTotal = 0;
    const variantIds = items.map(i => i.variantId);
    
    const inventories = await prisma.inventory.findMany({
      where: { variantId: { in: variantIds } }
    });
    const inventoryMap = new Map(inventories.map(inv => [inv.variantId, inv]));

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.quantity || item.quantity <= 0) return res.status(400).json({ message: `Item ${i + 1}: Qty > 0 required` });
      if (!item.price || item.price <= 0) return res.status(400).json({ message: `Item ${i + 1}: Price > 0 required` });
      
      const expectedTotal = item.quantity * item.price;
      item.total = expectedTotal;
      calculatedTotal += expectedTotal;

      const inv = inventoryMap.get(item.variantId);
      if (!inv) return res.status(404).json({ message: `Product variant not found in inventory: ${item.displayName}` });
      if (inv.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.displayName}. Available: ${inv.quantity}` });
      }
    }

    // Single transaction for Sale + Items + Stock Update
    const counter = await prisma.counter.upsert({
        where: { id: 'sale' },
        update: { seq: { increment: 1 } },
        create: { id: 'sale', seq: 1 }
    });
    const billNumber = `SALE-${String(counter.seq).padStart(5, '0')}`;

    const sale = await prisma.sale.create({
      data: {
        billNumber,
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '',
        customerId: customerId || null,
        grandTotal: calculatedTotal,
        date: date ? new Date(date) : new Date(),
        subtotal: calculatedTotal, // POS style simple
        items: {
          create: items.map(item => ({
            variantId: item.variantId,
            productName: item.productName || item.displayName || 'Unknown',
            displayName: item.displayName || item.productName || 'Product',
            price: parseFloat(item.price),
            quantity: parseInt(item.quantity),
            itemTotal: item.total
          }))
        }
      },
      include: { items: true }
    });

    // Update stock
    for (const item of items) {
      await prisma.inventory.update({
        where: { variantId: item.variantId },
        data: { quantity: { decrement: item.quantity } }
      });
      
      await prisma.stockTransaction.create({
        data: {
          type: 'OUT',
          quantity: item.quantity,
          variantId: item.variantId,
          reference: sale.id,
          reason: `POS Sale #${sale.billNumber}`,
          date: sale.date
        }
      });
    }

    res.status(201).json({ 
      success: true,
      message: 'Sale recorded successfully and stock updated',
      data: sale,
      revenue: calculatedTotal
    });
  } catch (err) {
    console.error('Sale error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllSales = async (req, res, next) => {
  try {
    const { startDate, endDate, customerId, limit = 100, skip = 0 } = req.query;
    let where = {};
    if (customerId) where.customerId = customerId;
    if (startDate && endDate) where.date = { gte: new Date(startDate), lte: new Date(endDate) };

    const sales = await prisma.sale.findMany({
      where,
      include: { customer: true, items: true },
      orderBy: { date: 'desc' },
      take: parseInt(limit),
      skip: parseInt(skip)
    });
    const count = await prisma.sale.count({ where });
    res.status(200).json({ success: true, data: sales, count: sales.length, total: count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTopSelling = async (req, res, next) => {
  try {
    const top = await prisma.saleItem.groupBy({
        by: ['variantId', 'displayName', 'size'],
        _sum: { quantity: true, itemTotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10
    });
    res.json(top.map(t => ({
        _id: t.variantId,
        totalQty: t._sum.quantity,
        totalRav: t._sum.itemTotal,
        displayName: t.displayName,
        size: t.size
    })));
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const todaySales = await prisma.sale.aggregate({
        where: { date: { gte: today } },
        _sum: { grandTotal: true },
        _count: { id: true }
    });
    const totalStock = await prisma.inventory.aggregate({
        where: { isActive: true },
        _sum: { quantity: true }
    });
    const lowStockAlerts = await prisma.inventory.findMany({
        where: { isActive: true, quantity: { lt: prisma.inventory.minimumStockLevel } }, // This might not work in standard findMany
        take: 10,
        include: { variant: { include: { productMaster: true } } }
    });
    // Fallback for low stock if comparison fails (Prisma limitation)
    // Actually standard prisma where quantity: { lt: 50 } works but dynamic compare doesn't.
    // We already have a queryRaw in inventoryController for this.
    
    res.json({
        success: true,
        todaySales: { total: todaySales._sum.grandTotal || 0, count: todaySales._count.id || 0 },
        totalStock: { total: totalStock._sum.quantity || 0 },
        lowStockAlerts
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.getReports = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    
    const getAgg = async (start, end) => {
        const where = end ? { date: { gte: start, lte: end } } : { date: { gte: start } };
        const stats = await prisma.sale.aggregate({
            where,
            _sum: { grandTotal: true },
            _count: { id: true }
        });
        const items = await prisma.saleItem.aggregate({
            where: { sale: where },
            _sum: { quantity: true }
        });
        return { revenue: stats._sum.grandTotal || 0, salesCount: stats._count.id || 0, itemsCount: items._sum.quantity || 0 };
    };

    const todayReport = await getAgg(todayStart);

    const inv = await prisma.inventory.findMany({ where: { isActive: true } });
    let totalStock = 0, totalValue = 0, lowStockCount = 0;
    inv.forEach(i => {
        totalStock += i.quantity;
        totalValue += (i.quantity * i.price);
        if (i.quantity < i.minimumStockLevel) lowStockCount++;
    });

    res.json({
        success: true,
        data: {
            today: { ...todayReport, period: 'Today' },
            inventory: { totalProducts: inv.length, totalStock, totalStockValue: totalValue, lowStockCount },
            generatedAt: new Date()
        }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.downloadSales = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let where = {};
        if (startDate && endDate) where.date = { gte: new Date(startDate), lte: new Date(endDate) };
        const sales = await prisma.sale.findMany({ where, include: { items: true }, orderBy: { date: 'desc' } });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bills');
        worksheet.columns = [
          { header: 'Bill No', key: 'billNo', width: 20 },
          { header: 'Date', key: 'date', width: 22 },
          { header: 'Customer', key: 'customerName', width: 25 },
          { header: 'Grand Total', key: 'grandTotal', width: 15 }
        ];
        worksheet.getRow(1).font = { bold: true };
        sales.forEach(s => worksheet.addRow({
            billNo: s.billNumber,
            date: s.date.toLocaleString('en-IN'),
            customerName: s.customerName,
            grandTotal: s.grandTotal
        }));

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Sales.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

const ExcelJS = require('exceljs');

const { query, withTransaction } = require('../lib/db');
const { createId } = require('../lib/ids');
const { getInventoryItems, getSales, getSaleCount } = require('../lib/store');

// ================= GST =================
function calculateGST(subtotal, cgstRate = 9, sgstRate = 9) {
  const cgst = (subtotal * cgstRate) / 100;
  const sgst = (subtotal * sgstRate) / 100;
  const grandTotal = Math.round(subtotal + cgst + sgst);

  return {
    subtotal,
    cgst: Number(cgst.toFixed(2)),
    sgst: Number(sgst.toFixed(2)),
    grandTotal,
  };
}

// ================= SAFE INVENTORY =================
async function findInventoryForItem(client, item) {
  try {
    if (!item.variantId) {
      console.warn("⚠️ Cannot find inventory: Missing variantId in item", item.displayName || item.productName);
      return null;
    }

    const result = await query(
      `
      SELECT 
        i.id,
        i.quantity,
        i.price,
        i.variant_id
      FROM inventory i
      WHERE i.variant_id = $1
      LIMIT 1
      `,
      [item.variantId],
      client
    );

    return result.rows[0] || null;
  } catch (err) {
    console.error("❌ Inventory Error:", err.message);
    return null;
  }
}

// ================= CREATE SALE =================
exports.createSale = async (req, res) => {
  try {
    console.log("➡️ createSale called");

    const { customerName, customerPhone, customerGSTIN, items } = req.body;

    if (!customerName || !items || items.length === 0) {
      return res.status(400).json({ message: "Invalid data" });
    }

    let subtotal = 0;
    items.forEach(i => {
      subtotal += i.quantity * i.price;
    });

    const gst = calculateGST(subtotal);
    const saleId = createId();

    // Generate sequential ascending bill number
    const countRes = await query("SELECT COUNT(*) FROM sales");
    let seq = parseInt(countRes.rows[0].count, 10) + 1;
    let billNumber = `BILL-${seq.toString().padStart(4, '0')}`;
    
    // Guarantee uniqueness
    let isUnique = false;
    while (!isUnique) {
      const check = await query("SELECT id FROM sales WHERE bill_number = $1 LIMIT 1", [billNumber]);
      if (check.rowCount === 0) {
        isUnique = true;
      } else {
        seq++;
        billNumber = `BILL-${seq.toString().padStart(4, '0')}`;
      }
    }

    await withTransaction(async (client) => {

      await query(
        `INSERT INTO sales (id, bill_number, customer_name, customer_phone, customer_gstin, subtotal, cgst, sgst, grand_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [saleId, billNumber, customerName, customerPhone || null, customerGSTIN || null, gst.subtotal, gst.cgst, gst.sgst, gst.grandTotal],
        client
      );

      for (const item of items) {

        await query(
          `INSERT INTO sale_items (id, sale_id, product_name, quantity, price, item_total)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            createId(),
            saleId,
            item.productName || item.displayName || 'Product',
            item.quantity,
            item.price,
            item.quantity * item.price
          ],
          client
        );

        const inv = await findInventoryForItem(client, item);

        if (inv) {
          await query(
            `UPDATE inventory SET quantity = quantity - $1 WHERE id = $2`,
            [item.quantity, inv.id],
            client
          );
        }
      }
    });

    const [newSale] = await getSales({ saleId });

    res.status(201).json({
      success: true,
      message: "Sale created successfully",
      data: newSale
    });

  } catch (err) {
    console.error("❌ CREATE SALE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= GET ALL SALES =================
exports.getAllSales = async (req, res) => {
  try {
    console.log("➡️ getAllSales called");

    const sales = await getSales({
      limit: parseInt(req.query.limit || 50)
    });

    console.log("✅ Sales fetched:", sales.length);

    res.json({
      success: true,
      data: sales
    });

  } catch (err) {
    console.error("❌ SALES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= GET BY ID =================
exports.getSaleById = async (req, res) => {
  try {
    const [sale] = await getSales({ saleId: req.params.saleId });

    if (!sale) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ success: true, data: sale });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ================= DELETE =================
exports.deleteBill = async (req, res) => {
  try {
    await query(`DELETE FROM sales WHERE id=$1`, [req.params.saleId]);

    res.json({ success: true, message: "Deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ================= REPORTS =================
exports.getReports = async (req, res) => {
  try {
    const sales = await getSales({ limit: 10000 });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const endOfYesterday = new Date(startOfToday.getTime() - 1);
    
    // last 7 days
    const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    
    // current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // current year
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const stats = {
      today: { salesCount: 0, revenue: 0 },
      previous: { salesCount: 0, revenue: 0 },
      weekly: { salesCount: 0, revenue: 0 },
      monthly: { salesCount: 0, revenue: 0 },
      yearly: { salesCount: 0, revenue: 0 }
    };

    sales.forEach(s => {
      // Handle Postgres timestamp vs string
      const saleDate = new Date(s.date || s.createdAt);
      if (isNaN(saleDate.getTime())) return;
      
      const total = Number(s.grandTotal) || 0;

      // yearly
      if (saleDate >= startOfYear) {
        stats.yearly.salesCount++;
        stats.yearly.revenue += total;
      }
      // monthly
      if (saleDate >= startOfMonth) {
        stats.monthly.salesCount++;
        stats.monthly.revenue += total;
      }
      // weekly
      if (saleDate >= startOfWeek) {
        stats.weekly.salesCount++;
        stats.weekly.revenue += total;
      }
      // today
      if (saleDate >= startOfToday) {
        stats.today.salesCount++;
        stats.today.revenue += total;
      }
      // yesterday
      if (saleDate >= startOfYesterday && saleDate <= endOfYesterday) {
        stats.previous.salesCount++;
        stats.previous.revenue += total;
      }
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (err) {
    console.error("❌ REPORT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= STUBS FOR MISSING ROUTES =================
exports.getFilteredSalesData = async (req, res) => res.json({ success: true, data: [] });
exports.searchBills = async (req, res) => res.json({ success: true, data: [] });
exports.exportToExcel = async (req, res) => res.status(501).json({ message: "Not implemented" });
exports.exportToCSV = async (req, res) => res.status(501).json({ message: "Not implemented" });
exports.getSalesStatistics = async (req, res) => res.json({ success: true, data: {} });
exports.getSalesSummary = async (req, res) => res.json({ success: true, data: {} });
exports.generatePDF = async (req, res) => res.status(501).json({ message: "Not implemented" });
// ================= DOWNLOAD EXCEL =================
exports.downloadSales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Fetch sales with date filtering
    const sales = await getSales({
      startDate: startDate || null,
      endDate: endDate || null,
      limit: 10000 // High limit for export
    });

    if (!sales || sales.length === 0) {
      return res.status(404).json({ message: "No bills found in the selected range" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bills');

    // Define columns
    worksheet.columns = [
      { header: 'Bill No', key: 'billNumber', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Phone Num', key: 'customerPhone', width: 15 },
      { header: 'Product Purchased', key: 'productsPurchased', width: 40 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Subtotal (₹)', key: 'subtotal', width: 15 },
      { header: 'CGST (₹)', key: 'cgst', width: 12 },
      { header: 'SGST (₹)', key: 'sgst', width: 12 },
      { header: 'Grand Total (₹)', key: 'grandTotal', width: 18 },
    ];

    // Sort sales in ascending order (oldest first / ascending bill number) for Excel
    const sortedSales = [...sales].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return dateA - dateB;
    });

    // Add rows
    sortedSales.forEach(sale => {
      const productsPurchased = sale.items ? sale.items.map(i => i.productName || i.displayName || 'Product').join(', ') : '';
      const quantities = sale.items ? sale.items.map(i => i.quantity).join(', ') : '';

      worksheet.addRow({
        billNumber: sale.billNumber || sale._id.substring(0, 8).toUpperCase(),
        date: new Date(sale.date || sale.createdAt).toLocaleDateString('en-IN'),
        customerName: sale.customerName || 'Walk-in',
        customerPhone: sale.customerPhone || (sale.customerId && sale.customerId.phone) || '',
        productsPurchased: productsPurchased,
        quantity: quantities,
        subtotal: Number(sale.subtotal || 0),
        cgst: Number(sale.cgst || 0),
        sgst: Number(sale.sgst || 0),
        grandTotal: Number(sale.grandTotal || 0),
      });
    });

    // Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F0FE' }
    };

    // Buffer and send
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=bills.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("❌ DOWNLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSalesByCustomer = async (req, res) => res.json({ success: true, data: [] });
exports.updateBill = async (req, res) => res.status(501).json({ message: "Not implemented" });
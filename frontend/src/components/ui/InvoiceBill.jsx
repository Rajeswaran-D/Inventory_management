import React, { useEffect, useState } from 'react';
import { Printer, X, Download } from 'lucide-react';
import { amountInWords } from '../../utils/numberToWords';

export const InvoiceBill = ({ isOpen, onClose, saleData }) => {
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    if (saleData && isOpen) {
      generateInvoice();
    }
  }, [saleData, isOpen]);

  const generateInvoice = () => {
    if (!saleData) return;

    // Calculate totals
    const subtotal = saleData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    
    // Tax calculation (CGST + SGST = 18% or IGST = 18%)
    const taxRate = 0.18;
    const taxAmount = subtotal * taxRate;
    const cgst = taxAmount / 2;
    const sgst = taxAmount / 2;
    const grandTotal = subtotal + taxAmount;

    setInvoice({
      billNumber: `INV-${Date.now().toString().slice(-6)}`,
      billDate: new Date().toLocaleDateString('en-IN'),
      subtotal,
      cgst,
      sgst,
      taxAmount,
      grandTotal,
      amountWords: amountInWords(grandTotal),
      items: saleData.items || []
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=900,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${invoice?.billNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; padding: 20px; background: white; }
          @media print {
            body { padding: 0; }
            .invoice-container { box-shadow: none; }
            button { display: none; }
          }
          .invoice-container {
            max-width: 900px;
            background: white;
            border: 1px solid #333;
            margin: 0 auto;
            padding: 30px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .company-name {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .sub-header {
            font-size: 12px;
            line-height: 1.6;
            color: #555;
          }
          .bill-title {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
            text-align: center;
          }
          .bill-details {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
            font-size: 13px;
          }
          .detail-item {
            border-right: 1px solid #ddd;
            padding-right: 10px;
          }
          .detail-item:last-child {
            border-right: none;
          }
          .detail-label {
            font-weight: bold;
            margin-bottom: 3px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 8px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 13px;
          }
          th {
            background: #f5f5f5;
            border: 1px solid #333;
            padding: 10px;
            text-align: left;
            font-weight: bold;
          }
          td {
            border: 1px solid #333;
            padding: 10px;
            text-align: right;
          }
          td:first-child, td:nth-child(2) { text-align: left; }
          .right-align { text-align: right !important; }
          .summary-table {
            width: 50%;
            margin-left: 50%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 20px;
          }
          .summary-table td {
            border: none;
            border-bottom: 1px solid #ddd;
            padding: 8px;
            font-weight: 500;
          }
          .summary-label { text-align: left; }
          .summary-value { text-align: right; }
          .total-row {
            background: #f5f5f5;
            font-weight: bold;
            font-size: 14px;
          }
          .amount-words {
            background: #f9f9f9;
            border: 1px solid #ddd;
            padding: 12px;
            margin: 15px 0;
            font-size: 12px;
            font-weight: 500;
            line-height: 1.6;
          }
          .footer {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 40px;
            font-size: 12px;
          }
          .footer-section {
            text-align: center;
          }
          .bank-details {
            border: 1px solid #ddd;
            padding: 10px;
            background: #f9f9f9;
            font-size: 12px;
            line-height: 1.8;
          }
          .signature-line {
            margin-top: 30px;
            border-top: 1px solid #333;
            padding-top: 5px;
            font-weight: bold;
          }
          .print-button {
            background: var(--primary);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin-bottom: 20px;
          }
          .print-button:hover {
            opacity: 0.9;
          }
          @page {
            size: A4;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">Print Invoice</button>
        ${getInvoiceHTML(invoice, saleData)}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Action Buttons */}
        <div className="sticky top-0 bg-white border-b p-4 flex gap-3 justify-end">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--primary)' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-hover)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary)'}
          >
            <Printer className="w-4 h-4" />
            Print Invoice
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-8" style={{ backgroundColor: 'var(--bg-main)' }}>
          <InvoiceContent invoice={invoice} saleData={saleData} />
        </div>
      </div>
    </div>
  );
};

const InvoiceContent = ({ invoice, saleData }) => {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <div className="text-4xl font-bold mb-2">Swamy Envelope</div>
        <div className="text-xs text-gray-600 space-y-1">
          <div>CIN: U2109MH2009PTC289890</div>
          <div>225, 6th Street, Gandhipuram, Coimbatore - 641012</div>
          <div>Phone: +91-422-2540540 | Email: info@swamyenvelope.com</div>
          <div>GSTIN: 33AABCU9203R1Z0</div>
        </div>
        <div className="text-xl font-bold mt-4">CASH BILL</div>
      </div>

      {/* Bill Details */}
      <div className="grid grid-cols-3 gap-6 mb-6 text-sm">
        <div className="border-r border-gray-300 pr-4">
          <div className="font-bold">Bill Number:</div>
          <div>{invoice.billNumber}</div>
        </div>
        <div className="border-r border-gray-300 px-4">
          <div className="font-bold">Bill Date:</div>
          <div>{invoice.billDate}</div>
        </div>
        <div className="px-4">
          <div className="font-bold">GSTIN:</div>
          <div>33AABCU9203R1Z0</div>
        </div>
      </div>

      {/* Customer Section */}
      <div className="mb-6">
        <div className="font-bold text-sm mb-2">Bill To:</div>
        <div className="text-sm border border-gray-300 p-4 bg-gray-50">
          <div className="font-bold">{saleData.customerName || 'Walk-in Customer'}</div>
          <div className="text-xs text-gray-600">{saleData.customerPhone || 'N/A'}</div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-2 border-gray-800 mb-6 text-sm">
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th className="border border-gray-800 px-3 py-2 text-left w-12">S.No</th>
            <th className="border border-gray-800 px-3 py-2 text-left">Description</th>
            <th className="border border-gray-800 px-3 py-2 text-right w-20">Qty</th>
            <th className="border border-gray-800 px-3 py-2 text-right w-20">Rate (Rs)</th>
            <th className="border border-gray-800 px-3 py-2 text-right w-24">Amount (Rs)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={idx}>
              <td className="border border-gray-800 px-3 py-2 text-left">{idx + 1}</td>
              <td className="border border-gray-800 px-3 py-2 text-left">
                <div className="font-medium">{item.size || 'N/A'}</div>
                <div className="text-xs text-gray-600">{item.materialType} • GSM {item.gsm || 'N/A'}</div>
              </td>
              <td className="border border-gray-800 px-3 py-2 text-right">{item.quantity}</td>
              <td className="border border-gray-800 px-3 py-2 text-right">₹{item.rate?.toFixed(2) || '0.00'}</td>
              <td className="border border-gray-800 px-3 py-2 text-right font-medium">
                ₹{(item.quantity * item.rate).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Calculations */}
      <div className="mb-6 flex justify-end">
        <div className="w-1/3 border border-gray-800">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="px-4 py-2 text-left font-medium">Subtotal</td>
                <td className="px-4 py-2 text-right font-medium">₹{invoice.subtotal.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="px-4 py-2 text-left font-medium">CGST (9%)</td>
                <td className="px-4 py-2 text-right font-medium">₹{invoice.cgst.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="px-4 py-2 text-left font-medium">SGST (9%)</td>
                <td className="px-4 py-2 text-right font-medium">₹{invoice.sgst.toFixed(2)}</td>
              </tr>
              <tr style={{ backgroundColor: '#f5f5f5' }} className="border-b border-gray-800">
                <td className="px-4 py-3 text-left font-bold text-lg">Grand Total</td>
                <td className="px-4 py-3 text-right font-bold text-lg">₹{invoice.grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="bg-gray-50 border border-gray-800 p-4 mb-6 text-sm">
        <div className="font-bold mb-2">Amount in Words:</div>
        <div className="text-sm font-medium">{invoice.amountWords}</div>
      </div>

      {/* Footer */}
      <div className="grid grid-cols-2 gap-12 mt-12">
        {/* Left - Received Goods */}
        <div className="text-center">
          <div className="text-xs font-bold mb-4">Received the goods in good condition</div>
          <div className="mt-12 pt-4 border-t border-gray-800">
            <div className="text-xs font-bold">Recipient Signature</div>
          </div>
        </div>

        {/* Right - Company Details & Signature */}
        <div>
          <div className="bg-gray-50 border border-gray-300 p-4 mb-4 text-xs">
            <div className="font-bold mb-3">Bank Details</div>
            <div className="space-y-1">
              <div><span className="font-bold">Bank:</span> Kotak Mahindra Bank</div>
              <div><span className="font-bold">Account:</span> 7609820001234</div>
              <div><span className="font-bold">IFSC:</span> KKBK0000001</div>
            </div>
          </div>
          <div className="text-center mt-8">
            <div className="font-bold text-sm mb-12">For Swamy Envelope</div>
            <div className="pt-4 border-t border-gray-800">
              <div className="text-xs font-bold">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-12 text-xs text-center text-gray-600 pt-4 border-t border-gray-300">
        <p>Thank you for your business. This is a computer-generated invoice.</p>
      </div>
    </div>
  );
};

/**
 * Generate HTML for invoice to display in print window
 */
const getInvoiceHTML = (invoice, saleData) => {
  return `
    <div class="invoice-container">
      <!-- Header -->
      <div class="header">
        <div class="company-name">Swamy Envelope</div>
        <div class="sub-header">
          <div>CIN: U2109MH2009PTC289890</div>
          <div>225, 6th Street, Gandhipuram, Coimbatore - 641012</div>
          <div>Phone: +91-422-2540540 | Email: info@swamyenvelope.com</div>
          <div>GSTIN: 33AABCU9203R1Z0</div>
        </div>
        <div class="bill-title">CASH BILL</div>
      </div>

      <!-- Bill Details -->
      <div class="bill-details">
        <div class="detail-item">
          <div class="detail-label">Bill Number:</div>
          <div>${invoice.billNumber}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Bill Date:</div>
          <div>${invoice.billDate}</div>
        </div>
        <div>
          <div class="detail-label">GSTIN:</div>
          <div>33AABCU9203R1Z0</div>
        </div>
      </div>

      <!-- Customer Section -->
      <div class="section">
        <div class="section-title">Bill To:</div>
        <div style="padding: 10px; background: #f9f9f9; border: 1px solid #ddd; font-size: 13px;">
          <strong>${saleData.customerName || 'Walk-in Customer'}</strong><br>
          ${saleData.customerPhone || 'N/A'}
        </div>
      </div>

      <!-- Items Table -->
      <div class="section">
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">S.No</th>
              <th>Description</th>
              <th style="width: 70px;">Qty</th>
              <th style="width: 90px;">Rate (Rs)</th>
              <th style="width: 100px;">Amount (Rs)</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item, idx) => `
              <tr>
                <td class="right-align">${idx + 1}</td>
                <td>
                  <strong>${item.size || 'N/A'}</strong><br>
                  <span style="font-size: 11px; color: #666;">${item.materialType} • GSM ${item.gsm || 'N/A'}</span>
                </td>
                <td class="right-align">${item.quantity}</td>
                <td class="right-align">₹${item.rate?.toFixed(2) || '0.00'}</td>
                <td class="right-align">₹${(item.quantity * item.rate).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Summary Table -->
      <table class="summary-table">
        <tr>
          <td class="summary-label">Subtotal</td>
          <td class="summary-value">₹${invoice.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="summary-label">CGST (9%)</td>
          <td class="summary-value">₹${invoice.cgst.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="summary-label">SGST (9%)</td>
          <td class="summary-value">₹${invoice.sgst.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td class="summary-label">Grand Total</td>
          <td class="summary-value">₹${invoice.grandTotal.toFixed(2)}</td>
        </tr>
      </table>

      <!-- Amount in Words -->
      <div class="amount-words">
        <strong>Amount in Words:</strong><br>
        ${invoice.amountWords}
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-section">
          <div style="font-size: 11px; margin-bottom: 30px;">Received the goods in good condition</div>
          <div class="signature-line">Recipient Signature</div>
        </div>
        <div class="footer-section">
          <div class="bank-details">
            <strong>Bank Details</strong><br>
            Bank: Kotak Mahindra Bank<br>
            Account: 7609820001234<br>
            IFSC: KKBK0000001
          </div>
          <div style="margin-top: 20px;">
            <div style="margin-bottom: 30px; font-weight: bold;">For Swamy Envelope</div>
            <div class="signature-line">Authorized Signatory</div>
          </div>
        </div>
      </div>

      <!-- Thank You Footer -->
      <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
        <p>Thank you for your business. This is a computer-generated invoice.</p>
      </div>
    </div>
  `;
};

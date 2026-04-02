import React, { useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { Card, CardContent } from './Card';

export const ViewBillModal = ({ bill, onClose }) => {
  // Handle date field (use createdAt if date is not available)
  const dateField = bill.date || bill.createdAt || new Date();
  
  const billDate = new Date(dateField).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const billTime = new Date(dateField).toLocaleTimeString('en-IN');

  // Parse items - handle both array and string formats
  const getItems = () => {
    if (!bill.items) return [];
    
    // If it's already an array
    if (Array.isArray(bill.items)) {
      // Check if items are strings that need parsing
      return bill.items.map(item => {
        if (typeof item === 'string') {
          // Try to parse string representations
          try {
            // Handle @{...} PowerShell format
            if (item.startsWith('@{') && item.endsWith('}')) {
              const parsed = {};
              const content = item.slice(2, -1);
              const pairs = content.split(';').map(p => p.trim()).filter(p => p);
              pairs.forEach(pair => {
                const [key, value] = pair.split('=').map(p => p.trim());
                parsed[key] = value === '' ? '' : value;
              });
              return parsed;
            }
            // Try JSON parsing
            return JSON.parse(item);
          } catch {
            // If parsing fails, return the string as-is
            return { displayName: item, productName: item };
          }
        }
        return item;
      });
    }
    
    // If it's a string, try to parse it
    if (typeof bill.items === 'string') {
      try {
        const parsed = JSON.parse(bill.items);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [];
      }
    }
    
    return [];
  };

  const items = getItems();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generatePrintHTML());
    printWindow.document.close();
    printWindow.print();
  };

  const generatePrintHTML = () => {
    const itemsHTML = items
      .map(
        (item, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.displayName || item.productName || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity || 0}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${Number(item.price || 0).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${Number(item.itemTotal || item.price * item.quantity || 0).toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    return `
    <html>
      <head>
        <title>Bill - ${bill._id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #333; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; font-size: 12px; }
          .bill-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; font-size: 13px; }
          .info-section { }
          .info-label { font-weight: bold; color: #333; }
          .info-value { color: #666; margin-top: 3px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f0f0f0; padding: 10px; text-align: left; font-weight: bold; font-size: 13px; }
          td { font-size: 12px; }
          .total-section { text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; }
          .total-row { font-size: 14px; font-weight: bold; margin: 8px 0; }
          .grand-total { font-size: 18px; color: #27ae60; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📄 INVOICE</h1>
          <p>Bill ID: <strong>${bill._id}</strong></p>
        </div>

        <div class="bill-info">
          <div class="info-section">
            <div class="info-label">Customer Name:</div>
            <div class="info-value">${bill.customerName || 'N/A'}</div>
          </div>
          <div class="info-section">
            <div class="info-label">Phone:</div>
            <div class="info-value">${bill.customerPhone || 'N/A'}</div>
          </div>
          <div class="info-section">
            <div class="info-label">Date:</div>
            <div class="info-value">${billDate}</div>
          </div>
          <div class="info-section">
            <div class="info-label">Time:</div>
            <div class="info-value">${billTime}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">No.</th>
              <th style="width: 50%;">Product</th>
              <th style="width: 15%; text-align: center;">Qty</th>
              <th style="width: 15%; text-align: right;">Price</th>
              <th style="width: 15%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">Total Items: ${items.length || 0}</div>
          <div class="grand-total">
            Grand Total: ₹${Number(bill.grandTotal || 0).toFixed(2)}
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
        </div>
      </body>
    </html>
    `;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardContent>
          {/* Header */}
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-800 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bill Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Bill Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Bill ID</p>
              <p className="text-lg font-mono text-gray-900 dark:text-white">{bill._id}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Date & Time</p>
              <p className="text-lg text-gray-900 dark:text-white">
                {billDate} {billTime}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Customer Name</p>
              <p className="text-lg text-gray-900 dark:text-white">{bill.customerName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Phone</p>
              <p className="text-lg text-gray-900 dark:text-white">{bill.customerPhone || 'N/A'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      No.
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Product
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      Qty
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Price
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items && items.length > 0 ? (
                    items.map((item, idx) => {
                      const itemName = item?.displayName || item?.productName || item?.name || 'Unknown Product';
                      const itemQty = item?.quantity || 0;
                      const itemPrice = item?.price || 0;
                      const itemTotal = item?.itemTotal || (itemPrice * itemQty);
                      
                      return (
                        <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white">
                            {idx + 1}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-gray-900 dark:text-white">
                            {itemName}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-gray-900 dark:text-white">
                            {itemQty}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-gray-900 dark:text-white">
                            ₹{Number(itemPrice).toFixed(2)}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                            ₹{Number(itemTotal).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                        No detailed items available. Total: ₹{Number(bill.grandTotal || 0).toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-900 dark:text-white">Total Items:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{items.length || 0}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-900 dark:text-white">Grand Total:</span>
              <span className="text-green-600 dark:text-green-400">₹{Number(bill.grandTotal || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex-1 justify-center"
            >
              <Printer className="w-5 h-5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg transition flex-1 justify-center"
            >
              Close
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

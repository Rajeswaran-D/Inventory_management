/**
 * PROFESSIONAL INVOICE COMPONENT
 * Generates print-ready bills matching Swamy Envelope's physical bill format
 * 
 * Features:
 * - Company header with GSTIN
 * - Customer details
 * - Item table with GST calculations
 * - Amount in words
 * - Print-friendly A4 layout
 * - Footer with signatures and bank details
 */

import React, { useState } from 'react';
import { Printer, Download, X } from 'lucide-react';
import { numberToWords, amountInWords } from '../../utils/numberToWords';
import { calculateTaxBreakdown } from '../../utils/gstCalculations';

export const Invoice = ({ sale, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!sale) return null;

  // =========================================================================
  // DATA EXTRACTION
  // =========================================================================

  const billNumber = sale._id.substring(0, 8).toUpperCase();
  const billDate = new Date(sale.date || sale.createdAt).toLocaleDateString('en-IN');
  const customerName = sale.customerName || 'N/A';
  const customerPhone = sale.customerPhone || '';

  // Calculate items subtotal and tax breakdown
  const itemsSubtotal = sale.items.reduce((sum, item) => {
    const itemTotal = (item.quantity || 0) * (item.price || 0);
    return sum + itemTotal;
  }, 0);

  const taxBreakdown = calculateTaxBreakdown(itemsSubtotal, 9, 9);

  // =========================================================================
  // PRINT HANDLER
  // =========================================================================

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <>
      {/* MODAL BACKDROP */}
      {!isPrinting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto">
            {/* TOOLBAR */}
            <div className="sticky top-0 bg-gray-100 border-b border-gray-300 px-6 py-3 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Invoice Preview</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print/Download
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>

            {/* INVOICE CONTENT */}
            <div className="p-8" id="invoice-content">
              <InvoiceContent
                sale={sale}
                billNumber={billNumber}
                billDate={billDate}
                customerName={customerName}
                customerPhone={customerPhone}
                itemsSubtotal={itemsSubtotal}
                taxBreakdown={taxBreakdown}
              />
            </div>
          </div>
        </div>
      )}

      {/* PRINT VIEW */}
      {isPrinting && (
        <div className="print-only" id="print-invoice">
          <InvoiceContent
            sale={sale}
            billNumber={billNumber}
            billDate={billDate}
            customerName={customerName}
            customerPhone={customerPhone}
            itemsSubtotal={itemsSubtotal}
            taxBreakdown={taxBreakdown}
          />
        </div>
      )}
    </>
  );
};

/**
 * INVOICE CONTENT - Reusable for both preview and print
 */
const InvoiceContent = ({
  sale,
  billNumber,
  billDate,
  customerName,
  customerPhone,
  itemsSubtotal,
  taxBreakdown
}) => {
  return (
    <div className="invoice-page w-full" style={{ maxWidth: '210mm', margin: '0 auto' }}>
      {/* ====================================================================
          HEADER SECTION
          ==================================================================== */}

      <div className="border border-gray-800 p-6 mb-0">
        {/* Company Info Row */}
        <div className="grid grid-cols-3 gap-8 mb-8">
          {/* Left: Company Details */}
          <div className="col-span-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              SWAMY ENVELOPE
            </h1>
            <div className="text-sm text-gray-700 space-y-1 border-l-4 border-gray-800 pl-4">
              <p>
                <span className="font-semibold">Regd. Office:</span> 225, 6th Street,
              </p>
              <p>Gandhipuram, Coimbatore - 641012</p>
              <p>
                <span className="font-semibold">Phone:</span> +91-XXXXXXXXXX
              </p>
              <p>
                <span className="font-semibold">Email:</span> info@swamyenvelope.com
              </p>
              <p>
                <span className="font-semibold">GSTIN:</span> 33AABCU9603R1Z0
              </p>
            </div>
          </div>

          {/* Right: Bill Info */}
          <div className="text-right space-y-3">
            <div className="text-center">
              <p className="text-lg font-bold border border-gray-900 p-2 inline-block">
                CASH BILL
              </p>
            </div>
            <div className="border border-gray-800 p-3 space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="font-semibold">Bill No.:</span>
                <span>{billNumber}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold">Date:</span>
                <span>{billDate}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          CUSTOMER SECTION
          ==================================================================== */}

      <div className="border-l border-r border-b border-gray-800 px-6 py-4 mb-0">
        <p className="font-bold text-gray-900 mb-2">To:</p>
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{customerName}</p>
          {customerPhone && (
            <p>
              <span className="font-semibold">Phone:</span> {customerPhone}
            </p>
          )}
          <p>
            <span className="font-semibold">Address:</span> Coimbatore
          </p>
        </div>
      </div>

      {/* ====================================================================
          BILL ITEMS TABLE
          ==================================================================== */}

      <table className="w-full border-collapse mb-0">
        <thead>
          <tr>
            <th className="border border-gray-800 p-2 text-left font-bold text-xs w-8">
              S.No
            </th>
            <th className="border border-gray-800 p-2 text-left font-bold text-xs">
              Description
            </th>
            <th className="border border-gray-800 p-2 text-center font-bold text-xs w-20">
              Qty
            </th>
            <th className="border border-gray-800 p-2 text-right font-bold text-xs w-24">
              Rate (Rs)
            </th>
            <th className="border border-gray-800 p-2 text-right font-bold text-xs w-28">
              Amount (Rs)
            </th>
          </tr>
        </thead>
        <tbody>
          {sale.items && sale.items.length > 0 ? (
            sale.items.map((item, index) => {
              const itemTotal = (item.quantity || 0) * (item.price || 0);
              const description = formatItemDescription(item);

              return (
                <tr key={index}>
                  <td className="border border-gray-800 p-2 text-xs text-center">
                    {index + 1}
                  </td>
                  <td className="border border-gray-800 p-2 text-xs">
                    {description}
                  </td>
                  <td className="border border-gray-800 p-2 text-xs text-center">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-800 p-2 text-xs text-right">
                    ₹ {(item.price || 0).toFixed(2)}
                  </td>
                  <td className="border border-gray-800 p-2 text-xs text-right font-semibold">
                    ₹ {itemTotal.toFixed(2)}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5" className="border border-gray-800 p-2 text-center text-xs">
                No items
              </td>
            </tr>
          )}

          {/* Empty rows for spacing */}
          {sale.items && sale.items.length < 5 &&
            Array.from({ length: 5 - sale.items.length }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td colSpan="5" className="border border-gray-800 p-2 h-6"></td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* ====================================================================
          SUMMARY & TAX SECTION
          ==================================================================== */}

      <div className="border border-gray-800 border-t-0">
        <div className="grid grid-cols-2 gap-0">
          {/* Left: Amount in Words */}
          <div className="border-r border-gray-800 p-4">
            <p className="font-bold text-sm mb-2">Amount in Words:</p>
            <p className="text-xs leading-relaxed font-semibold text-gray-900">
              {amountInWords(taxBreakdown.grandTotal)}
            </p>
          </div>

          {/* Right: Tax Calculation */}
          <div className="p-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Subtotal:</span>
              <span>₹ {taxBreakdown.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>CGST (9%):</span>
              <span>₹ {taxBreakdown.cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>SGST (9%):</span>
              <span>₹ {taxBreakdown.sgst.toFixed(2)}</span>
            </div>
            {taxBreakdown.roundOff !== 0 && (
              <div className="flex justify-between text-xs">
                <span>Round Off:</span>
                <span>₹ {taxBreakdown.roundOff.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-gray-800 pt-2 mt-2">
              <span>Grand Total:</span>
              <span>₹ {taxBreakdown.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          FOOTER SECTION
          ==================================================================== */}

      <div className="border border-gray-800 border-t-0">
        <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-800">
          <div className="text-xs">
            <p className="font-semibold mb-1">Received the goods in good condition</p>
            <div className="h-12 border-t border-gray-800 mt-4"></div>
            <p className="text-center text-xs mt-1">Receiver's Signature</p>
          </div>

          <div className="text-xs">
            <p className="font-semibold mb-1">For SWAMY ENVELOPE</p>
            <div className="h-12 border-t border-gray-800 mt-4"></div>
            <p className="text-center text-xs mt-1">Authorized Signature</p>
          </div>
        </div>

        {/* Bank Details */}
        <div className="p-4">
          <p className="font-bold text-xs mb-2">Bank Details:</p>
          <div className="text-xs space-y-1">
            <p>
              <span className="font-semibold">Bank Name:</span> ICICI Bank Limited
            </p>
            <p>
              <span className="font-semibold">Account No.:</span> 1234567890123456
            </p>
            <p>
              <span className="font-semibold">IFSC Code:</span> ICIC0000001
            </p>
            <p className="text-center mt-3 text-xs italic text-gray-600">
              "Thank you for your business. Please retain this bill for your records."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * FORMAT ITEM DESCRIPTION
 * Converts item data to "Size | Material | GSM" format
 */
function formatItemDescription(item) {
  const parts = [];

  if (item.size) parts.push(item.size);
  if (item.productName) parts.push(item.productName);
  if (item.gsm) parts.push(`${item.gsm} GSM`);
  if (item.color && item.color !== 'null') parts.push(item.color);

  return parts.join(' | ') || item.displayName || 'Product';
}

export default Invoice;

/**
 * PROFESSIONAL INVOICE COMPONENT — SWAMY ENVELOPE
 * 
 * Generates print-ready bills matching the exact physical bill format:
 * - Company header with GSTIN, address, phone
 * - CASH BILL badge with Bill No. and Date
 * - Customer section with GSTIN
 * - Itemized table: S.No | Description | Qty | Rate | Amount
 * - GST breakdown: Subtotal, CGST 9%, SGST 9%, IGST, Round Off
 * - Grand Total with amount in words
 * - Bank details + signature blocks
 * - A4 print-ready layout with blue borders
 */

import React, { useState, useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { numberToWords, amountInWords } from '../../utils/numberToWords';
import { calculateTaxBreakdown } from '../../utils/gstCalculations';

export const Invoice = ({ sale, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const invoiceRef = useRef(null);

  if (!sale) return null;

  // =========================================================================
  // DATA EXTRACTION
  // =========================================================================
  const billNumber = sale.billNumber || sale._id?.substring(0, 8).toUpperCase() || 'DRAFT';
  const billDate = new Date(sale.date || sale.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  const customerName = sale.customerName || 'Walk-in Customer';
  const customerPhone = sale.customerPhone || '';
  const customerGSTIN = sale.customerGSTIN || '';

  // Tax calculation — use stored values if available, otherwise calculate
  const subtotal = sale.subtotal || sale.items.reduce((sum, item) => {
    return sum + ((item.quantity || 0) * (item.price || 0));
  }, 0);

  const taxBreakdown = (sale.cgst !== undefined && sale.cgst !== null) 
    ? {
        subtotal: sale.subtotal || subtotal,
        cgst: sale.cgst,
        sgst: sale.sgst,
        roundOff: sale.roundOff || 0,
        grandTotal: sale.grandTotal
      }
    : calculateTaxBreakdown(subtotal, 9, 9);

  // =========================================================================
  // PRINT HANDLER
  // =========================================================================
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 200);
  };

  // =========================================================================
  // STYLES — Invoice-specific inline styles for exact rendering
  // =========================================================================
  const S = {
    page: {
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      padding: '12mm 15mm',
      fontFamily: "'Segoe UI', 'Arial', sans-serif",
      fontSize: '12px',
      color: '#1a1a2e',
      background: '#fff',
      boxSizing: 'border-box',
    },
    border: { border: '2px solid #1e3a5f' },
    borderThin: { border: '1px solid #1e3a5f' },
    borderBottom: { borderBottom: '1px solid #1e3a5f' },
    headerContainer: {
      border: '2px solid #1e3a5f',
      padding: '0',
    },
    companyName: {
      fontSize: '28px',
      fontWeight: '800',
      color: '#1e3a5f',
      letterSpacing: '2px',
      marginBottom: '4px',
    },
    cashBill: {
      border: '2px solid #1e3a5f',
      padding: '6px 20px',
      fontSize: '16px',
      fontWeight: '700',
      color: '#1e3a5f',
      letterSpacing: '3px',
      display: 'inline-block',
    },
    th: {
      border: '1px solid #1e3a5f',
      padding: '8px 10px',
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      backgroundColor: '#e8f0fe',
      color: '#1e3a5f',
    },
    td: {
      border: '1px solid #1e3a5f',
      padding: '7px 10px',
      fontSize: '11px',
      verticalAlign: 'middle',
    },
    tdRight: {
      border: '1px solid #1e3a5f',
      padding: '7px 10px',
      fontSize: '11px',
      textAlign: 'right',
      fontFamily: "'Courier New', monospace",
    },
    tdCenter: {
      border: '1px solid #1e3a5f',
      padding: '7px 10px',
      fontSize: '11px',
      textAlign: 'center',
    },
    label: {
      fontWeight: '600',
      color: '#1e3a5f',
      fontSize: '11px',
    },
    value: {
      fontSize: '11px',
      color: '#333',
    },
    grandTotalRow: {
      fontWeight: '800',
      fontSize: '14px',
      color: '#1e3a5f',
    }
  };

  // =========================================================================
  // INVOICE CONTENT — Used for both preview and print
  // =========================================================================
  const InvoiceBody = () => (
    <div className="invoice-page" style={S.page}>
      
      {/* ================================================================
          HEADER SECTION
          ================================================================ */}
      <div style={{ ...S.headerContainer, marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          
          {/* LEFT: Company Details */}
          <div style={{ padding: '16px 20px', flex: '1' }}>
            <h1 style={S.companyName}>SWAMY ENVELOPE</h1>
            <div style={{ borderLeft: '3px solid #1e3a5f', paddingLeft: '12px', marginTop: '6px' }}>
              <p style={{ fontSize: '11px', color: '#444', lineHeight: '1.6' }}>
                <strong>Regd. Office:</strong> 225, 6th Street,<br />
                Gandhipuram, Coimbatore - 641012<br />
                <strong>Phone:</strong> +91-9876543210 &nbsp;|&nbsp; <strong>Email:</strong> info@swamyenvelope.com<br />
                <strong>GSTIN:</strong> <span style={{ fontFamily: 'Courier New', fontWeight: '600', letterSpacing: '1px' }}>33AABCU9603R1Z0</span>
              </p>
            </div>
          </div>

          {/* RIGHT: Cash Bill + Bill Info */}
          <div style={{ padding: '16px 20px', textAlign: 'right', minWidth: '200px' }}>
            <div style={{ marginBottom: '12px', textAlign: 'center' }}>
              <span style={S.cashBill}>CASH BILL</span>
            </div>
            <table style={{ marginLeft: 'auto', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ ...S.label, padding: '4px 12px 4px 0', textAlign: 'left' }}>Bill No.</td>
                  <td style={{ padding: '4px 0', fontWeight: '700', fontFamily: 'Courier New', letterSpacing: '1px', color: '#1e3a5f' }}>: {billNumber}</td>
                </tr>
                <tr>
                  <td style={{ ...S.label, padding: '4px 12px 4px 0', textAlign: 'left' }}>Date</td>
                  <td style={{ padding: '4px 0', fontWeight: '600' }}>: {billDate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================================================================
          CUSTOMER SECTION
          ================================================================ */}
      <div style={{ borderLeft: '2px solid #1e3a5f', borderRight: '2px solid #1e3a5f', borderBottom: '2px solid #1e3a5f', padding: '12px 20px', marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ ...S.label, marginBottom: '4px', fontSize: '12px' }}>To:</p>
            <p style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a2e' }}>{customerName}</p>
            {customerPhone && (
              <p style={S.value}><span style={S.label}>Phone:</span> {customerPhone}</p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            {customerGSTIN && (
              <p style={S.value}><span style={S.label}>GSTIN:</span> <span style={{ fontFamily: 'Courier New' }}>{customerGSTIN}</span></p>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================
          ITEMS TABLE
          ================================================================ */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0 }}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: '50px', textAlign: 'center' }}>S.No</th>
            <th style={{ ...S.th, textAlign: 'left' }}>Description</th>
            <th style={{ ...S.th, width: '80px', textAlign: 'center' }}>Qty</th>
            <th style={{ ...S.th, width: '100px', textAlign: 'right' }}>Rate (₹)</th>
            <th style={{ ...S.th, width: '120px', textAlign: 'right' }}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {sale.items && sale.items.length > 0 ? (
            sale.items.map((item, index) => {
              const itemTotal = item.itemTotal || (item.quantity || 0) * (item.price || 0);
              const description = formatItemDescription(item);

              return (
                <tr key={index}>
                  <td style={S.tdCenter}>{index + 1}</td>
                  <td style={S.td}>{description}</td>
                  <td style={S.tdCenter}>{item.quantity}</td>
                  <td style={S.tdRight}>{(item.price || 0).toFixed(2)}</td>
                  <td style={{ ...S.tdRight, fontWeight: '600' }}>{itemTotal.toFixed(2)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5" style={{ ...S.td, textAlign: 'center' }}>No items</td>
            </tr>
          )}

          {/* Empty rows to fill minimum 8 rows */}
          {sale.items && sale.items.length < 8 &&
            Array.from({ length: 8 - sale.items.length }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={S.tdCenter}>&nbsp;</td>
                <td style={S.td}>&nbsp;</td>
                <td style={S.tdCenter}>&nbsp;</td>
                <td style={S.tdRight}>&nbsp;</td>
                <td style={S.tdRight}>&nbsp;</td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* ================================================================
          SUMMARY & TAX SECTION
          ================================================================ */}
      <div style={{ border: '2px solid #1e3a5f', borderTop: 'none' }}>
        <div style={{ display: 'flex' }}>
          
          {/* LEFT: Amount in Words */}
          <div style={{ flex: '1', borderRight: '1px solid #1e3a5f', padding: '14px 16px' }}>
            <p style={{ ...S.label, marginBottom: '6px', fontSize: '11px' }}>Amount in Words:</p>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#1a1a2e', lineHeight: '1.5', fontStyle: 'italic' }}>
              {amountInWords(taxBreakdown.grandTotal)}
            </p>
          </div>

          {/* RIGHT: Tax Calculation */}
          <div style={{ width: '280px', padding: '10px 16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 0', fontSize: '11px', color: '#555' }}>Subtotal</td>
                  <td style={{ padding: '3px 0', fontSize: '11px', textAlign: 'right', fontFamily: 'Courier New' }}>₹ {taxBreakdown.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', fontSize: '11px', color: '#555' }}>CGST @ 9%</td>
                  <td style={{ padding: '3px 0', fontSize: '11px', textAlign: 'right', fontFamily: 'Courier New' }}>₹ {taxBreakdown.cgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', fontSize: '11px', color: '#555' }}>SGST @ 9%</td>
                  <td style={{ padding: '3px 0', fontSize: '11px', textAlign: 'right', fontFamily: 'Courier New' }}>₹ {taxBreakdown.sgst.toFixed(2)}</td>
                </tr>
                {(sale.igst > 0) && (
                  <tr>
                    <td style={{ padding: '3px 0', fontSize: '11px', color: '#555' }}>IGST</td>
                    <td style={{ padding: '3px 0', fontSize: '11px', textAlign: 'right', fontFamily: 'Courier New' }}>₹ {sale.igst.toFixed(2)}</td>
                  </tr>
                )}
                {taxBreakdown.roundOff !== 0 && (
                  <tr>
                    <td style={{ padding: '3px 0', fontSize: '11px', color: '#888' }}>Round Off</td>
                    <td style={{ padding: '3px 0', fontSize: '11px', textAlign: 'right', fontFamily: 'Courier New', color: '#888' }}>₹ {taxBreakdown.roundOff.toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan="2" style={{ borderTop: '2px solid #1e3a5f', padding: '0' }}></td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', ...S.grandTotalRow }}>GRAND TOTAL</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', ...S.grandTotalRow, fontFamily: 'Courier New', letterSpacing: '1px' }}>₹ {taxBreakdown.grandTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================================================================
          FOOTER SECTION
          ================================================================ */}
      <div style={{ border: '2px solid #1e3a5f', borderTop: 'none' }}>
        
        {/* Signatures Row */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e3a5f' }}>
          <div style={{ flex: '1', padding: '12px 16px', borderRight: '1px solid #1e3a5f' }}>
            <p style={{ fontSize: '10px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>
              Received the above goods in good condition
            </p>
            <div style={{ height: '50px', borderBottom: '1px solid #ccc', marginTop: '30px' }}></div>
            <p style={{ textAlign: 'center', fontSize: '10px', color: '#888', marginTop: '4px' }}>Receiver's Signature</p>
          </div>
          <div style={{ flex: '1', padding: '12px 16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', color: '#1e3a5f' }}>
              For SWAMY ENVELOPE
            </p>
            <div style={{ height: '50px', borderBottom: '1px solid #ccc', marginTop: '30px' }}></div>
            <p style={{ textAlign: 'center', fontSize: '10px', color: '#888', marginTop: '4px' }}>Authorized Signature</p>
          </div>
        </div>

        {/* Bank Details */}
        <div style={{ padding: '12px 16px' }}>
          <p style={{ fontWeight: '700', fontSize: '11px', color: '#1e3a5f', marginBottom: '6px' }}>Bank Details:</p>
          <div style={{ display: 'flex', gap: '40px', fontSize: '10px', color: '#555' }}>
            <p><strong>Bank:</strong> ICICI Bank Limited</p>
            <p><strong>A/C No.:</strong> 1234567890123456</p>
            <p><strong>IFSC:</strong> ICIC0000001</p>
            <p><strong>Branch:</strong> Gandhipuram</p>
          </div>
          <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px', fontStyle: 'italic', color: '#888' }}>
            "Thank you for your business. Goods once sold will not be taken back. Subject to Coimbatore jurisdiction."
          </p>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <>
      {/* MODAL BACKDROP */}
      {!isPrinting && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4" 
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <div className="bg-white rounded-lg shadow-2xl w-full" style={{ maxWidth: '900px', maxHeight: '92vh', overflow: 'auto' }}>
            {/* TOOLBAR */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between" style={{ background: '#f0f4ff' }}>
              <h2 className="text-xl font-bold" style={{ color: '#1e3a5f' }}>
                Invoice #{billNumber}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg font-semibold transition-all hover:shadow-lg"
                  style={{ background: '#1e3a5f' }}
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>

            {/* INVOICE PREVIEW */}
            <div className="p-6" style={{ background: '#f5f5f5' }}>
              <div ref={invoiceRef} style={{ background: '#fff', boxShadow: '0 2px 20px rgba(0,0,0,0.1)' }}>
                <InvoiceBody />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT VIEW — Only rendered during print */}
      {isPrinting && (
        <div className="print-only" id="print-invoice">
          <InvoiceBody />
        </div>
      )}
    </>
  );
};

/**
 * FORMAT ITEM DESCRIPTION
 * Converts item data to a readable description
 */
function formatItemDescription(item) {
  // Use displayName if available (most descriptive)
  if (item.displayName && item.displayName !== 'Product') {
    return item.displayName;
  }

  const parts = [];
  if (item.productName) parts.push(item.productName);
  if (item.gsm) parts.push(`${item.gsm} GSM`);
  if (item.size) parts.push(item.size);
  if (item.color && item.color !== 'null') parts.push(item.color);

  return parts.join(' | ') || 'Product';
}

export default Invoice;

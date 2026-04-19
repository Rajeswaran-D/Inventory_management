# Professional Invoice System Documentation

## Overview
The Swamy Envelope inventory management system now includes a professional, print-ready invoice (bill) generation system. This system creates GST-compliant bills that match real-world paper invoice formats.

---

## Features

### 1. **Professional Bill Layout**
- **Company Header**: Swamy Envelope branding with CIN, address, contact details, and GSTIN
- **Bill Title**: "CASH BILL" clearly marked
- **Invoice Number**: Auto-generated (INV-{timestamp})
- **Bill Date**: Auto-populated with current date

### 2. **Item Details Section**
- **S.No**: Sequential item numbering
- **Description**: Product size, material type, and GSM
- **Quantity**: Number of items sold
- **Rate**: Unit price (₹)
- **Amount**: Quantity × Rate with automatic calculation

### 3. **GST Calculations** ✓
- **Subtotal**: Sum of all items
- **CGST (9%)**: Central Goods and Services Tax
- **SGST (9%)**: State Goods and Services Tax
- **Grand Total**: Subtotal + CGST + SGST (Total: 18% tax)
- **Amount in Words**: E.g., "Four Thousand Two Hundred Rupees and Fifty Paise Only"

### 4. **Professional Footer**
- **Received Signature**: Section for customer confirmation
- **Bank Details**: Kotak Mahindra Bank account information (can be updated)
- **Authorized Signature**: Company representative signature line
- **Thank You Note**: Professional closing message

### 5. **Print Functionality** 🖨️
- **A4 Page Layout**: Formatted for standard A4 paper
- **Print-Ready**: Professional formatting with borders and spacing
- **Web Print Window**: Opens in new window with print dialog
- **No Overflow**: Automatically fits on single page

### 6. **Dark Mode Support** 🌙
- All components respect application theme (light/dark modes)
- Professional appearance in both modes
- Uses CSS variables from main theme system

---

## Component Structure

### **InvoiceBill.jsx** (`frontend/src/components/ui/InvoiceBill.jsx`)

#### Props
```javascript
{
  isOpen: boolean,           // Controls modal visibility
  onClose: () => void,       // Callback to close modal
  saleData: {
    customerName: string,    // Customer name
    customerPhone: string,   // Customer phone (optional)
    items: [                 // Array of items in sale
      {
        size: string,         // E.g., "DL (4.5x9)", "C5"
        materialType: string, // E.g., "Kraft", "White"
        gsm: number,          // E.g., 80, 100
        quantity: number,     // Quantity sold
        rate: number          // Unit price
      }
    ]
  }
}
```

#### Functions
1. **generateInvoice()**: Calculates totals and tax amounts
2. **handlePrint()**: Opens print window with formatted invoice
3. **InvoiceContent**: React component that renders invoice layout
4. **getInvoiceHTML()**: Generates HTML for print window

### **numberToWords.js** (`frontend/src/utils/numberToWords.js`)

#### Functions

**`numberToWords(num)`**
- Converts integer to English words
- Input: `1234` → Output: `"One Thousand Two Hundred Thirty Four"`
- Supports up to billions

**`amountInWords(amount)`**
- Converts decimal amount to currency words format
- Input: `1234.50` → Output: `"One Thousand Two Hundred Thirty Four Rupees and Fifty Paise Only"`
- Always includes "Only" suffix for legal compliance

---

## Integration with Billing Page

### **Billing.jsx Updates**
The Billing page has been updated with invoice generation capability:

#### New State Variables
```javascript
const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);      // Modal visibility
const [selectedSale, setSelectedSale] = useState(null);        // Current sale data
const [sales, setSales] = useState([]);                        // Sales history
const [lastSale, setLastSale] = useState(null);                // Most recent sale
```

#### Workflow
1. **Add to Cart**: Search and add products to shopping cart
2. **Enter Customer Info**: Customer name and phone number
3. **Complete Sale**: Click "✓ Complete Sale" button
4. **Generate Invoice**: Click "Generate Invoice" button (appears after sale)
5. **Print or Download**: Click print button in invoice modal

#### Code Flow
```javascript
// User completes sale
handleCheckout() 
  ↓
// Sale created in database, items stored
setLastSale(saleWithCustomer) 
  ↓
// "Generate Invoice" button becomes available
  ↓
// User clicks button
setSelectedSale() → setIsInvoiceOpen(true)
  ↓
// InvoiceBill modal opens with sale data
// User clicks "Print Invoice"
handlePrint() 
  ↓
// New window opens with formatted invoice
// User prints to paper or PDF
```

---

## Usage Guide

### **For Staff - Creating an Invoice**

1. **Search Products**
   - Use search bar to find envelope type
   - Search by: Size, Material, or GSM
   - E.g., "DL" or "Kraft" or "80 GSM"

2. **Add to Cart**
   - Click product from search results
   - Quantity adjustable via +/- buttons
   - View real-time stock levels

3. **Enter Customer Details**
   - Customer Name (Required)
   - Phone Number (Optional)

4. **Review Bill Summary**
   - Shows item count and total quantity
   - Displays grand total in large green text

5. **Complete Sale**
   - Click "✓ Complete Sale" button
   - System updates inventory automatically
   - "Generate Invoice" button appears

6. **Generate Invoice**
   - Click "Generate Invoice" button
   - Professional bill opens in modal
   - Review all details

7. **Print Invoice**
   - Click "Print Invoice" button
   - Browser print dialog opens
   - Select printer or "Save as PDF"
   - Complete printing

---

## Invoice Display Details

### **Invoice Modal**
- **Size**: Full-screen with scrolling
- **Close Button**: Top-right X icon
- **Print Button**: Sticky button at top in green
- **Content**: Professional invoice layout

### **Invoice Content Structure**
```
[Company Header]
  Swamy Envelope CIN
  Address, Phone, Email
  GSTIN
  "CASH BILL"

[Bill Details]
  Bill Number: INV-XXXXXX
  Bill Date: DD/MM/YYYY
  GSTIN: 33AABCU9203R1Z0

[Bill To]
  Customer Name
  Phone Number

[Items Table]
  S.No | Description | Qty | Rate | Amount
  ✓ | DL (Kraft, 80GSM) | 100 | ₹2.50 | ₹250

[Calculations]
  Subtotal: ₹250.00
  CGST (9%): ₹22.50
  SGST (9%): ₹22.50
  Grand Total: ₹295.00

[Amount in Words]
  Two Hundred Ninety Five Rupees Only

[Footer]
  Received Goods Signature | Bank Details | Authorized Signature
```

---

## Tax Calculation Details

### **GST Structure**
- **Applicable Rate**: 18% (CGST 9% + SGST 9%)
- **Auto-Calculated**: Applied to subtotal automatically
- **Display**: Separate line items for CGST and SGST
- **Round Off**: No round-off applied (exact calculation)

### **Example Calculation**
```
Items:
  100 × DL @ ₹2.50 = ₹250.00
  50 × C5 @ ₹3.00 = ₹150.00
  
Subtotal = ₹400.00
CGST (9%) = ₹36.00
SGST (9%) = ₹36.00
Grand Total = ₹472.00

Amount in Words = "Four Hundred Seventy Two Rupees Only"
```

---

## API Integration

### **Service Calls**

**1. Fetch Sales**
```javascript
saleService.getAll({ limit: 100 })
// Returns: Array of sales with items and customer details
```

**2. Create Sale**
```javascript
saleService.create({
  customerId: string,
  items: Array<{envelopeId, quantity, price, ...}>,
  total: number
})
// Returns: Sale object with generated ID and timestamp
```

**3. Get Customer**
```javascript
customerService.getOrCreate({ name: string, phone: string })
// Returns: Customer object
```

**4. Record Stock Out**
```javascript
stockService.recordOut({ envelopeId: string, quantity: number })
// Returns: Stock transaction record
```

---

## Print Settings

### **Recommended Print Settings**
- **Paper Size**: A4 (210mm × 297mm)
- **Orientation**: Portrait
- **Margins**: Default browser margins
- **Scale**: 100% (do not scale)
- **Background Graphics**: Disabled (optional for ink saving)
- **Destination**: Print to Paper or Save as PDF

### **Print Output**
- **Pages**: Single A4 page
- **Spacing**: Professional with clear sections
- **Borders**: Clear table borders for items
- **Colors**: Preserved in color printing, readable if printed in B&W

---

## Features Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Auto-generated Bill Number | ✅ | INV-{timestamp} format |
| Bill Date | ✅ | Auto-populated |
| Company Branding | ✅ | Swamy Envelope header |
| Customer Details | ✅ | Name and phone |
| Item Details | ✅ | Size, material, GSM |
| Quantity & Rate | ✅ | From sale data |
| Amount Calculation | ✅ | Qty × Rate |
| Subtotal | ✅ | Sum of items |
| CGST (9%) | ✅ | Auto-calculated |
| SGST (9%) | ✅ | Auto-calculated |
| Grand Total | ✅ | Subtotal + taxes |
| Amount in Words | ✅ | Using numberToWords utility |
| Bank Details | ✅ | Kotak Mahindra Bank |
| Signatures | ✅ | Receipt, authorized |
| Print Functionality | ✅ | Browser print dialog |
| Print Styling | ✅ | A4 single page |
| Dark Mode Support | ✅ | Uses CSS variables |
| Mobile Responsive | ✅ | Modal adjusts to screen |

---

## Troubleshooting

### **Issue: Invoice doesn't appear**
- **Solution**: Ensure sale was completed successfully (look for success toast)
- **Check**: Browser console for errors (F12 → Console tab)

### **Issue: Amounts not calculating correctly**
- **Solution**: Verify item rates and quantities are numbers (not strings)
- **Check**: API response format in Network tab

### **Issue: Print shows wrong formatting**
- **Solution**: Check browser print preview before printing
- **Try**: Use "Save as PDF" first, then print from PDF

### **Issue: Customer info not appearing on invoice**
- **Solution**: Enter customer name and phone in billing form
- **Check**: Name field is not empty when completing sale

### **Issue: Dark mode colors not rendering correctly**
- **Solution**: Ensure CSS variables are loaded in main app
- **Check**: Other components also show dark mode correctly

---

## File Structure

```
frontend/src/
├── components/
│   └── ui/
│       ├── InvoiceBill.jsx          ← Invoice component & print logic
│       └── [other UI components]
├── pages/
│   └── Billing.jsx                  ← Integration & workflow
├── services/
│   └── api.js                       ← API calls (saleService, etc.)
└── utils/
    └── numberToWords.js             ← Amount to words conversion
```

---

## Future Enhancements

Potential features for future versions:
- [ ] Email invoice to customer
- [ ] Save invoice as PDF on server
- [ ] Multiple invoice format templates
- [ ] IGST support for inter-state sales
- [ ] Invoice sequence numbering per month
- [ ] Discount application
- [ ] Multiple payment modes
- [ ] Invoice history/archive
- [ ] Bulk invoice generation
- [ ] Email reminders for payment

---

## Support & Maintenance

### **For Modifications**
Edit these files to customize:
1. **Invoice Layout**: `InvoiceBill.jsx` (InvoiceContent component)
2. **Company Details**: Update header in `InvoiceContent` component
3. **Bank Details**: Update bank section in footer
4. **Tax Rate**: Change calculation in `generateInvoice()` function
5. **Amount Words**: Modify `numberToWords.js` for different languages

### **Testing Checklist**
- [ ] Create new sale with multiple items
- [ ] Generate invoice with correct calculations
- [ ] Print invoice to PDF
- [ ] Verify amounts in words format
- [ ] Check dark/light mode appearance
- [ ] Test on mobile (landscape)
- [ ] Verify stock is updated after sale

---

## Version Information
- **Version**: 1.0
- **Date**: 2024
- **System**: Swamy Envelope Inventory Management
- **React Version**: v18+
- **Styling**: Tailwind CSS + CSS Variables
- **Print Ready**: A4 Single Page Format

---

**Thank you for using the Swamy Envelope Invoice System! For questions or issues, contact the development team.**

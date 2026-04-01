# 🚀 INVOICE SYSTEM - QUICK START GUIDE

## ⚡ 5-Minute Setup & Test

### Step 1: Start Backend Server
```bash
cd backend
npm start
# Should show: "Connected to MongoDB"
```

### Step 2: Start Frontend Development Server
```bash
cd frontend
npm run dev
# Should show: Vite dev server URL (http://localhost:5173)
```

### Step 3: Open Billing Page
1. Open browser → http://localhost:5173/billing
2. You should see product selection on the left, cart on the right

### Step 4: Create a Test Bill

**Select Products:**
```
Step 1: Material Type → Select "Maplitho"
Step 2: GSM → Select "80"
Step 3: Size → Select "9x6"
Step 5: Quantity → Enter "10"
Click "Add to Cart"
```

**Customer Info:**
```
Name: John Doe
Phone: 9876543210
```

**Checkout:**
1. Click "Checkout" button
2. ✨ Invoice modal opens automatically

### Step 5: View & Print Invoice

**In Modal:**
1. Preview shows professional bill format
2. Click "Print/Download" button
3. Browser print dialog opens

**Print Options:**
- ✅ **Print to printer** → Regular printing
- ✅ **Save as PDF** → Create PDF file
- ✅ **Cancel** → Go back to preview

---

## 🧪 What to Verify

### Invoice Header ✓
- [ ] Company name: "SWAMY ENVELOPE"
- [ ] Address visible
- [ ] GSTIN number shown
- [ ] "CASH BILL" label visible
- [ ] Bill number auto-generated
- [ ] Date auto-filled

### Customer Section ✓
- [ ] "To:" label
- [ ] Customer name displayed
- [ ] Phone number shown
- [ ] Address section present

### Items Table ✓
- [ ] Column headers: S.No, Description, Qty, Rate, Amount
- [ ] Items listed correctly
- [ ] Description format: "Size | Material | GSM"
- [ ] Quantities correct
- [ ] Prices accurate
- [ ] Item totals calculated

### Tax Calculation ✓
- [ ] Subtotal = sum of items
- [ ] CGST (9%) calculated correctly
- [ ] SGST (9%) calculated correctly
- [ ] Grand Total = Subtotal + CGST + SGST
- [ ] Round-off shown (if applicable)

### Amount in Words ✓
- [ ] Converts to Indian Rupee format
- [ ] Ends with "Only"
- [ ] Example: "One Hundred and Three Rupees Only"

### Footer ✓
- [ ] Signature boxes visible
- [ ] Bank details shown (ICICI Bank)
- [ ] Thank you message present
- [ ] Professional closing

### Print Output ✓
- [ ] No UI elements (buttons, sidebar, etc.)
- [ ] Clean monospace font
- [ ] Proper borders and spacing
- [ ] Fits on single A4 page
- [ ] Professional appearance

---

## 📊 Test Data

**Sample Bill:**
```
Item 1: Maplitho | 80GSM | 9x6
  Quantity: 10
  Price: ₹5.00
  Total: ₹50.00

Item 2: Buff | 100GSM | 12x9
  Quantity: 5
  Price: ₹7.50
  Total: ₹37.50

Subtotal:        ₹87.50
CGST (9%):       ₹7.88
SGST (9%):       ₹7.88
─────────────────────
Grand Total:     ₹103.26
```

---

## 🔍 Troubleshooting

### Invoice not appearing after checkout
```
Solution:
1. Check browser console for errors (F12)
2. Verify sale was created (check backend logs)
3. Reload page and try again
```

### Print button not working
```
Solution:
1. Make sure window.print() isn't blocked
2. Try in a different browser (Chrome recommended)
3. Check for pop-up blockers
```

### Numbers not converting to words correctly
```
Solution:
1. Verify amount is a valid number
2. Check browser console for errors
3. Test with simpler amounts (e.g., 100, 1000)
```

### GST calculations wrong
```
Solution:
1. Verify CGST rate = 9%
2. Verify SGST rate = 9%
3. Check: (Subtotal × 0.09) = CGST
4. Check: (Subtotal × 0.09) = SGST
```

---

## 📹 Step-by-Step Screenshots

### 1. Billing Page
```
┌─────────────────────────────────────┬──────────────┐
│   PRODUCT SELECTOR                  │    CART      │
│ ┌─────────────────────────────────┐ │ Customer Info│
│ │ Step 1: Material Type ✓         │ │ Name: [____] │
│ │ Step 2: GSM ✓                   │ │ Phone:[____] │
│ │ Step 3: Size ✓                  │ ├──────────────┤
│ │ Step 5: Quantity ✓              │ │ Items: 1     │
│ │ [Add to Cart]                   │ │ Qty: 10      │
│ └─────────────────────────────────┘ │ Total: ₹50   │
│                                     │              │
│                                     │[Checkout]    │
└─────────────────────────────────────┴──────────────┘
```

### 2. Invoice Modal
```
┌──────────────────────────────────────────────┐
│ Invoice Preview        [Print]  [Close]      │
├──────────────────────────────────────────────┤
│                                              │
│ SWAMY ENVELOPE              CASH BILL        │
│ Address info...             Bill No: ABC123  │
│ Contact details...          Date: 31-03-2026│
│                                              │
│ To: John Doe                                 │
│ Phone: 9876543210                            │
│                                              │
│ ┌────┬──────────────┬────┬────────┬────────┐│
│ │S.No│Description   │Qty │Rate(₹) │Amt(₹) ││
│ ├────┼──────────────┼────┼────────┼────────┤│
│ │1   │9x6│Maplitho  │10  │5.00    │50.00  ││
│ │    │80GSM         │    │        │       ││
│ └────┴──────────────┴────┴────────┴────────┘│
│ Subtotal: ₹50.00                            │
│ CGST (9%): ₹4.50                            │
│ SGST (9%): ₹4.50                            │
│ Grand Total: ₹59.00                         │
│                                              │
│ In Words: Fifty-Nine Rupees Only             │
│                                              │
│ [Signature areas and bank details]           │
└──────────────────────────────────────────────┘
```

### 3. PDF Output
```
Professional bill in monospace font
Suitable for printing or saving as PDF
```

---

## ✅ Test Checklist

```
Frontend Tests:
[ ] Billing page loads
[ ] Product selection works
[ ] Add to cart successful
[ ] Cart displays items correctly
[ ] Customer info fields work
[ ] Checkout button becomes enabled
[ ] Invoice modal opens after checkout

Invoice Tests:
[ ] Header displays company info
[ ] Bill number generated
[ ] Date auto-filled
[ ] Customer info shown
[ ] Items table has correct data
[ ] Subtotal correct
[ ] CGST calculation correct
[ ] SGST calculation correct
[ ] Grand total correct
[ ] Amount in words displays
[ ] Footer visible with signatures

Print Tests:
[ ] Print button works
[ ] Print preview opens
[ ] Can save as PDF
[ ] PDF looks professional
[ ] No UI elements in print
[ ] Page fits on A4
[ ] Close button works
```

---

## 🎓 Common Scenarios

### Scenario 1: Single Item Bill
```
1 × Maplitho 80GSM 9x6 @ ₹5.00
Customer: ABC Company

Result:
Subtotal: ₹5.00
CGST: ₹0.45
SGST: ₹0.45
Total: ₹5.90
In Words: Five Rupees and Ninety Paise Only
```

### Scenario 2: Multiple Items Bill
```
2 × Maplitho 80GSM 9x6 @ ₹5.00 = ₹10.00
3 × Buff 100GSM 12x9 @ ₹7.50 = ₹22.50
Customer: XYZ Enterprises

Result:
Subtotal: ₹32.50
CGST: ₹2.93
SGST: ₹2.93
Total: ₹38.36
In Words: Thirty-Eight Rupees and Thirty-Six Paise Only
```

### Scenario 3: High Value Bill
```
100 × Maplitho 80GSM 9x6 @ ₹5.00 = ₹500.00
Customer: Large Company

Result:
Subtotal: ₹500.00
CGST: ₹45.00
SGST: ₹45.00
Total: ₹590.00
In Words: Five Hundred and Ninety Rupees Only
```

---

## 💡 Pro Tips

1. **Test with different amounts** to verify calculations
2. **Try printing to PDF** to check output format
3. **Use Chrome** for best print results
4. **Check console** (F12) for any error messages
5. **Compare PDF** with expected invoice format
6. **Verify amounts** before checkout
7. **Save PDF copies** for records

---

## 🔗 Related Files

- `frontend/src/components/ui/Invoice.jsx` - Invoice component
- `frontend/src/utils/gstCalculations.js` - GST logic
- `frontend/src/utils/numberToWords.js` - Word conversion
- `frontend/src/styles/print.css` - Print styles
- `frontend/src/pages/BillingSimplified.jsx` - Billing page
- `frontend/src/main.jsx` - App entry point

---

## 📞 Support

**Issue**: Invoice not showing
→ Check browser console for errors

**Issue**: Print button not working
→ Disable pop-up blockers, try different browser

**Issue**: Calculations wrong
→ Verify amounts, check calculation formulas

**Issue**: PDF looks bad
→ Use Chrome, check print settings

---

## ✨ Next Steps

After verifying the system:

1. ✅ Test with real products
2. ✅ Create sample bills
3. ✅ Print test documents
4. ✅ Save PDFs for records
5. ✅ Customize company details if needed
6. ✅ Go live!

---

**Status**: ✅ READY TO TEST
**Last Updated**: 2026-03-31
**Version**: 1.0.0

# QUICK TESTING GUIDE - Sales & Revenue System

## ⚡ 5-MINUTE TEST

### Step 1: Create Test Sale
1. Open http://localhost:5176/billing
2. Click on "Material" dropdown → Select "Maplitho"
3. Click on "GSM" dropdown → Select "80"
4. Click on "Size" dropdown → Select any size
5. Enter Quantity: **100**
6. Click "Add to Cart"
7. Enter Customer Name: **Test Customer**
8. Leave Phone blank
9. Click "Complete Sale"

### Step 2: Check Backend Logs
Open the backend terminal and look for:
```
📥 Received sale request
✅ Item validation passed
✅ Stock validation passed
💾 Creating sale record
✅ Sale record created
📉 Updating inventory
✅ Stock updated
🎉 Sale creation successful - Revenue: [amount]
```

### Step 3: Check Frontend Console (F12)
Should see:
```
🛒 Starting checkout
📝 Getting or creating customer
✅ Customer created/retrieved
📦 Sale items prepared
💾 Creating sale
✅ Sale created
🎉 Checkout completed successfully
```

### Step 4: Verify Dashboard
1. Go to http://localhost:5176 (Dashboard)
2. Look at "Today's Sales" card → Should show **1**
3. Look at "Total Revenue" card → Should show ₹ amount
4. Click "Refresh" button
5. Numbers should persist

### Step 5: Verify Stock Decreased
1. Go to http://localhost:5176/inventory
2. Find the product you sold
3. Quantity should be **LESS** than before sale

### Step 6: Check Reports
1. Go to http://localhost:5176/reports
2. Should show today's date range
3. "Total Sales" should be **1**
4. "Total Revenue" should be ₹ amount

---

## 📋 DETAILED TEST SCENARIOS

### Scenario 1: Price Validation ✅
**Goal**: Ensure $0 price is rejected

1. Go to Inventory page
2. Find a product
3. Click "Update Stock"
4. Leave Price as **0**
5. Set Quantity to **10**
6. Click "Save"
7. Go to Billing
8. Try to add this product to cart
9. **Expected**: Error on checkout "Price must be greater than 0"

### Scenario 2: Stock Deduction ✅
**Goal**: Verify stock decreases after sale

1. Note product quantity: **500**
2. Go to Billing, sell **100** units
3. Go to Inventory
4. Product quantity should now be: **400** ✅

### Scenario 3: Multiple Items Sale ✅
**Goal**: Verify multi-item sale calculation

1. Add Item 1: 50 units @ ₹50 = ₹2,500
2. Add Item 2: 100 units @ ₹25 = ₹2,500
3. Total should show: ₹5,000 ✅
4. Complete sale
5. Dashboard shows Revenue: ₹5,000 ✅

### Scenario 4: Items Sold Count ✅
**Goal**: Verify correct items count (not line items)

1. Create sale with 2 products:
   - Item 1: 100 units
   - Item 2: 150 units
   - Total: 250 units
2. Go to Dashboard/Reports
3. "Items Sold" should show **250** (not 2) ✅

### Scenario 5: Daily Summary ✅
**Goal**: Verify daily aggregation works

1. Refresh Dashboard
2. DailySummary should show:
   - Today's Revenue: ₹ amount
   - Transactions: count of sales
   - Items Sold: sum of quantities

---

## 🐛 DEBUGGING CHECKLIST

### If Revenue Shows 0:
- [ ] Check backend console for errors
- [ ] Verify sale was created (check backend logs)
- [ ] Check product has price > 0
- [ ] Verify sale has `grandTotal` field (not `total`)

### If Stock Didn't Decrease:
- [ ] Look for "Stock updated" log in backend
- [ ] Check quantity field in database
- [ ] Verify sale quantity was > 0
- [ ] Check for stock transaction record

### If Dashboard/Reports Blank:
- [ ] Check browser console (F12) for JS errors
- [ ] Verify date range includes today
- [ ] Try refreshing page
- [ ] Check network tab for failed API calls

### If Checkout Fails:
- [ ] Check backend console for error details
- [ ] Verify product has price > 0
- [ ] Verify product has quantity > 0
- [ ] Check customer name is not empty

---

## 📊 EXPECTED RESULTS

After sale creation:

| Item | Before | After | Check |
|------|--------|-------|-------|
| Product Stock | 500 | 400 | -100 ✅ |
| Dashboard Revenue | ₹0 | ₹5,000 | Non-zero ✅ |
| Sale Count | 0 | 1 | +1 ✅ |
| Items Sold | 0 | 100 | +100 ✅ |
| Transactions | 0 | 1 | +1 ✅ |
| Reports Daily | $0 | ₹5,000 | Matches ✅ |

---

## 🔍 DATABASE VERIFICATION

### Using MongoDB Compass:

1. **Check Sales Collection**
   ```
   {
     _id: ObjectId(...),
     customerId: ObjectId(...),
     items: [
       {
         envelopeId: ObjectId(...),
         quantity: 100,
         price: 50,
         total: 5000      ← This must exist & be > 0
       }
     ],
     grandTotal: 5000     ← This must exist & be > 0
   }
   ```

2. **Check Stock Transactions**
   ```
   {
     _id: ObjectId(...),
     envelopeId: ObjectId(...),
     type: "OUT",
     quantity: 100,
     saleId: ObjectId(...)    ← Links to sale
   }
   ```

3. **Check Envelopes**
   ```
   {
     _id: ObjectId(...),
     size: "10x4",
     materialType: "Maplitho",
     quantity: 400           ← Should be less than before
   }
   ```

---

## ✅ SUCCESS CRITERIA

Sale is working correctly when:

- [x] Backend shows 🎉 success message
- [x] Dashboard revenue shows > 0
- [x] Stock quantity decreased
- [x] Reports show revenue for today
- [x] Multiple sales show cumulative revenue
- [x] Total Revenue = sum of all grandTotals
- [x] Items Sold = sum of all quantities
- [x] Stock transactions created in database

---

## 🆘 QUICK FIXES

### Problem: "Price must be greater than 0"
**Solution**: 
1. Go to Inventory
2. Click product [Update Stock]
3. Set Price > 0
4. Click Save

### Problem: Revenue shows as 0
**Solution**:
1. Go to Backend console
2. Look for error messages
3. Verify product price > 0
4. Try creating new sale

### Problem: Stock didn't decrease
**Solution**:
1. Go to Inventory → Refresh
2. Check backend logs
3. Verify sale was created
4. Check database directly

### Problem: Reports page blank
**Solution**:
1. Try Dashboard first (verify data loads)
2. Check browser console for errors
3. Try different date range
4. Refresh page (Ctrl+R)

---

## 📞 SUPPORT INFO

**Backend Logs Location**: Terminal running `npm start`
**Frontend Logs Location**: Browser F12 → Console tab
**Database Location**: MongoDB (Local or Atlas)

If issues persist:
1. Share backend console output
2. Share browser console output
3. Share database record for sale
4. Share product details (price, quantity)

---

**Ready to test! Start with Step 1 above ⬆️**

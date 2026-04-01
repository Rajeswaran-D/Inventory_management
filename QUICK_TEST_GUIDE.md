# Quick Testing Guide - Inventory & Billing System

## System Status: ✅ READY FOR TESTING

**Servers Running:**
- ✅ Frontend: http://localhost:5173
- ✅ Backend: http://localhost:5000
- ✅ MongoDB: Connected

---

## 30-Second Quick Test

1. Open http://localhost:5173/billing
2. **Select Material**: Maplitho → **Select GSM**: 80 → **Select Size**: 6.25x4.25
3. **Enter Quantity**: 5 → Click **Add to Cart**
4. **Enter Name**: "Test User" → **Enter Phone**: "9999999999"
5. Click **Checkout**

### Expected Results:
```
✅ Bill modal appears WITHOUT errors
✅ Customer name shows: "Test User" (NOT "N/A")
✅ Phone shows: "9999999999"
✅ Item shows: "Maplitho 80GSM 6.25x4.25"
✅ Qty shows: 5
✅ Price shows: ₹150 (NOT ₹0)
✅ Total shows: ₹750
✅ Backend log shows: "✅ Bill generated successfully"
✅ Backend log shows: "✅ Updated Maplitho: X → (X-5)"
```

---

## Complete Test Cases

### TEST 1: Single Item Checkout

**Setup:**
```
Material: Maplitho
GSM: 80
Size: 6.25x4.25
Quantity: 5
Customer Name: John Doe
Phone: 9876543210
```

**Execute Checkout**

**Verify in Invoice Modal:**
- ✅ Bill Number shows
- ✅ Date shows  
- ✅ Customer shows: "John Doe"
- ✅ Phone shows: "9876543210"
- ✅ Item line shows details
- ✅ Price shows ₹150
- ✅ Total shows ₹750

**Verify in Backend Log:**
```
📥 Received sale (bill) request: {
  customerName: "John Doe",
  itemsCount: 1,
  grandTotal: 750
}

✅ Item 1: Maplitho 80GSM 6.25x4.25 × 5 @ ₹150 = ₹750

👤 Creating/finding customer...
✅ New customer created: [ObjectId]

📄 Creating bill record...

🎉 Bill generated successfully!
  Bill ID: [ID]
  Customer Name: John Doe
  Customer Phone: 9876543210
  Items: 1
  Total: ₹ 750

📦 Updating inventory for sold items...
  ✅ Updated Maplitho: 100 → 95 (sold 5)
  📝 Stock transaction recorded: OUT 5 units
```

---

### TEST 2: Multiple Items

**Setup:**
```
Item 1: Maplitho 80GSM 6.25x4.25 × 3 @ ₹150 = ₹450
Item 2: Buff 80GSM 9x6 × 2 @ ₹200 = ₹400
Total: ₹850

Customer: Multiple Items Test
Phone: 9999998888
```

**Execute Checkout**

**Verify in Invoice Modal:**
- ✅ Two items listed
- ✅ Maplitho shows 3 × ₹150
- ✅ Buff shows 2 × ₹200
- ✅ Total shows ₹850 (NOT ₹750)
- ✅ Customer name shows correctly

**Verify in Backend Log:**
- ✅ Both items listed
- ✅ Both inventory records updated
- ✅ Two stock transactions created

**Expected Database State:**
```
Before:  Maplitho qty=100,  Buff qty=50
After:   Maplitho qty=97,   Buff qty=48
Change:  Maplitho -3,       Buff -2
```

---

### TEST 3: Repeat Customer

**Setup:**
```
Checkout with Customer Name: "John Doe" (from Test 1)
Phone: 9876543210
Product: Kraft 50GSM 9x4 × 2
```

**Execute Checkout**

**Verify Backend Log:**
```
👤 Creating/finding customer...
✅ Existing customer found: [Same ObjectId as Test 1]
```

**Verify in Database:**
- ✅ Same customer has 2 sales
- ✅ Both use same customerId
- ✅ Both show same customerName

---

### TEST 4: Error Cases

#### 4a: Empty Customer Name
**Setup**: Try to checkout without entering customer name

**Expected**: 
- ❌ Toast error: "Please enter customer name"
- ❌ Checkout button doesn't proceed
- ❌ No API call made

#### 4b: Empty Cart
**Setup**: Try to checkout with empty cart

**Expected**:
- ❌ Toast error: "Cart is empty"
- ❌ Checkout button doesn't proceed

#### 4c: Out of Stock
**Setup**: Try to add more than available stock

Assuming Cloth Cover has 10 in stock:
```
Material: Cloth Cover
Size: A4
Quantity: 15 (more than available 10)
Click "Add to Cart"
```

**Expected**:
- ❌ Toast error: "Insufficient stock. Available: 10, Requested: 15"
- ❌ Item NOT added to cart

#### 4d: Zero Price
**Setup**: Product with ₹0 price

**Expected**:
- ❌ Toast error: "Price not set for [Product]. Please update pricing in inventory."
- ❌ Item NOT added to cart

---

## Browser DevTools Verification

### Open DevTools Console (F12)

#### Frontend Logs (Should See):
```javascript
🛍️ Product Selection Debug: {
  material: "maplitho",
  productName: "Maplitho",
  gsm: "80",
  size: "6.25x4.25",
  canAdd: true
}

✅ Adding to cart: {cartItem object}

📦 Processing checkout for: John Doe

📤 Sale data: {
  customerName: "John Doe",
  customerPhone: "9876543210",
  items: [...],
  grandTotal: 750
}

✅ Bill generated: [Bill ID]
📊 Inventory has been updated for all items
```

#### API Tab (Should See):
```
POST http://localhost:5000/api/sales
Status: 201 Created
Response: 
{
  "message": "Bill generated successfully",
  "data": {
    "_id": "...",
    "customerName": "John Doe",
    "customerPhone": "9876543210",
    "items": [...],
    "grandTotal": 750
  }
}
```

---

## Server Terminal Verification

### Backend Console Should Show:

**✅ On Startup:**
```
[nodemon] starting `node server.js`
Server is running on port 5000
Connected to MongoDB
```

**✅ On Successful Checkout:**
```
📥 Received sale (bill) request: {...}
✅ Item 1: Maplitho... × 5 @ ₹150 = ₹750
👤 Creating/finding customer...
✅ Existing customer found: [ID]
📄 Creating bill record...
🎉 Bill generated successfully!
  Bill ID: [ID]
  Customer Name: John Doe
  Customer Phone: 9876543210
  Items: 1
  Total: ₹ 750
📦 Updating inventory for sold items...
  ✅ Updated Maplitho: 100 → 95 (sold 5)
  📝 Stock transaction recorded: OUT 5 units
```

**❌ On Error:**
```
❌ Error creating sale: [Error message]
Error: Sale validation failed: items.0.quantity: Path required
```

---

## Database Verification

### Check with MongoDB CLI or Compass

#### Verify Sale Created:
```javascript
db.sales.findOne({})
// Result should show:
{
  "_id": ObjectId("..."),
  "customerName": "John Doe",           ✅ (NOT null)
  "customerPhone": "9876543210",        ✅ (NOT null)
  "customerId": ObjectId("..."),        ✅ (Reference exists)
  "items": [
    {
      "productId": "maplitho",          ✅ (String, not ObjectId)
      "price": 150,                     ✅ (NOT 0)
      "quantity": 5,
      "itemTotal": 750
    }
  ],
  "grandTotal": 750,
  "date": ISODate("2026-03-31T...")
}
```

#### Verify Inventory Updated:
```javascript
db.inventory.findOne({productId: "maplitho"})
// BEFORE Checkout: quantity: 100
// AFTER Checkout: quantity: 95 (reduced by 5) ✅
```

#### Verify Stock Transaction:
```javascript
db.stock_transactions.findOne({type: "OUT"})
// Result should show:
{
  "_id": ObjectId("..."),
  "envelopeId": "maplitho",
  "type": "OUT",
  "quantity": 5,
  "reference": ObjectId("..."),         ✅ (Links to sale._id)
  "reason": "Sale Bill #[ID]"
}
```

---

## Comprehensive Checkoff List

### API Response Tests
- [ ] POST /api/sales returns 201
- [ ] Response includes _id
- [ ] Response includes customerName
- [ ] Response includes customerPhone
- [ ] Response includes items array
- [ ] Response includes grandTotal
- [ ] Response includes date

### Frontend Display Tests
- [ ] Invoice modal opens after checkout
- [ ] Bill number displays
- [ ] Bill date displays
- [ ] Customer name displays (NOT "N/A")
- [ ] Customer phone displays
- [ ] Items table shows all products
- [ ] Each item shows productName
- [ ] Each item shows quantity
- [ ] Each item shows price
- [ ] Each item shows itemTotal
- [ ] Grand total displays

### Backend Processing Tests
- [ ] Validation rejects empty customerName
- [ ] Validation rejects empty items array
- [ ] Validation rejects negative grandTotal
- [ ] Customer found if exists
- [ ] Customer created if new
- [ ] Sale saved to database
- [ ] Inventory quantity reduced
- [ ] Stock transaction created
- [ ] Logs show all steps

### Database State Tests
- [ ] Sale collection has documents
- [ ] Sale has customerName field
- [ ] Sale has customerPhone field
- [ ] Inventory quantities decrease
- [ ] StockTransaction records created
- [ ] Reference field links to sale._id

---

## Common Issues & Solutions

| Issue | Check | Solution |
|-------|-------|----------|
| **Invoice shows "N/A" for name** | sale.customerName in response | Schema updated, server restarted |
| **No inventory update** | Backend logs for "Updated..." | Verify Inventory.save() called |
| **Checkout fails with error** | Browser console & backend log | Check error message, fix validation |
| **Price shows ₹0** | Inventory record has price | Update inventory with pricing |
| **Empty dropdowns** | productConfig.js loading | Check import statement |
| **Backend won't start** | Check MongoDB connection | Ensure MongoDB running |
| **Frontend shows 404** | Port 5173 accessible | Check npm run dev output |
| **API returns 500 error** | Backend terminal logs | Read error message, fix issue |

---

## Step-by-Step Manual Test

### 1. Prepare (2 minutes)
```
□ Open http://localhost:5173/billing in browser
□ Open DevTools (F12) → Console tab
□ Keep backend terminal visible
□ Have MongoDB Compass open (optional)
```

### 2. Product Selection (1 minute)
```
□ Click "Material Type" dropdown
□ Select "Maplitho"
□ Click "GSM" dropdown
□ Select "80"
□ Click "Size" dropdown
□ Select "6.25x4.25"
□ Enter Quantity: "5"
```

**Expected**: Dropdowns populate, no errors in console

### 3. Add to Cart (1 minute)
```
□ Click "Add to Cart" button
□ Check toast message appears: "✅ Added..."
□ Verify cart shows 1 item
□ Verify cart shows ₹750 total
```

**Expected**: Item added, no errors, price shows correctly

### 4. Customer Info (1 minute)
```
□ Scroll to customer form
□ Enter Name: "Test Customer"
□ Enter Phone: "9999999999"
□ Verify form shows both fields
```

**Expected**: Both fields filled, no validation errors

### 5. Checkout (1 minute)
```
□ Click "Checkout" button
□ Watch browser console for requests
□ Wait for invoice modal to appear
```

**Expected**: Modal opens, no errors, customer name visible

### 6. Invoice Verification (2 minutes)
```
□ Check Bill Number shows
□ Check Date shows
□ Check Customer: "Test Customer" (NOT "N/A")
□ Check Phone: "9999999999"
□ Check Items table:
  ├─ Product name shows
  ├─ Quantity shows: 5
  ├─ Price shows: ₹150
  └─ Total shows: ₹750
□ Check Grand Total: ₹750
```

**Expected**: All details correct, no N/A values

### 7. Backend Verification (2 minutes)
```
□ Check backend terminal log:
  ├─ "Bill generated successfully" message
  ├─ "Customer Name: Test Customer"
  ├─ "✅ Updated Maplitho: X → Y"
  └─ "Stock transaction recorded"
□ Verify no error messages
```

**Expected**: All success logs shown

### 8. Database Verification (3 minutes - Optional)
```
□ Open MongoDB Compass
□ Navigate to sales collection
□ Find latest sale document
□ Verify:
  ├─ customerName: "Test Customer"
  ├─ customerPhone: "9999999999"
  ├─ items: full array with prices
  └─ grandTotal: 750

□ Navigate to inventory collection
□ Find Maplitho record
□ Verify quantity decreased by 5
```

**Expected**: Database shows correct values

### 9. Repeat Test (5 minutes)
```
□ Create another checkout with:
  ├─ Buff 80GSM 9x6 × 2
  ├─ Different customer: "Another User"
  └─ Different phone: "8888888888"
□ Verify invoice shows new customer
□ Verify backend logs show inventory update
□ Verify database has 2 sales
```

**Expected**: Same process works again, no issues

---

## Success Criteria

### ✅ System is WORKING if:
1. Checkout completes without errors
2. Customer name displays in invoice (NOT "N/A")
3. Customer phone displays correctly
4. All item details show
5. Prices display correctly (NOT ₹0)
6. Backend logs show inventory updates
7. Database quantities decrease
8. Test can run multiple times without errors

### ❌ System has ISSUES if:
1. Errors appear in console
2. Customer name shows "N/A"
3. Prices show ₹0
4. Inventory doesn't update
5. Backend logs show errors
6. Database doesn't reflect changes

---

## Quick Reference Commands

### Reset Servers
```bash
# Kill all node processes
taskkill /IM node.exe /F

# Restart servers
npm run dev
```

### Check MongoDB
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/swamy_envelope

# Check collections
show collections

# View latest sale
db.sales.findOne({}, {sort: {_id: -1}})
```

### View Logs
```bash
# Frontend logs are in: Browser DevTools Console (F12)
# Backend logs are in: Terminal where npm run dev is running
```

---

## When All Tests Pass

Once all tests pass successfully:
1. ✅ Customer name fixed
2. ✅ Inventory stock updates
3. ✅ Data flow complete
4. ✅ Invoice displays correctly
5. ✅ System ready for production

**System Status: FULLY OPERATIONAL** 🎉


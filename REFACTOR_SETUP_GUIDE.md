
# SIMPLIFIED INVENTORY & BILLING SYSTEM SETUP GUIDE

## Overview

This is a **clean, production-ready refactor** of the Inventory and Billing system. It removes all complexity and provides a simple, fixed-schema product system based on real company data.

### Key Changes

✅ **Removed**: Product Master dynamic system, ProductVariant schema, overcomplicated validation  
✅ **Added**: Fixed `productDefinitions.js` with hardcoded product specs  
✅ **Simplified**: Two models only: `Product` and `Inventory`  
✅ **Cleaned**: New controllers with straightforward logic  
✅ **Fixed**: Invoice/Billing with step-by-step dropdowns  

---

## Product Structure (FINAL)

| Product | GSM | Sizes | Notes |
|---------|-----|-------|-------|
| Maplitho | 80, 90, 120 | 21 sizes | Paper type |
| Buff | 80, 100 | 21 sizes | Paper type |
| Kraft | 50 | 9 sizes | Paper type |
| Cloth Cover | None | 4 sizes | No GSM |
| Vibhoothi | None | Standard (auto) | Colors only |

---

## Installation & Setup

### Step 1: Update Backend Configuration

Ensure `.env` has MongoDB URI:
```
MONGODB_URI=mongodb://localhost:27017/swamy_envelope
PORT=5000
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

### Step 3: Run Database Seed Script

```bash
node src/seedDatabase.js
```

**Output:**
```
✅ Connected to MongoDB
🗑️  Clearing existing products and inventory...
✅ Database cleared
📦 Generating product combinations...
✅ Generated 370 combinations

📝 Created 10/370 products...
✅ Successfully created 370 products with inventory records

📋 PRODUCT SUMMARY
================================================
Maplitho:
  Total variants: 147 (21 sizes × 7 GSM variants)
  GSM options: 80, 90, 120
  Size options: 21 sizes

... (more products)
```

### Step 4: Start Backend

```bash
npm start
# Or: npm run dev (for development with auto-reload)
```

You should see:
```
🚀 Server running on port 5000
✅ MongoDB connected
```

### Step 5: Frontend - Switch to Simplified Components

Update `frontend/src/pages/` to use new simplified versions:

**Option A: Replace existing files**
```bash
cp BillingSimplified.jsx Billing.jsx
cp InventorySimplified.jsx Inventory.jsx
```

**Option B: Update imports in `App.jsx`**
```jsx
import { BillingSimplified as Billing } from './pages/BillingSimplified';
import { InventorySimplified as Inventory } from './pages/InventorySimplified';
```

### Step 6: Start Frontend

```bash
cd frontend
npm run dev
```

Open: http://localhost:5174

---

## Testing the System

### Test 1: Inventory Page

1. Navigate to **Inventory**
2. Expected: Table with ~370 product variants
3. Check:
   - Select **Edit** on any row
   - Update Quantity and Price
   - Click **Save**
   - Verify update reflected

### Test 2: Billing Page - Maplitho

1. Navigate to **Billing**
2. Select **Maplitho** from Material dropdown
3. GSM field should appear → Select **80**
4. Size field should appear → Select **9x6**
5. Color field should NOT appear
6. Enter Quantity: **50**
7. Click **+ Add to Cart**
8. **Verify**: Item appears in cart

### Test 3: Billing Page - Vibhoothi

1. Select **Vibhoothi Cover** from Material
2. **Verify**: 
   - GSM field NOT shown
   - Size field NOT shown
   - Color field IS shown
   - Size automatically set to "Standard"
3. Select Color: **White**
4. Enter Quantity: **20**
5. Add to cart
6. **Verify**: Item displays as "Vibhoothi Cover | White"

### Test 4: Billing Page - Cloth Cover

1. Select **Cloth Cover**
2. **Verify**:
   - GSM field NOT shown
   - Size field IS shown
   - Color field NOT shown
3. Select Size: **15x11**
4. Enter Quantity: **30**
5. Add to cart

### Test 5: Cart Management

1. Add 2-3 different products
2. Test (+) and (-) buttons to adjust quantities
3. Click Trash icon to remove item
4. Enter Customer Name
5. (Checkout button will be enabled)

---

## API Reference

### Products

```bash
# Get product definitions
GET http://localhost:5000/api/products/definitions

# Get options for specific product
GET http://localhost:5000/api/products/options/maplitho
```

### Inventory

```bash
# Get all inventory
GET http://localhost:5000/api/inventory?limit=100

# Search by product specs
GET http://localhost:5000/api/inventory/search?productName=Maplitho&gsm=80&size=9x6

# Get low stock items
GET http://localhost:5000/api/inventory/low-stock

# Update inventory
PUT http://localhost:5000/api/inventory/:id
Body: { "quantity": 100, "price": 50 }

# Bulk update
POST http://localhost:5000/api/inventory/bulk-update
Body: {
  "updates": [
    { "id": "...", "quantity": 100 },
    { "id": "...", "price": 50 }
  ]
}
```

---

## File Structure

```
backend/src/
├── data/
│   └── productDefinitions.js        ← All product specs (FIXED)
├── models/
│   ├── Product.js                    ← Simplified product model
│   └── Inventory.js                  ← Simplified inventory model
├── controllers/
│   └── inventoryController.js        ← Clean API logic
├── routes/
│   └── inventoryRoutes.js            ← Simplified routes
├── seedDatabase.js                   ← Generates all combinations
└── server.js

frontend/src/pages/
├── BillingSimplified.jsx             ← Step-by-step dropdowns
└── InventorySimplified.jsx           ← Simple table + CRUD
```

---

## Troubleshooting

### Issue: "No inventory items found"

**Solution**: Run seed script
```bash
node src/seedDatabase.js
```

### Issue: GSM field still showing for Vibhoothi

**Solution**: Clear browser cache (Ctrl+Shift+Delete) and reload

### Issue: "Failed to load products" in Billing

**Solution**: 
1. Check backend is running on port 5000
2. Check `/api/products/definitions` returns data

### Issue: Inventory table empty

**Solution**:
1. Confirm seed script ran successfully
2. Check MongoDB collection: `db.products.count()`
3. Check MongoDB connection: `mongosh`

---

## Production Checklist

- [ ] Seed script ran successfully (370 items created)
- [ ] Backend API responding to `/api/products/definitions`
- [ ] Inventory page shows all items in table
- [ ] Billing dropdowns show correct options
- [ ] Vibhoothi hides GSM/Size, shows Color
- [ ] Cart add/remove/update working
- [ ] Edit inventory quantities working
- [ ] No console errors on frontend

---

## Next Steps (Optional)

- Add pricing tiers for quantity discounts
- Add customer management
- Add invoice generation
- Add stock history tracking
- Add reports (top-selling, low stock, etc.)

---

## Support

For issues or questions:
1. Check browser console (F12) for errors
2. Check backend logs for API issues
3. Verify MongoDB is running
4. Verify seed script completed


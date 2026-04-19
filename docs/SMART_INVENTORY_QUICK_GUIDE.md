# 🚀 Smart Inventory Management - Quick Guide

## 📍 Where to Find the New Features

1. **Open Application** → http://localhost:5173
2. **Navigate to** → Sidebar → "Inventory Management"
3. **You'll see:**
   - 🟢 "Add New Product" button (NEW - top left)
   - 📊 Inventory table with smart buttons

---

## 1️⃣ Adding a New Product Variant

### Steps:
1. Click **"Add New Product"** button (green button at top)
2. Modal opens with two sections:
   - **Product Selection Grid** - Choose product master
   - **Form Fields** - Fill conditional fields

### Product Selection:
```
[Maplitho]  [Buff]  [Kraft]
[Cloth]  [Vibhoothi]  [Handmade]
```
- Click any product button (turns blue when selected)
- Form appears below showing only relevant fields

### Fill the Form:
```
📦 Select Product Master: Maplitho ✓
GSM: [80 ▼] or [Enter 80]
Size: [9x6 ▼]
Color: [White ▼] (optional)
💰 Initial Price: [50.00]
```

### Conditional Logic:
- **Maplitho** → GSM required, Size required, Color optional
- **Cloth Cover** → No GSM, Size required, Color required
- **Vibhoothi** → GSM required, Size fixed to "Standard", No color
- **Handmade** → All optional

### Submit:
- Click **"Create Product Variant"** button
- Wait for success message ✅
- Product appears in inventory table instantly

### What Happens Behind the Scenes:
```
1. Backend checks for existing variant (prevent duplicates)
2. Creates ProductVariant with auto-generated SKU
3. Auto-creates Inventory entry (quantity: 0, price: 50)
4. Returns success with IDs
5. Frontend refreshes table
```

---

## 2️⃣ Adding Stock (Increase Quantity)

### Quick Method:
1. Find product in table (e.g., Maplitho | 80 GSM | 9x6)
2. Click **🟢 [ + ]** button (green plus icon)
3. Modal opens (green header: "Add Stock")
4. Current stock shows: **50**
5. Quick buttons appear: **[+5] [+10] [+25]**
6. **Option A:** Click "+10" → Quantity auto-fills: 10
7. **Option B:** Type custom number: 25
8. Optional: Add reason: "Restock from warehouse"
9. Click **"Add Stock"** button
10. Toast shows: ✅ "Stock added: +10 units"
11. Table updates immediately: Quantity now 60

### Form Fields:
```
Current Stock: 50

[ Add Stock ]  [ Reduce Stock ]  ← Click to switch mode

Quick Add:
[+5]  [+10]  [+25]

Quantity: [10        ]  ← Shows filled number
Reason: [Restock    ]  ← Optional

[Cancel]  [Add Stock]  ← Submit
```

---

## 3️⃣ Reducing Stock (Decrease Quantity)

### Quick Method:
1. Find product in table
2. Click **🔴 [ - ]** button (red minus icon)
3. Modal opens (red header: "Reduce Stock")
4. Current stock shows: **60**
5. Quick buttons appear: **[-5]** (only if stock ≥ N)
6. **Option A:** Click "-5" → Quantity: 5
7. **Option B:** Type custom: 10
8. Optional: Add reason: "Sale to customer"
9. Click **"Reduce Stock"** button
10. Validation checks: 60 ≥ 10? ✅ Yes
11. Toast shows: ✅ "Stock reduced: -10 units"
12. Table updates: Quantity now 50

### Smart Validation:
```
Current Stock: 60

Quick Reduce:
[-5]  [-10]  ← Shown because stock ≥ 10
            ← -25 not shown because 60 ≥ 25

If you click -5:   60 - 5 = 55 ✅
If you click -100: Error! "Not enough stock. Available: 60"
```

---

## 4️⃣ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search Product | Type in search bar |
| Refresh | Click Refresh button |
| Auto-Refresh toggle | Check "Auto-Refresh (30s)" |

---

## 5️⃣ Stock Status Indicators

```
Good Stock:   [Good (45/50)]      → Green background
Medium Stock: [Medium (60/50)]    → Orange background
Low Stock:    [Low (20/50)]       → Red background
```

---

## 6️⃣ Error Handling

### Common Errors & Solutions:

#### Error: "This product variant already exists"
- **Cause:** Variant with same [Product + Size + GSM + Color]
- **Solution:** Check inventory or modify variant specs

#### Error: "Not enough stock. Available: 50, Requested: 100"
- **Cause:** Trying to reduce more than available
- **Solution:** Use correct quantity (≤50)

#### Error: "Product not found"
- **Cause:** Product master deleted or invalid
- **Solution:** Refresh page, try different product

#### Error: "Please select a size"
- **Cause:** Size is required for this product
- **Solution:** Select from size dropdown

---

## 7️⃣ Complete Workflow Example

### Scenario: Maplitho Stock Management

**Day 1 - Add New Product:**
```
1. Click "Add New Product"
2. Select "Maplitho"
3. Fill: GSM=80, Size=9x6, Color=White, Price=₹50
4. Submit
5. ✅ Product appears in inventory (qty: 0)
```

**Day 2 - Restock Arrived:**
```
1. Find Maplitho | 80 GSM | 9x6 row
2. Click [+] button
3. Click "+10" quick button (qty=10)
4. Add reason: "Stock received from mill"
5. Click "Add Stock"
6. ✅ Inventory: 0 → 10
```

**Day 3 - Customer Orders:**
```
1. Find Maplitho row
2. Click [-] button
3. Type: 3
4. Add reason: "Sale to customer ABC"
5. Click "Reduce Stock"
6. ✅ Inventory: 10 → 7
```

**Day 4 - Check Stock:**
```
1. Search: "9x6"
2. See Maplitho | 80 GSM | 9x6 → Stock: 7
3. Status: Low (7/50) → Red badge
4. Need to restock!
```

---

## 8️⃣ Search Tips

Search works on these fields:
- Product name (e.g., "Maplitho")
- Material (e.g., "Buff")
- Size (e.g., "9x6")
- GSM (e.g., "80")
- Color (e.g., "White")

**Examples:**
```
Search: "Maplitho"     → All Maplitho variants
Search: "80"           → All 80 GSM products
Search: "9x6"          → All 9x6 size products
Search: "White"        → All white color variants
```

---

## 9️⃣ Table Actions Column

Located on **far right** of each product row:

```
[+] [-] [✏️] [🗑️]
│   │   │   └─ Delete (soft delete)
│   │   └───── Edit quantity/price
│   └───────── Reduce stock
└───────────── Add stock
```

**What Each Does:**
- **[+]** → Open add stock modal
- **[-]** → Open reduce stock modal
- **[✏️]** → Edit quantity & price directly (old method)
- **[🗑️]** → Delete from inventory

---

## 🔟 Auto-Refresh Feature

**Checkbox:** "Auto-Refresh (30s)"

- **Enabled** ✅ → Inventory updates every 30 seconds
- **Disabled** ❌ → Manual refresh only

**Why?** Real-time sync if multiple users editing

---

## 🔐 Validation Rules

### For Adding Products:
```
✅ Product must be selected
✅ Size required (if product.hasSize)
✅ GSM required (if product.hasGSM)
✅ Price must be ≥ 0
✅ No duplicate variants allowed
```

### For Stock Operations:
```
✅ Quantity must be > 0
✅ Cannot reduce more than available
✅ Cannot create negative stock
✅ Reason is optional but recommended
```

---

## 💡 Pro Tips

1. **Use Quick Buttons** - Faster than typing quantities
2. **Add Reason** - Helps track stock movements (audit trail)
3. **Monitor Status Colors** - Red = reorder soon
4. **Use Search** - Find products quickly in large inventory
5. **Auto-Refresh** - Enable if team uses same system
6. **Check Constraints** - See product fields before creating

---

## 📱 Mobile Compatibility

- ✅ Responsive design works on mobile
- ⚠️ Recommended: Desktop for better UX
- ⚠️ Touch: Slower than keyboard shortcuts

---

## 🆘 Troubleshooting

### Modals Not Opening?
- Check browser console (F12)
- Refresh page (Ctrl+F5)
- Restart frontend if needed

### Stock Not Updating?
- Check if auto-refresh is on
- Click Refresh button manually
- Verify network request succeeded

### Product Not Appearing?
- Check for duplicate error
- Verify all required fields filled
- Look at browser console for errors

### Slow Performance?
- Disable auto-refresh
- Use search to filter products
- Close other browser tabs

---

## ✨ Color Coding

| Color | Meaning |
|-------|---------|
| 🟢 Green | Add stock (safe, increase) |
| 🔴 Red | Reduce stock (caution, decrease) |
| 🔵 Blue | Edit/General actions |
| 🟡 Gray | Disabled/Inactive |
| 🟠 Orange | Medium priority (warnings) |

---

## 📞 Quick Help

**Q: How do I find a product?**
A: Type in search box (searches all fields)

**Q: Can I add duplicate products?**
A: No - system prevents duplicates automatically

**Q: How do I bulk update stock?**
A: Use Edit button (old method) for direct quantity change

**Q: Where's the audit log?**
A: Check console network tab or backend logs

---

## 🎯 Key Features Recap

✅ **Add Products** - Create variants with auto-inventory  
✅ **Quick Stock Buttons** - Add/reduce with one click  
✅ **Smart Popups** - Success/error notifications  
✅ **Duplicate Prevention** - Can't add same product twice  
✅ **Validation** - Prevents errors at every step  
✅ **Real-time Sync** - Updates instantly across users  
✅ **Professional UI** - Clean, modern design  
✅ **Dark Mode** - Comfortable for all lighting  

---

**Last Updated:** April 1, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

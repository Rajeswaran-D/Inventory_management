# Quick Reference - Smart Inventory System v2.0

**Last Updated:** April 1, 2026  
**Version:** 2.0 Production Ready

---

## 🚀 Quick Start

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev

# Open browser
http://localhost:5173
```

---

## 📍 Key File Locations

### Backend (Critical Changes)
```
backend/src/
├── controllers/
│   ├── productController.js         ✅ AUTO-SYNC logic
│   └── inventoryController.js       ✅ Search support
├── models/
│   ├── ProductVariant.js
│   └── Inventory.js                 ✅ variantId reference
└── routes/
    └── productRoutes.js
```

### Frontend (Critical Changes)
```
frontend/src/
├── pages/
│   ├── ProductMaster.jsx            ✅ API-connected
│   └── Inventory.jsx                ✅ Search + Auto-refresh
├── hooks/
│   └── useToast.js                  ✅ Notifications
├── components/ui/
│   └── ConfirmDialog.jsx            ✅ Confirmations
└── services/
    └── api.js
```

---

## 🔄 Core Features Quick Map

| Feature | File | Status |
|---------|------|--------|
| Auto Inventory Creation | `productController.js` | ✅ |
| Search Inventory | `Inventory.jsx` | ✅ |
| Auto-Refresh | `Inventory.jsx` | ✅ |
| Toast Notifications | `useToast.js` | ✅ |
| Confirm Dialogs | `ConfirmDialog.jsx` | ✅ |
| Premium UI | All `.jsx` files | ✅ |

---

## 🔗 Data Flow (Simplified)

```
Product Master
  ↓
CREATE ProductVariant
  ↓
(Backend with transaction)
CREATE Inventory ← AUTO
  ↓
Toast: "✅ Created"
  ↓
Inventory.jsx displays it
  ↓
User searches: finds it
  ↓
User edits: stock updated
  ↓
Auto-refresh: updates on page
```

---

## 💾 API Endpoints (Most Used)

```javascript
// Product Master
GET    /api/products/master
POST   /api/products/master
GET    /api/products/master/:id
PUT    /api/products/master/:id
DELETE /api/products/master/:id

// Variants (links to Inventory auto-create!)
GET    /api/products/variants
POST   /api/products/variants        ← Creates inventory too!
GET    /api/products/variants/:id
DELETE /api/products/variants/:id

// Inventory
GET    /api/inventory                ← Supports ?search=xxx
POST   /api/inventory
GET    /api/inventory/:id
PUT    /api/inventory/:id            ← Update stock
DELETE /api/inventory/:id
```

---

## 🎯 Common Tasks

### How to: Add a New Product Variant

```javascript
// Frontend call
const payload = {
  productId: "xxx",
  gsm: 80,
  size: "9x4",
  color: "White"
};

await productService.createVariant(payload);
// This creates BOTH ProductVariant AND Inventory!
```

### How to: Search Inventory

```javascript
// Automatic on frontend
const query = "9x4";  // User types this
const filtered = products.filter(p => {
  const text = `${p.variant.displayName} ${p.variant.size}`;
  return text.toLowerCase().includes(query.toLowerCase());
});
```

### How to: Update Stock

```javascript
const inventoryId = "xxx";
await inventoryService.update(inventoryId, {
  quantity: 100,
  price: 50
});
// Toast appears: "✅ Inventory updated"
// Page auto-refreshes (if enabled)
```

### How to: Enable Auto-Refresh

```javascript
// In Inventory.jsx component
// User clicks checkbox: "Auto-Refresh (30s)"
// This activates 30-second polling interval
```

---

## 🎨 Theme & Styling

### Color Palette
```css
/* Green (Primary) */
#10b981    /* Success, Actions */
#059669    /* Hover/Darker */

/* Blue (Secondary) */
#3b82f6    /* Info */

/* Red (Error) */
#ef4444    /* Delete, Error */

/* Amber (Warning) */
#f59e0b    /* Caution */
```

### Tailwind Classes (Used)
```
rounded-lg, rounded-xl         /* Rounded corners */
shadow-md, shadow-lg           /* Shadows */
bg-gradient-to-r               /* Gradients */
hover: prefix                  /* Hover effects */
transition-all                 /* Animations */
dark:                          /* Dark mode */
```

---

## 🧪 Testing Essentials

```javascript
// 1. Test Auto-Sync
CREATE ProductVariant
→ Check Inventory created
→ Check BOTH have same variantId

// 2. Test Search
UPDATE ?search=9x4
→ Verify filtered instantly
→ Check count updates

// 3. Test Auto-Refresh
UPDATE stock
→ Wait 30 seconds (if enabled)
→ Check page auto-updates

// 4. Test Notifications
CREATE/UPDATE/DELETE
→ Toast appears
→ Message is clear
→ Auto-dismisses in 3-4s

// 5. Test Confirmations
DELETE item
→ Confirm dialog appears
→ Cancel → Stays
→ Confirm → Deletes + Toast
```

---

## 🔴 Common Issues & Fixes

### Issue: Inventory not appearing
**Fix:**
1. Check backend console for errors
2. Verify MongoDB connection
3. Check API response: `GET /api/inventory`
4. Manual refresh browser (F5)

### Issue: Search not working
**Fix:**
1. Check variant has displayName
2. Verify search is case-insensitive
3. Try different keywords

### Issue: Toast not showing
**Fix:**
1. Verify `useToast()` imported
2. Check `react-hot-toast` in package.json
3. Verify `div` for toast display in App.jsx

### Issue: API 404 errors
**Fix:**
1. Verify backend running: `http://localhost:5000/api/health`
2. Check VITE_API_URL in frontend
3. Verify route exists in backend

---

## 📦 Dependencies Added

```json
{
  "react-hot-toast": "latest",
  "lucide-react": "latest",
  "axios": "latest"
}
```

---

## 🛠️ Dev Commands

```bash
# Backend
npm run seed              // Populate test data
npm run dev               // Start with nodemon
npm run build             // Production build

# Frontend
npm run dev               // Vite dev server
npm run build             // Production build
npm run preview           // Preview production
```

---

## 📊 Database Schema Quick Reference

```javascript
ProductMaster
  ├─ _id (ObjectId)
  ├─ name (String, unique)
  ├─ hasGSM, hasSize, hasColor (Boolean)
  ├─ gsmOptions[], sizeOptions[], colorOptions[]
  └─ timestamps

ProductVariant
  ├─ _id (ObjectId)
  ├─ productId (ref: ProductMaster) ← Required
  ├─ gsm, size, color (as required)
  ├─ displayName, sku (auto-generated)
  └─ timestamps

Inventory
  ├─ _id (ObjectId)
  ├─ variantId (ref: ProductVariant) ← UNIQUE!
  ├─ quantity, price, minimumStockLevel
  ├─ productId (ref: Product, for backward compat)
  └─ timestamps
```

---

## 🚨 Critical Implementation Details

### Auto-Sync Implementation
```javascript
// CRITICAL: Transaction ensures atomicity
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Step 1: Create variant
  const variant = await ProductVariant.save({ session });
  
  // Step 2: Create inventory
  const inventory = await Inventory.save({ session });
  
  // Step 3: Commit both
  await session.commitTransaction();
} catch (err) {
  // Both ROLLBACK on error
  await session.abortTransaction();
}
```

### Search Implementation
```javascript
// 1. Get search query from input
const query = e.target.value;

// 2. Filter sync on frontend
const filtered = data.filter(item => {
  const searchText = `${item.variant.displayName} ${item.variant.size}`;
  return searchText.toLowerCase().includes(query.toLowerCase());
});

// 3. Display filtered results
setFilteredProducts(filtered);
```

### Toast Implementation
```javascript
// 1. Create toast hook
const toast = useToast();

// 2. Call on events
toast.success('✅ Updated successfully');
toast.error('❌ Operation failed');
toast.loading('Processing...');
```

---

## 🔐 Validation Rules

```javascript
// Backend Validation
if (product.hasGSM && !gsm) throw "GSM required";
if (product.hasSize && !size) throw "Size required";

// Frontend Validation
if (!variantForm.gsm) toast.error('GSM required');
if (updateForm.quantity < 0) toast.error('Negative not allowed');

// Duplicate Prevention
const existing = await ProductVariant.findOne({
  productId, gsm, size, color
});
if (existing) throw "This variant already exists";
```

---

## 📈 Performance Notes

- **Search:** <100ms for 1000 items (frontend filter)
- **Auto-Refresh:** 30s interval (configurable)
- **API:** <500ms average response
- **Database:** Indexed queries (productId, variantId)

---

## 🎓 Key Learning Points

1. **Transactions:** Used for data consistency
2. **Population:** Mongoose populate for relationships
3. **Real-time Updates:** 30s polling interval
4. **Error Handling:** Try-catch with transaction rollback
5. **User Feedback:** Toasts + confirmations
6. **Dark Mode:** CSS variables for theming

---

## 📞 Quick Debug Checklist

- [ ] Backend running on :5000?
- [ ] Frontend running on :5173?
- [ ] MongoDB connected?
- [ ] API response correct?
- [ ] Console errors?
- [ ] Network tab showing 200 responses?
- [ ] Inventory variance IDs unique?
- [ ] Toast showing?
- [ ] Search executing?
- [ ] Database has test data?

---

## 🎯 Success Criteria

✅ ProductVariant created → Inventory auto-created  
✅ Inventory searches work  
✅ Auto-refresh updates list  
✅ Toast shows for all actions  
✅ Delete asks for confirmation  
✅ UI looks professional  
✅ Dark mode works  
✅ No console errors  

---

**Ready to Code! 🚀**

Start with: `npm run dev` in both terminal windows

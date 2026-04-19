# Database Reset & Product Seeding Guide

## Overview
This guide explains how to reset your inventory database and populate it with structured product data.

## Prerequisites
- Node.js installed
- MongoDB running and accessible
- Environment variables configured (`.env` file in backend folder)

## What Gets Seeded

### Product Structure (149 Total Products)
```
Maplitho → 21 sizes × 3 GSM (80, 90, 120) = 63 products
Buff → 21 sizes × 2 GSM (80, 100) = 42 products
Kraft → 21 sizes × 1 GSM (50) = 21 products
Cloth Covers → 21 sizes = 21 products
Vibhoothi Covers → 1 size × 2 colors (White, Colour) = 2 products
```

### Initial Values for All Products
- **price**: ₹0
- **quantity**: 0 units
- **isActive**: true

## How to Run the Seed Script

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Run the Seed Script
```bash
node src/seedNew.js
```

### Step 3: Expected Output
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🗑️  Clearing existing products...
✅ Deleted X existing products

📦 Generating product combinations...
✅ Generated 149 product combinations

📥 Inserting products into database...
   ✅ Inserted 50 products...
   ✅ Inserted 100 products...

📊 Insertion Results:
   ✅ Inserted: 149
   ⏭️  Skipped (duplicates): 0
   ❌ Errors: 0

🔍 Verifying unique index...
✅ Unique index verified

📈 Database Statistics:
   Total products: 149

📋 Products by Material:
   Buff: 42 products
   Cloth Covers: 21 products
   Kraft: 21 products
   Maplitho: 63 products
   Vibhoothi Covers: 2 products

📦 Sample Products:
   1. 6.25x4.25 | Buff | 80 GSM
   2. 6.25x4.25 | Buff | 100 GSM
   3. 6.25x4.25 | Kraft | 50 GSM
   4. 6.25x4.25 | Maplitho | 80 GSM
   5. 6.25x4.25 | Maplitho | 90 GSM

🎉 Seed script completed successfully!
```

## Unique Index Information

The database automatically creates a compound unique index on:
```
size + materialType + gsm + color
```

This prevents duplicate products with identical specifications.

## What Happens During Seeding

1. **Connects to MongoDB** - Using MONGODB_URI from `.env`
2. **Clears Existing Data** - Deletes all products from Envelope collection
3. **Generates Products** - Creates 149 product combinations
4. **Inserts Products** - Batch inserts all products with error handling
5. **Verifies Index** - Ensures unique constraint is active
6. **Reports Statistics** - Shows insert counts by material type
7. **Displays Samples** - Shows first 5 products inserted

## Troubleshooting

### Connection Error: "connect ECONNREFUSED"
**Problem**: MongoDB not running
**Solution**: Start MongoDB service
```bash
# macOS (if using Homebrew)
brew services start mongodb-community

# Windows (if installed as service)
net start MongoDB

# Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

### Permission Error: "E11000 duplicate key error"
**Problem**: Duplicate products exist
**Solution**: Script automatically skips duplicates. Safe to re-run.

### "Cannot find module 'productData.js'"
**Problem**: Wrong import path
**Solution**: Ensure you're running from backend directory:
```bash
cd backend
node src/seedNew.js
```

### Empty Database After Seeding
**Problem**: Script ran but no products inserted
**Solution**: Check MongoDB connection:
```bash
# Test MongoDB connection
mongosh  # if installed locally
# or check .env MONGODB_URI value
```

## Using the Seeded Data in Frontend

Once seeded, the frontend will automatically:
- Load all 149 products in dropdowns
- Display product options based on material selection
- Show dynamic GSM/Color options
- Enable stock management for all products

### Testing the System

1. **Verify in Inventory Page**:
   - Navigate to Inventory
   - You should see 149 products listed
   - Search works across size, material, GSM

2. **Test Dropdowns in Billing**:
   - Go to Billing
   - Select Material → Buff
   - GSM dropdown shows: [80, 100]
   - Select Size → product becomes available

3. **Test Update Stock Modal**:
   - Click [Update] on any product
   - Verify product details display
   - Update price and quantity

4. **Test Delete Function**:
   - Click [Delete] on any product
   - Confirmation modal appears
   - Click Delete to remove from inventory

## Resetting Without Code Changes

To reset and reseed without modifying any code:
```bash
cd backend
node src/seedNew.js
```

This will:
- Delete all current products
- Insert fresh 149-product set
- Verify unique index
- Report success/errors

## Manual Data Verification (MongoDB)

To verify seeded data in MongoDB:
```javascript
// Connect to MongoDB (using mongosh or compass)
use envelope_inventory

// Count total products
db.envelopes.countDocuments()  // Should be: 149

// Count by material
db.envelopes.aggregate([
  { $group: { _id: "$materialType", count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
])

// View sample products
db.envelopes.find().limit(5)

// Check unique index
db.envelopes.getIndexes()
```

## Notes & Best Practices

✅ **Safe Operations**:
- Seed script won't fail on duplicate inserts
- Existing unique index is verified
- Database connection is tested before operations

⚠️ **Important**:
- Seed script DELETES all existing products
- No confirmation prompt - runs immediately
- Consider backing up data before running
- Data loss is permanent

🔄 **Reseeding**:
- Safe to run multiple times
- Each run starts fresh
- All stock quantities go back to zero
- All prices reset to ₹0

## Next Steps

1. Run the seed script: `node src/seedNew.js`
2. Start frontend: `npm run dev` (from frontend folder)
3. Start backend: `npm start` (from backend folder)
4. Test the system by adding/updating/deleting products
5. Use Billing system to record sales

---

**Questions?** Check the logs for specific error messages and console output.

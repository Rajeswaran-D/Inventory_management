# Setup & Getting Started

## First Time Setup (After Cloning)

### 1. Install Dependencies
```bash
npm run install-all
```

This installs dependencies for the root, frontend, and backend.

### 2. Configure Environment (Optional)
Create a `.env` file in the `backend/` folder:
```
MONGODB_URI=mongodb://localhost:27017/swamy_envelope
PORT=5000
```

If you don't create this file, defaults will be used.

### 3. Start the Application
```bash
npm run dev
```

This starts both the backend and frontend development servers.

## What Happens on First Run

✅ **Auto-Seeding**: On the very first run, the system automatically detects the empty database and seeds it with:
- **ProductMaster** - Main product type (Envelopes)
- **ProductVariants** - All 210 envelope combinations (21 sizes × 10 materials)
- **Inventory** - Stock & pricing records for all variants
- **PricingTiers** - 6 volume/customer/seasonal pricing tiers

You'll see this in the console:
```
🌱 AUTO-SEEDING DATABASE ON STARTUP...
📦 Seeding ProductMaster...
✅ ProductMaster created: Envelopes
📦 Seeding ProductVariants (210 combinations)...
✅ Created 210 product variants
📦 Seeding Inventory (210 items)...
✅ Created 210 inventory records
💰 Seeding Pricing Tiers...
✅ Created 6 pricing tiers

✅ DATABASE AUTO-SEEDING COMPLETE!
```

## Access the Application

- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:5000/api/

## Manual Seeding (if needed)

To re-seed the database:
```bash
cd backend
npm run seed
```

## Key Features
- 21 different envelope sizes
- 10 material types (Maplitho, Buff, Kraft, Cloth, Vibothi)
- Real-time inventory management
- Dynamic pricing tiers (volume/customer/seasonal)
- Automatic product variant generation

## Troubleshooting

### Database not seeded?
- Check that MongoDB is running
- Verify `MONGODB_URI` is correct
- Check console logs for error messages

### Port already in use?
- Backend uses port 5000 (set `PORT` in `.env`)
- Frontend uses port 5173 (configurable in `vite.config.js`)

### Dependencies missing?
```bash
npm run install-all
```

## Project Structure

```
├── backend/           # Node.js + Express server
│  └── src/
│     ├── models/     # MongoDB schemas
│     ├── routes/     # API endpoints
│     ├── controllers/ # Business logic
│     └── autoSeed.js # Auto-seeding utility
├── frontend/         # React + Vite UI
│  └── src/
│     ├── services/   # API service methods
│     └── components/ # React components
└── instance/         # MongoDB data directory
```

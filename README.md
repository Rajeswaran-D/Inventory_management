# Smart Inventory & Billing System

Inventory and billing system for an envelope manufacturing workflow. The active stack is:

- Backend: Node.js + Express
- Database: PostgreSQL
- Frontend: React + Vite

## Features

- Product master and product variant management
- Inventory tracking with stock-in / stock-out
- Billing with GST calculation
- Sales history and reporting exports
- Customer management
- Role-based authentication

## Project Structure

```text
inventory-management/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── seedPostgres.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── POSTGRESQL_SETUP.md
└── README.md
```

## Backend Environment

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_management
JWT_SECRET=change_this_to_secure_key
FRONTEND_URL=http://localhost:5173
POSTGRES_SSL=false
```

## Install

Root:

```bash
npm install
```

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

## Seed PostgreSQL

```bash
cd backend
npm run seed
```

This creates tables and seeds:

- base product data
- inventory records
- pricing tiers
- default users

## Run

Root:

```bash
npm run dev
```

Or manually:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

## API Notes

Main backend routes:

- `/api/auth`
- `/api/products`
- `/api/inventory`
- `/api/sales`
- `/api/customers`
- `/api/reports`
- `/api/pricing-tiers`

## Verification

Useful backend scripts:

```bash
cd backend
npm run verify:api
npm run test:reports
npm run test:download
```

## Migration Status

The active Node backend uses PostgreSQL only. Old database runtime files have been removed from the backend codepath.

# PostgreSQL Setup

This project now uses PostgreSQL for the active Node/React application.

## Backend env

Set:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_management
JWT_SECRET=change_this_to_secure_key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Optional:

```env
POSTGRES_SSL=false
```

## Install

```bash
cd backend
npm install
```

`pg` is the database driver used by the backend.

## Initialize and seed

```bash
cd backend
npm run seed
```

This creates the PostgreSQL tables and seeds:

- default product master / variants / inventory
- pricing tiers
- default users

## Run

```bash
cd backend
npm run dev
```

The server boot path now:

1. connects to PostgreSQL
2. creates tables if missing
3. auto-seeds base data when empty
4. starts the API

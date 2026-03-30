# Smart Inventory & Billing System

A premium, production-level SaaS-style application for envelope manufacturing companies.

## Tech Stack
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Frontend:** React, Tailwind CSS, Lucide Icons, Framer Motion
- **Database:** MongoDB

---

## 🛠 Setup Instructions

### 1. Prerequisite
- Node.js (v16+)
- MongoDB (Running locally or MongoDB Atlas)

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file (already created with defaults) and run the seed script to initialize products:
```bash
npm run seed
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Core Features
1. **Smart Inventory**: CRUD for products, duplicate detection, and advanced search.
2. **Stock Management**: Record IN/OUT movements with an auto-updating live stock system.
3. **POS Billing**: High-speed billing interface with keyboard shortcuts (search/add), customer lookup, and grand total calcs.
4. **Dashboard Analytics**: Real-time sales stats, low-stock alerts, and top-selling product charts.
5. **Smart Alerts**: Color-coded stock indicators and critical low-stock notifications.

---

## ⌨️ Keyboard Shortcuts (Billing)
- **F2**: Focus Search
- **Enter**: Add selected item to cart (upcoming)
- **Esc**: Clear search

---

## 📂 Project Structure
```text
├── backend/
│   ├── src/
│   │   ├── controllers/ (Logic)
│   │   ├── models/ (DB Schemas)
│   │   ├── routes/ (API Endpoints)
│   │   └── seed.js (Initialization)
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/ (Reusable UI)
    │   ├── pages/ (Dashboard, Inventory, Billing)
    │   ├── services/ (API Axios)
    │   └── App.jsx (Routing)
```

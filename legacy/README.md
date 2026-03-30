# Swami Manufacturing | Smart Inventory & Billing System

A premium SaaS-style desktop application for managing envelope manufacturing operations including inventory, customers, billing (POS), and analytics.

## 🚀 Features
- **Dashboard**: Real-time business insights (Sales trends, Product distribution, Stock alerts).
- **POS Billing**: Dynamic item selection, auto-stock reduction, and instant PDF invoice generation.
- **Inventory Mgt**: Advanced search, material categorization, GSM tracking, and duplicate detection.
- **Customers**: Detailed profiles and purchase history.
- **Analytics**: Monthly/Daily reports for data-driven decisions.
- **Premium UI**: Tailwind CSS, Dark Mode, Lucide icons, Smooth transitions.

## 🛠️ Tech Stack
- **Backend**: Python Flask, SQLite, SQLAlchemy
- **Frontend**: HTML5, Tailwind CSS, JavaScript (Vanilla ES6+), Chart.js
- **Exports**: ReportLab (PDF), Pandas (Excel ready)

## 📦 Setup Instructions

### 1. Prerequisites
- Python 3.8+
- Node.js (Not required, uses CDN)

### 2. Environment Setup
Create a virtual environment and install dependencies:
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Initialize Database
Initialize the database with sample manufacturing data:
```bash
flask init-db
```

### 4. Run Application
Start the Flask server:
```bash
python app.py
```
After starting, open `index.html` in your browser (or use a Live Server).

## 💡 Keyboard Shortcuts (POS)
- `Enter`: Add item to cart
- `Ctrl + S`: Complete Sale
- `ESC`: Close Modals

---
*Created for Swami Manufacturing - Optimized for small-scale industries.*

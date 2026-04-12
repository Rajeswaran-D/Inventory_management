#!/bin/bash

# Swamy Envelope - Desktop Setup Script
# For macOS and Linux

set -e

echo ""
echo "========================================"
echo "  Swamy Envelope - Desktop Setup"
echo "========================================"
echo ""

# Check Node.js
echo "[1/5] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please download from: https://nodejs.org/"
    exit 1
fi
node --version
echo "✅ Node.js detected"

# Check MongoDB
echo ""
echo "[2/5] Checking MongoDB..."
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found in PATH"
    echo ""
    echo "Options:"
    echo "macOS (Homebrew):"
    echo "  brew tap mongodb/brew"
    echo "  brew install mongodb-community"
    echo "  brew services start mongodb-community"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg"
    echo "  echo 'deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse' | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list"
    echo "  sudo apt-get update && sudo apt-get install -y mongodb-org"
    echo "  sudo systemctl start mongod"
    echo ""
    read -p "Press Enter after installing MongoDB..."
else
    mongod --version
    echo "✅ MongoDB detected"
fi

# Install dependencies
echo ""
echo "[3/5] Installing dependencies..."
cd "$(dirname "$0")"
npm run install-all
echo "✅ Dependencies installed"

# Build frontend
echo ""
echo "[4/5] Building frontend..."
npm run build
echo "✅ Frontend built"

# Create data directories
echo ""
echo "[5/5] Setting up data directories..."
mkdir -p data/db
echo "✅ Data directories ready"

echo ""
echo "========================================"
echo "  ✅ Setup Complete!"
echo "========================================"
echo ""
echo "Next Steps:"
echo "1. Make sure MongoDB is running"
echo "   macOS: brew services start mongodb-community"
echo "   Linux: sudo systemctl start mongod"
echo ""
echo "2. Start development:"
echo "   npm run dev:desktop"
echo ""
echo "3. Or build production installer:"
echo "   npm run dist"
echo ""

# Swamy Envelope - Desktop Application Setup Guide

## Prerequisites

Before you can run Swamy Envelope as a desktop application, you need to have MongoDB installed on your system.

## MongoDB Installation

### Windows

#### Option 1: Using Official MongoDB Community Installer (Recommended)

1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Select **Windows** as the platform
   - Select **Recommended** version (7.0.0+)
   - Choose **MSI** installer

2. **Install MongoDB**
   - Run the `.msi` installer
   - Follow the installation wizard
   - **IMPORTANT**: Check "Install MongoDB as a Service" and "Run the MongoDB service as Network Service user"
   - Complete the installation

3. **Verify Installation**
   - Open Command Prompt
   - Run: `mongod --version`
   - If you see version info, MongoDB is correctly installed!

4. **Start MongoDB Service**
   - MongoDB should start automatically as a service
   - Or manually start it:
   ```bash
   mongod --dbpath "C:\data\db"
   ```

#### Option 2: Using MongoDB Portable (No Installation Required)

1. **Download Portable MongoDB**
   - Visit: https://www.mongodb.com/download-center/community
   - Download the ZIP file
   - Extract to: `C:\mongodb`

2. **Create Data Directory**
   ```bash
   mkdir C:\data\db
   ```

3. **Add to System PATH**
   - Copy the path: `C:\mongodb\bin`
   - Add to your Windows PATH environment variable

4. **Verify Installation**
   - Open Command Prompt (new window after PATH update)
   - Run: `mongod --version`

### macOS

```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)

```bash
# Add MongoDB repository
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor | sudo tee /usr/share/keyrings/mongodb-server-7.0.gpg > /dev/null

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Installing Swamy Envelope Desktop

### 1. Install Dependencies

```bash
cd Inventory_management
npm run install-all
```

### 2. Build Frontend

```bash
npm run build
```

### 3. Install Electron Dependencies

```bash
npm install
```

This installs:
- `electron` - Desktop framework
- `electron-builder` - Packaging tool
- `electron-is-dev` - Development detection
- `wait-on` - Port waiting utility

### 4. Run in Development Mode

```bash
npm run dev:desktop
```

This will:
- Start MongoDB (if installed)
- Start Backend API (port 5000)
- Start Frontend dev server (port 5173)
- Open Electron window

### 5. Build Production Installer

```bash
npm run dist
```

This creates:
- `dist/Swamy-Envelope-Setup.exe` - Installer
- `dist/Swamy-Envelope-Setup.exe` - Portable executable

## Project Structure

```
Inventory_management/
├── backend/              # Express API server
│   ├── server.js
│   ├── src/
│   └── package.json
├── frontend/             # React + Vite app
│   ├── src/
│   ├── dist/            # Built files (production)
│   └── package.json
├── mongodb/             # MongoDB binaries (if bundled)
│   ├── bin/
│   └── README.md
├── data/                # Database storage
│   └── db/
├── electron.js          # Electron main process
├── preload.js           # Security bridge
└── package.json         # Root configuration
```

## How It Works

1. **Electron Main Process** (`electron.js`)
   - Starts MongoDB service
   - Starts Express backend server
   - Creates application window
   - Manages process lifecycle

2. **Backend** (Port 5000)
   - Express API server
   - MongoDB connection
   - Authentication & business logic
   - Runs at: `http://localhost:5000`

3. **Frontend** (Port 5173 dev / 5000 prod)
   - React + Vite application
   - User interface
   - API communication
   - Runs at: `http://localhost:5173` (dev) or from dist (production)

4. **MongoDB** (Port 27017)
   - Local database storage
   - No external connection needed
   - Data stored in: `/data/db`

## Features

✅ **Completely Offline** - No internet required after installation
✅ **Portable** - Single executable file
✅ **Professional UI** - Modern desktop application interface
✅ **Automatic Services** - MongoDB and backend start automatically
✅ **Data Persistence** - All data stored locally
✅ **Easy Backup** - Copy `/data/db` folder to backup database

## Troubleshooting

### MongoDB Not Found Error

If you see "MongoDB is not installed":
1. Install MongoDB from https://www.mongodb.com/download-center/community
2. Add MongoDB `/bin` folder to your system PATH
3. Restart Swamy Envelope

### Backend Fails to Start

1. Check if port 5000 is available
2. Verify MongoDB is running: `mongod --version`
3. Check backend logs in console (press F12 in Electron window)

### Frontend Displays Blank

1. Check console for errors (Press F12)
2. Ensure backend is running (check terminal output)
3. Try reloading: Ctrl+R

## Performance Tips

- Keep MongoDB service running in background
- Close other applications to free up memory
- Run on SSD for better performance
- 4GB RAM minimum recommended

## Backing Up Your Data

```bash
# Backup database
mongodump --out ./backup

# Restore database
mongorestore ./backup
```

Or simply copy the `/data/db` folder to a safe location.

## Support

For issues or questions:
1. Check logs in Electron Developer Tools (F12)
2. Review MongoDB documentation: https://docs.mongodb.com
3. Check Express API documentation: https://expressjs.com

## Next Steps

1. ✅ Install MongoDB
2. ✅ Install all npm dependencies
3. ✅ Build the application
4. ✅ Run the application
5. ✅ Create your first inventory entry!

Happy inventory management! 🚀

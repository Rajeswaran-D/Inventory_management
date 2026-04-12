# Swamy Envelope Desktop - Complete Deployment Guide

## 🎯 Quick Start (For End Users)

### Windows
1. **Download** the `.exe` installer
2. **Run** the installer
3. **Install** to your desired location
4. **Launch** from Start Menu → "Swamy Envelope"
5. **Enjoy!** Everything runs offline automatically

### macOS
1. **Download** the `.dmg` file
2. **Open** and drag to Applications folder
3. **Launch** from Launchpad or Applications
4. [Make sure MongoDB is installed first](#mongodb-installation)
5. **Enjoy!** Complete offline application

### Linux
1. **Download** `.AppImage` or `.deb` file
2. **Make executable**: `chmod +x Swamy-Envelope.AppImage`
3. **Run**: `./Swamy-Envelope.AppImage`
4. **Or install**: `sudo apt install ./swamy-envelope.deb`
5. **Enjoy!** Works completely offline

---

## 📦 What's Included

Each installer includes:

```
✅ React Frontend (Modern UI)
✅ Express Backend (REST API)
✅ MongoDB Integration (Local Database)
✅ Authentication System
✅ Complete Inventory Management
✅ Billing & Invoicing
✅ Real-time Reports
✅ Data Management Tools
```

**Size**: ~250-350 MB
**Requires**: 2GB RAM, 500MB Disk Space
**Internet**: Not required (fully offline)

---

## 🛠️ For Developers - Build Your Own

### Prerequisites
```bash
# Check versions
node --version  # Should be v16+
npm --version   # Should be v8+
mongod --version # Should be installed
```

### Setup
```bash
# Clone the project
cd Inventory_management

# Install everything
npm run install-all

# Build for distribution
npm run dist
```

### Output
- **Windows**: `dist/Swamy-Envelope-Setup.exe`
- **macOS**: `dist/Swamy-Envelope.dmg`
- **Linux**: `dist/Swamy-Envelope.AppImage`

---

## 📋 MongoDB Installation

### Windows

#### Automatic (Recommended)
```bash
# Run setup script
setup.bat
```

#### Manual
1. Download: https://www.mongodb.com/try/download/community
2. Run installer (MSI)
3. Check "Install as Service"
4. MongoDB starts automatically
5. Verify: `mongod --version`

### macOS
```bash
# Using Homebrew (install Homebrew first if needed)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu)
```bash
# Run setup script
chmod +x setup.sh
./setup.sh
```

---

## 🚀 Running the Desktop App

### Development Mode
```bash
# Terminal 1: Start MongoDB
mongod --dbpath ./data/db

# Terminal 2: Start the app
npm run dev:desktop
```

Features:
- Hot-reload enabled
- Developer tools (F12)
- Live debugging
- Full error logs

### Production Mode
```bash
# Just launch the installer
# Everything starts automatically!
```

---

## 🏗️ Building from Source

### Step 1: Prepare
```bash
npm run install-all  # Install all dependencies
npm run build        # Build React frontend
```

### Step 2: Create Installer
```bash
npm run dist         # Build for your OS
```

### Step 3: Output Location
```
dist/
├── Swamy-Envelope-Setup.exe      # Windows installer
├── Swamy-Envelope.dmg            # macOS installer
├── Swamy-Envelope.AppImage       # Linux universal
└── Swamy-Envelope-*.deb          # Linux Debian
```

### Step 4: Test
- Run the installer on a clean system
- Verify MongoDB starts
- Create a test invoice
- Check database persistence
- Restart app and verify data

---

## 🔧 Configuration

###Environment Variables
See `.env.electron` for configuration options:
```
MONGODB_URI=mongodb://127.0.0.1:27017/swamy_envelope
NODE_ENV=production
BACKEND_PORT=5000
```

### Database Location
```
Windows: [Install Path]\data\db
macOS:   [Install Path]/data/db
Linux:   [Install Path]/data/db
```

### Backup Data
```bash
# Windows
xcopy "%ProgramFiles%\Swamy Envelope\data\db" "D:\backup\db" /E /I /Y

# macOS/Linux
cp -r /path/to/db ~/backups/db
```

---

## 🔐 Security Features

✅ **Offline First** - No data ever leaves your computer
✅ **Local Authentication** - No cloud authentication required
✅ **Encrypted Storage** - Data stored securely
✅ **No Tracking** - No telemetry or analytics
✅ **Open Source** - Fully transparent code
✅ **Regular Updates** - Security patches delivered

---

## 📊 System Requirements

|Component|Requirement|
|---|---|
|**OS**|Windows 10+, macOS 10.12+, Ubuntu 14.04+|
|**CPU**|2GHz quad-core minimum|
|**RAM**|2GB minimum, 4GB recommended|
|**Disk**|500MB free space minimum|
|**Internet**|None required|

---

## 👥 User Features

### Dashboard
- Total Sales Overview
- Revenue Analytics
- Low Stock Alerts
- Inventory Summary

### Inventory Management
- Add/Edit/Delete Products
- Track Stock Levels
- Monitor Unit Prices
- Batch Operations

### Billing System
- Create Invoices
- Calculate GST/Tax
- Generate Bill Numbers
- Print Invoices

### Customer Management
- Maintain Customer Database
- Track Orders
- Contact Information
- Purchase History

### Reports
- Sales Reports
- Inventory Reports
- Financial Reports
- Custom Reports

### User Management
- Multiple User Accounts
- Role-based Access
- Audit Trail
- Activity Logs

---

## ⚙️ Troubleshooting

### App Won't Start
```bash
# Check MongoDB is running
mongod --version

# Check port 5000 is available
# Windows: netstat -ano | findstr :5000
# macOS/Linux: lsof -i :5000

# Check logs in DevTools (F12)
```

### MongoDB Connection Failed
```bash
# Start MongoDB manually
mongod --dbpath ./data/db

# Verify connection
mongosh mongodb://127.0.0.1:27017
```

### Frontend Blank/Won't Load
```bash
# Force refresh
Ctrl+Shift+R  (Windows/Linux)
Cmd+Shift+R   (macOS)

# Open DevTools
F12

# Check console for errors
```

### Data Missing After Restart
```bash
# Ensure data/db has permissions
chmod -R 755 ./data/db  # macOS/Linux

# Run as Administrator (Windows)

# Check database backup exists
```

---

## 📈 Performance Tips

1. **Faster Startup**: 
   - Close unnecessary apps
   - Ensure MongoDB is indexing correctly
   - Check disk space available

2. **Faster Operations**:
   - Regular database cleanup
   - Archive old invoices
   - Optimize indexes

3. **Better Backup**:
   - Regular backups scheduled
   - Test restore process
   - Keep multiple backup versions

---

## 🔄 Updates

### Check for Updates
```bash
# In development
npm run build && npm run dist

# Production users get notified automatically
```

### Manual Update
1. Download new installer
2. Run installer (old data preserved)
3. Restart application

---

## 📞 Support

### Documentation
- [ELECTRON_SETUP_GUIDE.md](./ELECTRON_SETUP_GUIDE.md) - Detailed setup
- [BUILD_AND_DISTRIBUTION_GUIDE.md](./BUILD_AND_DISTRIBUTION_GUIDE.md) - Dev guide
- README.md - Project overview

### Resources
- **MongoDB**: https://docs.mongodb.com
- **Electron**: https://electronjs.org/docs
- **Express**: https://expressjs.com
- **React**: https://react.dev

### Reporting Issues
1. Check DevTools logs (F12)
2. Review documentation
3. Check GitHub issues
4. Contact support

---

## 📝 License

Swamy Envelope - Smart Inventory & Billing System
© 2024. All rights reserved.

Professional desktop application for small to medium businesses.

---

## 🎉 Quick Reference

| Task | Command |
|------|---------|
| Setup | `npm run install-all` |
| Build | `npm run build && npm run dist` |
| Dev Mode | `npm run dev:desktop` |
| Check Build | `npm run build:electron` |
| Review Setup | `npm run setup.bat` (Windows) |

---

**Ready to deploy? Follow the steps above and your professional desktop application is ready to go!** 🚀

Questions? Check the other documentation files or reach out for support.

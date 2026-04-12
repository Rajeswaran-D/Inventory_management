# 🚀 Swamy Envelope Desktop - Installation Guide (Step-by-Step)

## 📌 Prerequisites

Before starting, ensure you have:
- Windows 10+, macOS 10.12+, or Ubuntu 14.04+
- Administrator access (for installation)
- Internet connection (for first-time setup only)
- At least 2GB RAM and 500MB free disk space

---

## ⚙️ STEP 1: Install Node.js

This is required to run the application.

### Windows:
1. Visit: https://nodejs.org/
2. Click **"LTS" version** (recommended)
3. Download the `.msi` installer
4. Run the installer
5. Check **"Add to PATH"** during installation
6. Click "Install"
7. **Open Command Prompt (new window)** and verify:
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers (e.g., v22.0.0, v10.5.0)

### macOS:
```bash
# Install Homebrew first if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify
node --version
npm --version
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install nodejs npm

# Verify
node --version
npm --version
```

---

## ⚙️ STEP 2: Install MongoDB

This is required for the database.

### Windows:

**Option A: Official MSI Installer (Recommended)**
1. Visit: https://www.mongodb.com/try/download/community
2. Select **"Windows"** platform
3. Select **"Recommended"** version (7.0+)
4. Choose **"MSI"** installer
5. Click Download
6. Run the `.msi` installer
7. **Important**: During installation, check **"Install MongoDB Community as a Service"**
8. Complete the installation
9. **Open Command Prompt (new window)** and verify:
   ```bash
   mongod --version
   ```
   You should see "db version", if yes, MongoDB is installed ✅

**Option B: If installer fails**
1. Download ZIP from: https://www.mongodb.com/try/download/community
2. Extract to: `C:\MongoDB`
3. Right-click Start → System → Advanced system settings
4. Click "Environment Variables"
5. Under "System variables", find "Path"
6. Click "Edit"
7. Click "New"
8. Add: `C:\MongoDB\bin`
9. Click OK on all windows
10. **Open Command Prompt (new window)** and verify:
    ```bash
    mongod --version
    ```

### macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify
mongod --version
```

### Linux (Ubuntu/Debian):
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod

# Verify
mongod --version
```

---

## 📂 STEP 3: Extract Your Project

You should have a zipped file: `Inventory_management.zip` (or similar)

### Windows:
1. Find your zipped file
2. Right-click → **"Extract All..."**
3. Choose location (e.g., `C:\Users\YourName\Desktop\`)
4. Click Extract
5. **Open Command Prompt** in the extracted folder:
   - Navigate: `cd path-to-extracted-folder`
   - Or: Shift+Right-click in folder → "Open PowerShell here"

### macOS/Linux:
```bash
# Navigate to where you have the zip file
cd ~/Downloads

# Extract
unzip Inventory_management.zip

# Navigate into folder
cd Inventory_management
```

---

## 📦 STEP 4: Install Project Dependencies

Run these commands in the project folder:

### Windows (PowerShell or Command Prompt):
```bash
npm run install-all
```

**This command:**
- Installs root dependencies (Electron, electron-builder, etc.)
- Installs frontend dependencies (React, Vite, etc.)
- Installs backend dependencies (Express, MongoDB, etc.)

**Wait time:** 3-5 minutes (installing ~500 packages)

**Success indicator:** You should see:
```
> npm audit
> added XXX packages
```

---

## ✅ STEP 5: Verify Installation

Run these commands to verify everything is working:

```bash
# Check Node.js
node --version

# Check npm
npm --version

# Check MongoDB
mongod --version
```

All three should return version numbers.

---

## 🚀 STEP 6: Run the Application (Development Mode)

Now you're ready to launch the app!

### Windows (PowerShell or Command Prompt):
```bash
npm run dev:desktop
```

### macOS/Linux (Terminal):
```bash
npm run dev:desktop
```

**What happens:**
1. MongoDB starts automatically (invisible)
2. Backend server starts (port 5000)
3. Frontend React dev server starts (port 5173)
4. Electron window opens automatically

**Wait time:** 15-20 seconds for full startup

**Success indicators:**
- ✅ Electron window opens with application UI
- ✅ You see "Swamy Envelope" title
- ✅ Dashboard loads with data
- ✅ No error messages in console (Ctrl+` to toggle)

---

## 🧪 STEP 7: Test the Application

Do these to confirm it's working:

1. **Dashboard Check:**
   - Can you see the dashboard with metrics?
   - Do you see "Total Sales", "Revenue", "Inventory" cards?

2. **Create a Customer:**
   - Go to "Customers" section
   - Click "Add Customer"
   - Enter name: "Test Customer"
   - Click Save
   - Confirm it appears in the list

3. **Add Product:**
   - Go to "Inventory" section
   - Click "Add Product"
   - Enter: Name, Price, Quantity
   - Click Save

4. **Create Invoice:**
   - Go to "Billing" section
   - Click "Create Invoice"
   - Select customer and product
   - Click Generate Invoice

5. **Restart to verify data persists:**
   - Close the application (Ctrl+Q or click X)
   - Run: `npm run dev:desktop` again
   - Check if your data still exists ✅

---

## 📦 STEP 8: Build for Distribution (Optional)

Once you're confident everything works, create installers:

### Build first:
```bash
npm run build
```

**Wait time:** 2-3 minutes

### Create installer:
```bash
npm run dist
```

**Wait time:** 5-10 minutes

**Output files in `dist/` folder:**
- **Windows**: `Swamy-Envelope-Setup.exe` (installer)
- **macOS**: `Swamy-Envelope.dmg` (disk image)
- **Linux**: `Swamy-Envelope.AppImage` (portable executable)

These are ready to share with users!

---

## ⚠️ Troubleshooting

### Problem: "npm: command not found"
**Solution:** Node.js not installed or not in PATH
```bash
# Check installation
node --version

# If error, reinstall Node.js and restart terminal
```

### Problem: "MongoDB not found" or "port 27017 already in use"
**Solution:** MongoDB not running or port conflict
```bash
# Windows - Check if service is running
net start MongoDB

# macOS/Linux - Start MongoDB service
brew services start mongodb-community

# Or manually start
mongod --dbpath ./data/db
```

### Problem: "EACCES permission denied"
**Solution (macOS/Linux):** Permission issue
```bash
sudo chown -R $USER .
npm run install-all
```

### Problem: "dist folder not found" when building
**Solution:** Missing frontend build
```bash
npm run build        # Build frontend first
npm run dist         # Then build installer
```

### Problem: "Port 5000 or 5173 already in use"
**Solution:** Another process using the ports
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux - Kill process on port 5000
lsof -i :5000
kill -9 <PID>
```

### Problem: Blank screen in Electron window
**Solution:** 
1. Press F12 to open DevTools
2. Check console for errors
3. Restart: Close app and run again
4. Ensure backend is running on port 5000

---

## 📊 Quick Command Reference

| Task | Command |
|------|---------|
| Install all dependencies | `npm run install-all` |
| Run full app with services | `npm run dev:desktop` |
| Build React frontend | `npm run build` |
| Create installers | `npm run dist` |
| Start just backend | `cd backend && npm run dev` |
| Start just frontend | `cd frontend && npm run dev` |
| Manually start MongoDB | `mongod --dbpath ./data/db` |

---

## 🎯 Success Checklist

- [ ] Node.js installed (node --version works)
- [ ] MongoDB installed (mongod --version works)
- [ ] Project extracted
- [ ] npm run install-all completed successfully
- [ ] npm run dev:desktop starts without errors
- [ ] Electron window opens
- [ ] Dashboard displays correctly
- [ ] Can create test customer
- [ ] Can create test product
- [ ] Can create test invoice
- [ ] Data persists after restart
- [ ] Ready for production build!

---

## 📞 Common Questions

**Q: Do I need internet after setup?**
A: No! After initial setup, the app works completely offline.

**Q: Where is my data stored?**
A: In `./data/db/` folder (local MongoDB database)

**Q: Can I share the app with others?**
A: Yes! Run `npm run dist` to create installer, then share the `.exe` / `.dmg` / `.AppImage` file

**Q: What if I get stuck?**
A: Read the documentation files:
- README_DESKTOP_APP.md (overview)
- ELECTRON_SETUP_GUIDE.md (detailed setup)
- BUILD_AND_DISTRIBUTION_GUIDE.md (build guide)

---

## ✨ Next Steps After Installation

1. **For Development:**
   - Run `npm run dev:desktop` for testing
   - Modify code as needed
   - Changes auto-reload in frontend

2. **For Distribution:**
   - Run `npm run build`
   - Run `npm run dist`
   - Share `.exe` / `.dmg` / `.AppImage` with users

3. **For Production:**
   - Test thoroughly
   - Update version in package.json
   - Build installers
   - Deploy to users!

---

## 🎉 You're Ready!

Follow these steps exactly and your Swamy Envelope Desktop Application will be up and running in **20-30 minutes**!

**Start with Step 1 and follow in order.** 🚀

---

**Last Updated:** April 10, 2026
**Version:** 1.0.0
**Ready for:** Development, Testing, Production

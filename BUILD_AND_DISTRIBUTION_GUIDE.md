# Swamy Envelope - Build & Distribution Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Building the Application](#building-the-application)
4. [Creating Installers](#creating-installers)
5. [Distribution](#distribution)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Windows**: Windows 10 or later (64-bit)
- **macOS**: macOS 10.12 or later
- **Linux**: Ubuntu 14.04 or later

### Software Requirements
- Node.js 16+ ([Download](https://nodejs.org/))
- MongoDB 4.4+ ([Download](https://www.mongodb.com/try/download/community))
- npm 8+ (comes with Node.js)

### Development Tools
- Git (for version control)
- Text editor or IDE (VS Code recommended)

---

## Development Setup

### 1. Clone/Setup Project
```bash
cd Inventory_management
npm run install-all
```

This installs:
- Root dependencies (Electron, electron-builder, etc.)
- Frontend dependencies (React, Vite, etc.)
- Backend dependencies (Express, MongoDB, etc.)

### 2. Ensure MongoDB is Running
```bash
# Windows - If installed as service
net start MongoDB

# Or manually start mongod
mongod --dbpath "D:\data\db"
```

### 3. Run in Development Mode
```bash
npm run dev:desktop
```

This command:
- ✅ Starts MongoDB
- ✅ Starts Backend API (Port 5000)
- ✅ Starts Frontend Dev Server (Port 5173)
- ✅ Opens Electron window

---

## Building the Application

### Step 1: Build Frontend
```bash
npm run build
```

Output: `frontend/dist/` - Contains optimized HTML, CSS, JS

### Step 2: Verify Backend
```bash
npm run build
```

The backend doesn't need building, but verify it's ready:
- ✅ All dependencies installed
- ✅ Environment variables set
- ✅ Database connection configured

### Step 3: Create Electron Build
```bash
npm run build:electron
```

Or simply:
```bash
npm run dist
```

---

## Creating Installers

### Windows Installers

#### NSIS Installer (Recommended)
```bash
npm run dist
```

Creates:
- **`Swamy-Envelope-Setup.exe`** - Full installer with NSIS
- Install to Program Files
- Creates Start Menu shortcuts
- Creates Desktop shortcut
- Uninstaller included

#### Portable Executable
```bash
npm run dist
```

Also creates:
- **`Swamy-Envelope-Setup.exe`** - Portable version (no installation needed)
- Can run from USB drive
- No registry modifications

### macOS Installers

```bash
npm run dist
```

Creates:
- **`Swamy-Envelope.dmg`** - Disk image installer
- **`Swamy-Envelope.app`** - App bundle

### Linux Packages

```bash
npm run dist
```

Creates:
- **`.AppImage`** - Universal Linux executable
- **`.deb`** - Debian/Ubuntu package

---

## Distribution

### Package Contents

The installer/executable includes:

```
Swamy Envelope Application
├── Frontend (React built files)
├── Backend (Node.js Express server)
├── Data Directory (/data/db)
└── System Libraries
```

**Total Size**: ~250-350 MB (depending on platform)

### Deployment Checklist

- [ ] Update version in `package.json`
- [ ] Update version in backend `package.json`
- [ ] Update changelog
- [ ] Build frontend: `npm run build`
- [ ] Test locally: `npm run dev:desktop`
- [ ] Create installer: `npm run dist`
- [ ] Test installer
- [ ] Sign installer (optional but recommended)
- [ ] Upload to distribution server
- [ ] Create release notes
- [ ] Announce to users

### Installation for End Users

#### Windows
1. Download `.exe` installer
2. Double-click to run
3. Follow installation wizard
4. Launch from Start Menu or Desktop shortcut
5. MongoDB loads automatically on app start
6. Enjoy!

#### macOS
1. Download `.dmg` file
2. Open and drag app to Applications folder
3. Launch from Applications or Launchpad
4. Ensure MongoDB is running (see ELECTRON_SETUP_GUIDE.md)
5. Enjoy!

#### Linux
1. Download `.AppImage` file
2. Make executable: `chmod +x Swamy-Envelope-*.AppImage`
3. Run: `./Swamy-Envelope-*.AppImage`
4. Or install `.deb`: `sudo apt install ./swamy-envelope-*.deb`
5. Launch from menu or `swamy-envelope` command
6. Ensure MongoDB is running
7. Enjoy!

---

## Advanced Configuration

### Code Signing (Windows)

For production builds, sign your executable:

Update `package.json` build section:
```json
{
  "build": {
    "win": {
      "certificateFile": "./path/to/certificate.pfx",
      "certificatePassword": "your-password",
      "signingHashAlgorithms": ["sha256"]
    }
  }
}
```

### Auto-Update Configuration

Add auto-update support to `electron.js`:
```javascript
const { autoUpdater } = require('electron-updater');

app.on('ready', async () => {
  // ... existing code ...
  autoUpdater.checkForUpdatesAndNotify();
});
```

### Custom Configuration Files

Create `build/nsis/installer.nsi` for NSIS customization
Create `build/installerIcon.ico` for custom icon
Create `build/mac/background.png` for macOS DMG

---

## Troubleshooting

### Build Issues

#### "electron-builder not found"
```bash
npm install electron-builder --save-dev
```

#### "Code signature invalid" (macOS)
```bash
codesign --deep --force --verify --verbose --sign - "dist/Swamy Envelope.app"
```

#### Installer size too large
- Verify `frontend/dist` exists and is optimized
- Check `node_modules` doesn't have duplicates
- Run: `npm ci` instead of `npm install`

### Runtime Issues

#### Application won't start
- Check MongoDB is running
- Check port 5000 is available
- Check backend is built
- Check data/db directory has permissions

#### MongoDB connection fails
- Verify MongoDB installation
- Check port 27017 is not blocked
- Review logs in DevTools (F12)

### Permission Issues

#### Cannot write to data directory
```bash
# Windows - Run as Administrator
sudo chown -R $USER data/  # macOS/Linux
```

#### MongoDB won't start
```bash
# Check if port is in use
lsof -i :27017  # macOS/Linux
netstat -ano | findstr :27017  # Windows
```

---

## Version Management

### Update Version

1. **Root package.json**
```json
{
  "version": "1.0.1"
}
```

2. **Backend package.json**
```json
{
  "version": "1.0.1"
}
```

3. **Frontend package.json**
```json
{
  "version": "1.0.1"
}
```

4. Add release notes to `RELEASE_NOTES.md`

### Build with New Version
```bash
npm run dist
# Creates: dist/Swamy-Envelope-Setup-1.0.1.exe
```

---

## Security Considerations

### Environment Variables
- Never commit `.env` files
- Ensure `JWT_SECRET` is strong
- Rotate credentials regularly

### Data Security
- Regular database backups
- Encrypted data connections (in production)
- Access control for data directory

### Application Security
- Sign executables in production
- Implement code integrity checks
- Keep dependencies updated

---

## Performance Optimization

### Frontend
```bash
# Build includes:
# - Tree-shaking (removes unused code)
# - Minification (reduces file size)
# - Code splitting (lazy loading)
npm run build
```

### Backend
- Enable compression middleware
- Implement caching
- Monitor response times

### Database
- Index frequently queried fields
- Archive old data
- Regular maintenance

---

## Release Checklist

### Pre-Release
- [ ] Code review complete
- [ ] All tests passing
- [ ] Dependencies updated
- [ ] Security audit complete
- [ ] Documentation updated

### Release
- [ ] Version bumped
- [ ] Build created successfully
- [ ] Installer tested
- [ ] Files signed (production)
- [ ] Released to distribution channel

### Post-Release
- [ ] Monitor crash reports
- [ ] User feedback collected
- [ ] Issues documented
- [ ] Next version planned

---

## Support Resources

- **Electron Docs**: https://www.electronjs.org/docs
- **electron-builder**: https://www.electron.build/
- **MongoDB**: https://docs.mongodb.com/
- **Express**: https://expressjs.com/
- **React**: https://react.dev/

---

## License

Swamy Envelope - Smart Inventory & Billing System
Copyright © 2024. All rights reserved.

---

## Contact & Support

For questions or issues, please refer to:
1. This documentation
2. GitHub issues
3. Support email

Happy building! 🚀

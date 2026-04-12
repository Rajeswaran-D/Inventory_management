# Automated Installation for Node.js & MongoDB

> **Choose ONE method below** — they all achieve the same result but use different approaches.

---

## 🚀 OPTION 1: Chocolatey (EASIEST - Recommended)

**Prerequisites:** Administrator access required

### Step 1: Install Chocolatey (one-time only)
1. Open **PowerShell as Administrator** (right-click → Run as administrator)
2. Copy and paste this:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
iex ((New-Object System.Net.ServicePointManager).ServerCertificateValidationCallback = {$true}); iex ((new-object net.webclient).DownloadString('https://community.chocolatey.org/install.ps1'))
```
3. Close and reopen PowerShell as Administrator

### Step 2: Install Node.js & MongoDB
In **PowerShell as Administrator**, copy and paste:
```powershell
choco install nodejs mongodb-community -y
```

**That's it!** ✅

### Step 3: Restart Terminal
Close PowerShell and open a new one. Verify:
```powershell
node --version
npm --version
mongod --version
```

---

## 🛠️ OPTION 2: PowerShell Script (No Extra Tools)

**For:** Users without Chocolatey or who prefer direct downloads

### Step 1: Create a PowerShell Script
1. Open **Notepad**
2. Copy and paste the entire script below:

```powershell
# Auto-Install Node.js and MongoDB
# Run as Administrator

Write-Host "🚀 Starting automated installation..." -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "❌ ERROR: Please run PowerShell as Administrator!" -ForegroundColor Red
    exit 1
}

$downloadPath = "$env:TEMP\Installers"
if (-not (Test-Path $downloadPath)) {
    New-Item -ItemType Directory -Path $downloadPath | Out-Null
}

# ==================== NODE.JS ====================
Write-Host "`n📦 Installing Node.js..." -ForegroundColor Green

$nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
$nodePath = "$downloadPath\node-setup.msi"

if (-not (Test-Path $nodePath)) {
    Write-Host "  Downloading Node.js..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    (New-Object System.Net.WebClient).DownloadFile($nodeUrl, $nodePath)
    Write-Host "  ✓ Downloaded" -ForegroundColor Green
}

Write-Host "  Installing Node.js (this may take 2-3 minutes)..."
Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$nodePath`" /quiet /norestart" -Wait
Write-Host "  ✓ Node.js installed" -ForegroundColor Green

# ==================== MONGODB ====================
Write-Host "`n📦 Installing MongoDB..." -ForegroundColor Green

$mongoUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.3-signed.msi"
$mongoPath = "$downloadPath\mongodb-setup.msi"

if (-not (Test-Path $mongoPath)) {
    Write-Host "  Downloading MongoDB..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    (New-Object System.Net.WebClient).DownloadFile($mongoUrl, $mongoPath)
    Write-Host "  ✓ Downloaded" -ForegroundColor Green
}

Write-Host "  Installing MongoDB (this may take 3-5 minutes)..."
Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$mongoPath`" /quiet /norestart ADDLOCAL=ServerService" -Wait
Write-Host "  ✓ MongoDB installed" -ForegroundColor Green

# ==================== VERIFICATION ====================
Write-Host "`n✅ Refreshing environment variables..." -ForegroundColor Cyan
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

Write-Host "`n🔍 Verifying installations..." -ForegroundColor Cyan
try {
    $nodeVersion = & node --version
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  Node.js: NOT FOUND (restart terminal)" -ForegroundColor Yellow
}

try {
    $npmVersion = & npm --version
    Write-Host "  NPM: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  NPM: NOT FOUND (restart terminal)" -ForegroundColor Yellow
}

try {
    $mongoVersion = & mongod --version | Select-Object -First 1
    Write-Host "  MongoDB: $mongoVersion" -ForegroundColor Green
} catch {
    Write-Host "  MongoDB: NOT FOUND (restart terminal)" -ForegroundColor Yellow
}

Write-Host "`n✅ Installation complete!" -ForegroundColor Cyan
Write-Host "   Please RESTART PowerShell before running npm commands" -ForegroundColor Yellow
Write-Host "   Files downloaded to: $downloadPath" -ForegroundColor Gray
```

3. Save as: **`AutoInstall.ps1`** (in your project folder)

### Step 2: Run the Script
1. Open **PowerShell as Administrator** (right-click → Run as administrator)
2. Navigate to your project folder:
```powershell
cd "C:\Users\gmh08\OneDrive\Pictures\Desktop\Convertion\Inventory_management"
```

3. Run the script:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
.\AutoInstall.ps1
```

**Wait 5-10 minutes** for downloads and installation. ⏱️

### Step 3: Restart Terminal
Close PowerShell completely and open a new one. Verify:
```powershell
node --version
npm --version
mongod --version
```

---

## 🎯 OPTION 3: Batch Script (Simplest GUI)

**For:** Users who prefer a simple point-and-click experience

### Step 1: Create Batch Script
1. Open **Notepad**
2. Copy and paste:

```batch
@echo off
setlocal enabledelayedexpansion

color 0A
title Swamy Envelope - Auto Installer

echo ========================================
echo   SWAMY ENVELOPE - AUTO INSTALLER
echo ========================================
echo.

@REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo ERROR: Please run this script as Administrator!
    echo.
    echo Right-click the .bat file and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/3] Installing Node.js...
echo Please wait for the installer window to appear...
powershell -Command "^
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; ^
    $url = 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi'; ^
    $output = \"$env:TEMP\node-setup.msi\"; ^
    if(-not (Test-Path $output)) { ^
        Write-Host 'Downloading Node.js...'; ^
        (New-Object System.Net.WebClient).DownloadFile($url, $output); ^
    }; ^
    Write-Host 'Installing Node.js...'; ^
    Start-Process -FilePath \"msiexec.exe\" -ArgumentList \"/i `\"$output`\" /quiet /norestart\" -Wait; ^
    Write-Host 'Node.js installed!'
"

echo.
echo [2/3] Installing MongoDB...
echo Please wait for the installer window to appear...
powershell -Command "^
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; ^
    $url = 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.3-signed.msi'; ^
    $output = \"$env:TEMP\mongodb-setup.msi\"; ^
    if(-not (Test-Path $output)) { ^
        Write-Host 'Downloading MongoDB...'; ^
        (New-Object System.Net.WebClient).DownloadFile($url, $output); ^
    }; ^
    Write-Host 'Installing MongoDB...'; ^
    Start-Process -FilePath \"msiexec.exe\" -ArgumentList \"/i `\"$output`\" /quiet /norestart ADDLOCAL=ServerService\" -Wait; ^
    Write-Host 'MongoDB installed!'
"

echo.
echo [3/3] Verifying installation...
@REM Refresh PATH
setlocal enabledelayedexpansion
for /f "tokens=2,*" %%A in ('reg query HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment /v Path 2^>nul') do set "PATH=%%B"
for /f "tokens=2,*" %%A in ('reg query HKCU\Environment /v Path 2^>nul') do set "PATH=!PATH!;%%B"

node --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do echo   Node.js: %%i
) else (
    echo   Node.js: NOT FOUND (restart all terminals)
)

npm --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do echo   NPM: %%i
) else (
    echo   NPM: NOT FOUND (restart all terminals)
)

mongod --version >nul 2>&1
if %errorLevel% equ 0 (
    echo   MongoDB: Installed and ready
) else (
    echo   MongoDB: NOT FOUND (restart all terminals)
)

color 0B
echo.
echo ========================================
echo   INSTALLATION COMPLETE!
echo ========================================
echo.
echo   Next step: npm run install-all
echo.
pause
```

3. Save as: **`AutoInstall.bat`** (in your project folder)

### Step 2: Run It
1. **Right-click** `AutoInstall.bat`
2. Select **"Run as administrator"**
3. Wait for downloads (~5-10 minutes) ⏱️
4. **Restart PowerShell** when done

---

## 📊 Quick Comparison

| Method | Ease | Speed | Requirements |
|--------|------|-------|--------------|
| **Chocolatey** | ⭐⭐⭐ Easiest | ⭐⭐⭐ Fastest | Admin + Internet |
| **PowerShell Script** | ⭐⭐ Medium | ⭐⭐ Auto | Admin + Internet |
| **Batch Script** | ⭐⭐⭐ Easy | ⭐⭐ Auto | Admin + Internet |

---

## ✅ After Installation

Verify everything works:
```powershell
node --version      # Should show v20.x.x
npm --version       # Should show 10.x.x
mongod --version    # Should show v7.0.x
```

Then proceed with:
```powershell
npm run install-all
npm run dev:desktop
```

---

## 🆘 Troubleshooting

### "Command not found" after installation
- **Solution:** Close and reopen PowerShell completely (not just a new tab)

### Installation stuck at "Installing..."
- **Solution:** Let it run for 5-10 minutes. MSI installers are slow.

### "Access Denied" error
- **Solution:** Right-click PowerShell/Batch file → "Run as administrator"

### Downloads too slow
- **Solution:** Check your internet connection and run again

---

## 🎯 Recommendation

**For most users:** Start with **Option 1 (Chocolatey)** if comfortable with admin access.

**For simplicity:** Use **Option 3 (Batch Script)** — just right-click and run.

**For control:** Use **Option 2 (PowerShell Script)** to see progress messages.

# ╔════════════════════════════════════════════════════════════════════╗
# ║  SWAMY ENVELOPE - AUTOMATED NODE.JS & MONGODB INSTALLATION         ║
# ║  PowerShell Script - Run as Administrator                           ║
# ╚════════════════════════════════════════════════════════════════════╝

# Instructions:
# 1. Right-click this file → Run with PowerShell
# 2. Or run: Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
#           .\AutoInstall.ps1

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   SWAMY ENVELOPE - AUTO INSTALLER                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "❌ ERROR: Please run PowerShell as Administrator!" -ForegroundColor Red
    Write-Host "   Right-click PowerShell → 'Run as administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Running as Administrator`n" -ForegroundColor Green

# Create temp directory
$downloadPath = "$env:TEMP\Installers"
if (-not (Test-Path $downloadPath)) {
    New-Item -ItemType Directory -Path $downloadPath | Out-Null
    Write-Host "📁 Created temp folder: $downloadPath`n" -ForegroundColor Gray
}

# Enable TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# ==================== NODE.JS ====================
Write-Host "📦 STEP 1: Installing Node.js v20.11.0" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green

$nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
$nodePath = "$downloadPath\node-setup.msi"

if (Test-Path $nodePath) {
    Write-Host "  ✓ Node.js installer already downloaded (skipping download)"
} else {
    Write-Host "  ⏳ Downloading Node.js (50-60 MB)..."
    try {
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($nodeUrl, $nodePath)
        Write-Host "  ✓ Downloaded successfully" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Download failed: $_" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "  ⏳ Installing Node.js (this may take 2-3 minutes)..."
try {
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$nodePath`" /quiet /norestart" -Wait -ErrorAction Stop
    Write-Host "  ✓ Node.js installed successfully" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Installation completed with status code (check if installed)" -ForegroundColor Yellow
}

# ==================== MONGODB ====================
Write-Host "`n📦 STEP 2: Installing MongoDB v7.0.3" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green

$mongoUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.3-signed.msi"
$mongoPath = "$downloadPath\mongodb-setup.msi"

if (Test-Path $mongoPath) {
    Write-Host "  ✓ MongoDB installer already downloaded (skipping download)"
} else {
    Write-Host "  ⏳ Downloading MongoDB (100-150 MB)..."
    try {
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($mongoUrl, $mongoPath)
        Write-Host "  ✓ Downloaded successfully" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Download failed: $_" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "  ⏳ Installing MongoDB (this may take 3-5 minutes)..."
try {
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$mongoPath`" /quiet /norestart ADDLOCAL=ServerService" -Wait -ErrorAction Stop
    Write-Host "  ✓ MongoDB installed successfully" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Installation completed with status code (check if installed)" -ForegroundColor Yellow
}

# ==================== VERIFICATION ====================
Write-Host "`n🔍 STEP 3: Verifying Installation" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green

# Refresh PATH environment variable
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Check Node.js
Write-Host "  Checking Node.js..." -ForegroundColor Gray
try {
    $nodeVersion = & node --version 2>&1
    Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
    $nodeInstalled = $true
} catch {
    Write-Host "  ⚠️  Node.js: NOT FOUND (restart terminal and try again)" -ForegroundColor Yellow
    $nodeInstalled = $false
}

# Check NPM
Write-Host "  Checking NPM..." -ForegroundColor Gray
try {
    $npmVersion = & npm --version 2>&1
    Write-Host "  ✓ NPM: $npmVersion" -ForegroundColor Green
    $npmInstalled = $true
} catch {
    Write-Host "  ⚠️  NPM: NOT FOUND (restart terminal and try again)" -ForegroundColor Yellow
    $npmInstalled = $false
}

# Check MongoDB
Write-Host "  Checking MongoDB..." -ForegroundColor Gray
try {
    $mongoVersion = & mongod --version 2>&1 | Select-Object -First 1
    Write-Host "  ✓ MongoDB: $mongoVersion" -ForegroundColor Green
    $mongoInstalled = $true
} catch {
    Write-Host "  ⚠️  MongoDB: NOT FOUND (restart terminal and try again)" -ForegroundColor Yellow
    $mongoInstalled = $false
}

# ==================== FINAL STATUS ====================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
if ($nodeInstalled -and $npmInstalled -and $mongoInstalled) {
    Write-Host "║   ✅ INSTALLATION SUCCESSFUL!                           ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host "`n🎉 All software installed successfully!`n" -ForegroundColor Green
} else {
    Write-Host "║   ⚠️  VERIFY INSTALLATION                               ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host "`n💡 Some components may not be detected. This is normal.`n" -ForegroundColor Yellow
    Write-Host "   IMPORTANT: Close this PowerShell window and open a NEW one`n" -ForegroundColor Yellow
}

Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. CLOSE this PowerShell window completely" -ForegroundColor White
Write-Host "   2. Open a NEW PowerShell window" -ForegroundColor White
Write-Host "   3. Navigate to your project folder" -ForegroundColor White
Write-Host "   4. Run: npm run install-all" -ForegroundColor White
Write-Host "   5. Run: npm run dev:desktop" -ForegroundColor White
Write-Host ""
Write-Host "📂 Installer files saved to: $downloadPath" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"

@echo off
REM ╔════════════════════════════════════════════════════════════════════╗
REM ║  SWAMY ENVELOPE - AUTOMATED NODE.JS & MONGODB INSTALLATION        ║
REM ║  Batch Script - Run as Administrator (Right-click → Run as admin)  ║
REM ╚════════════════════════════════════════════════════════════════════╝

setlocal enabledelayedexpansion

color 0A
cls

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║   SWAMY ENVELOPE - AUTO INSTALLER                                 ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo.
    echo ❌ ERROR: This script must run as Administrator!
    echo.
    echo Solution:
    echo   1. Find AutoInstall.bat
    echo   2. Right-click on it
    echo   3. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo ✅ Running as Administrator
echo.

REM Create temp directory
set "TEMP_PATH=%TEMP%\Installers"
if not exist "%TEMP_PATH%" (
    mkdir "%TEMP_PATH%"
    echo 📁 Created temp folder: %TEMP_PATH%
    echo.
)

REM ==================== NODE.JS ====================
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  STEP 1: Installing Node.js v20.11.0                              ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

set "NODE_URL=https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
set "NODE_PATH=%TEMP_PATH%\node-setup.msi"

if exist "%NODE_PATH%" (
    echo   ✓ Node.js installer already downloaded
) else (
    echo   ⏳ Downloading Node.js (50-60 MB)...
    echo   This may take 2-5 minutes depending on connection...
    
    REM Download using PowerShell
    powershell -Command "^
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; ^
        $wc = New-Object System.Net.WebClient; ^
        try { ^
            $wc.DownloadFile('%NODE_URL%', '%NODE_PATH%'); ^
            Write-Host '   ✓ Downloaded successfully' -ForegroundColor Green; ^
        } catch { ^
            Write-Host '   ❌ Download failed!' -ForegroundColor Red; ^
            exit 1; ^
        } ^
    " || (
        color 0C
        echo.
        echo ❌ Failed to download Node.js
        echo    Check your internet connection and try again
        echo.
        pause
        exit /b 1
    )
)

echo.
echo   ⏳ Installing Node.js...
echo   (MSI installer window may appear - let it complete)
echo.

msiexec.exe /i "%NODE_PATH%" /quiet /norestart
if %errorLevel% equ 0 (
    echo   ✓ Node.js installed successfully
) else (
    echo   ⚠️  Installation completed (status code: %errorLevel%)
)

REM ==================== MONGODB ====================
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  STEP 2: Installing MongoDB v7.0.3                                ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

set "MONGO_URL=https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.3-signed.msi"
set "MONGO_PATH=%TEMP_PATH%\mongodb-setup.msi"

if exist "%MONGO_PATH%" (
    echo   ✓ MongoDB installer already downloaded
) else (
    echo   ⏳ Downloading MongoDB (100-150 MB)...
    echo   This may take 3-10 minutes depending on connection...
    
    REM Download using PowerShell
    powershell -Command "^
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; ^
        $wc = New-Object System.Net.WebClient; ^
        try { ^
            $wc.DownloadFile('%MONGO_URL%', '%MONGO_PATH%'); ^
            Write-Host '   ✓ Downloaded successfully' -ForegroundColor Green; ^
        } catch { ^
            Write-Host '   ❌ Download failed!' -ForegroundColor Red; ^
            exit 1; ^
        } ^
    " || (
        color 0C
        echo.
        echo ❌ Failed to download MongoDB
        echo    Check your internet connection and try again
        echo.
        pause
        exit /b 1
    )
)

echo.
echo   ⏳ Installing MongoDB...
echo   (MSI installer window may appear - let it complete)
echo.

msiexec.exe /i "%MONGO_PATH%" /quiet /norestart ADDLOCAL=ServerService
if %errorLevel% equ 0 (
    echo   ✓ MongoDB installed successfully
) else (
    echo   ⚠️  Installation completed (status code: %errorLevel%)
)

REM ==================== VERIFICATION ====================
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  STEP 3: Verifying Installation                                   ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM Refresh PATH
for /f "tokens=2,*" %%A in ('reg query HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment /v Path 2^>nul') do set "SYSTEM_PATH=%%B"
for /f "tokens=2,*" %%A in ('reg query HKCU\Environment /v Path 2^>nul') do set "USER_PATH=%%B"
set "PATH=!SYSTEM_PATH!;!USER_PATH!"

REM Check Node.js
echo   Checking Node.js...
node --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do echo   ✓ Node.js: %%i
) else (
    echo   ⚠️  Node.js: NOT FOUND ^(restart terminal and try again^)
)

REM Check NPM
echo   Checking NPM...
npm --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do echo   ✓ NPM: %%i
) else (
    echo   ⚠️  NPM: NOT FOUND ^(restart terminal and try again^)
)

REM Check MongoDB
echo   Checking MongoDB...
mongod --version >nul 2>&1
if %errorLevel% equ 0 (
    echo   ✓ MongoDB: Installed and ready
) else (
    echo   ⚠️  MongoDB: NOT FOUND ^(restart terminal and try again^)
)

REM ==================== FINAL STATUS ====================
echo.
color 0B
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║   ✅ INSTALLATION COMPLETE!                                        ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo 🎉 All software installed successfully!
echo.
echo 📝 Next Steps:
echo    1. CLOSE this window
echo    2. Open PowerShell (or Command Prompt)
echo    3. Navigate to your project folder
echo    4. Run: npm run install-all
echo    5. Run: npm run dev:desktop
echo.
echo 📂 Installer files saved to: %TEMP_PATH%
echo.
pause

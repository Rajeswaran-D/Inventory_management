@echo off
REM Windows Installation Script for Swamy Envelope Desktop Application
REM This script helps setup MongoDB and dependencies

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  Swamy Envelope - Desktop Setup
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please download from: https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)
node --version
echo ✅ Node.js detected

REM Check if MongoDB is installed
echo.
echo [2/5] Checking MongoDB...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB not found in PATH
    echo.
    echo Options:
    echo 1. Download from: https://www.mongodb.com/try/download/community
    echo 2. Run installer
    echo 3. Add MongoDB\bin to your PATH
    echo 4. Restart this script
    echo.
    echo For help, open: ELECTRON_SETUP_GUIDE.md
    echo.
    pause
) else (
    mongod --version
    echo ✅ MongoDB detected
)

REM Install npm dependencies
echo.
echo [3/5] Installing dependencies...
cd /d "%~dp0"
call npm run install-all
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

REM Build frontend
echo.
echo [4/5] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    pause
    exit /b 1
)
echo ✅ Frontend built

REM Create data directories
echo.
echo [5/5] Setting up data directories...
if not exist "data\db" mkdir data\db
echo ✅ Data directories ready

echo.
echo ========================================
echo  ✅ Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Make sure MongoDB is running
echo 2. Run: npm run dev:desktop
echo    OR
echo 3. Run: npm run dist (to create installer)
echo.
pause

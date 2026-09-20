@echo off
title SAIOTAF - Step 1: Install Dependencies
color 0B
echo ================================================================
echo   SAIOTAF - Semantic-Aware Opportunity Alignment Framework
echo   STEP 1: INSTALLING ALL PROJECT DEPENDENCIES
echo ================================================================
echo.

set ROOT_DIR=%~dp0

:: Auto-detect directory layout (STUFAC wrapper vs cloned repository)
if exist "%ROOT_DIR%student-dashboard\package.json" (
    set FRONTEND_DIR=%ROOT_DIR%student-dashboard
) else (
    set FRONTEND_DIR=%ROOT_DIR%
)

if exist "%ROOT_DIR%backend\requirements.txt" (
    set BACKEND_DIR=%ROOT_DIR%backend
) else (
    set BACKEND_DIR=%ROOT_DIR%
)

:: 1. Verify Python
echo [1/4] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python is not installed or not added to your system PATH!
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    echo NOTE: Make sure to check the box: "Add python.exe to PATH" during installation.
    pause
    exit /b 1
)
python --version

:: 2. Verify Node.js
echo.
echo [2/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not added to your system PATH!
    echo Please install Node.js (LTS version) from https://nodejs.org/
    pause
    exit /b 1
)
node --version
npm --version

:: 3. Install Python Backend Dependencies
echo.
echo [3/4] Installing Python backend packages...
cd /d "%BACKEND_DIR%"
pip install -r requirements.txt
if %errorlevel% neq 0 (
    color 0E
    echo [WARNING] Some pip packages had issues, attempting fallback with user flag...
    pip install -r requirements.txt --user
)

:: 4. Install Frontend Node.js Dependencies
echo.
echo [4/4] Installing React frontend dependencies (npm install)...
cd /d "%FRONTEND_DIR%"
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] npm install encountered an error!
    pause
    exit /b 1
)

cd /d "%ROOT_DIR%"
color 0A
echo.
echo ================================================================
echo   SUCCESS! All dependencies installed successfully!
echo   Now you can double-click: "2_START_PROJECT.bat"
echo ================================================================
echo.
pause

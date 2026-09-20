@echo off
setlocal enabledelayedexpansion
title SAIOTAF - Universal One-Click Project Runner
color 0B

echo ==============================================================================
echo    SAIOTAF: SEMANTIC-AWARE OPPORTUNITY ALIGNMENT PLATFORM
echo    AUTOMATED ONE-CLICK DEPLOYMENT & LOCAL RUNNER
echo ==============================================================================
echo.

set ROOT_DIR=%~dp0

:: 1. Auto-detect project structure
if exist "%ROOT_DIR%student-dashboard\package.json" (
    set FRONTEND_DIR=%ROOT_DIR%student-dashboard
) else (
    set FRONTEND_DIR=%ROOT_DIR%
)

if exist "%ROOT_DIR%backend\manage.py" (
    set BACKEND_DIR=%ROOT_DIR%backend
) else (
    set BACKEND_DIR=%ROOT_DIR%
)

:: 2. Ensure environment file exists
if not exist "%BACKEND_DIR%\.env" (
    if exist "%ROOT_DIR%\.env.example" (
        copy "%ROOT_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
        echo [INFO] Created .env configuration file from template.
    )
)

:: 3. Verify Python
echo [1/5] Checking Python environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python is not installed or not found in system PATH!
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    echo NOTE: Ensure you check "Add python.exe to PATH" during installation.
    pause
    exit /b 1
)
python --version

:: 4. Verify Node.js
echo.
echo [2/5] Checking Node.js environment...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not found in system PATH!
    echo Please install Node.js LTS from https://nodejs.org/
    pause
    exit /b 1
)
node --version
call npm --version

:: 5. Install Backend Python Dependencies & Run Migrations
echo.
echo [3/5] Setting up Backend dependencies & SQLite/MySQL database...
cd /d "%BACKEND_DIR%"
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [INFO] Retrying pip install with user flag...
    pip install -r requirements.txt --user --quiet
)

echo Applying database migrations...
python manage.py makemigrations --no-input >nul 2>&1
python manage.py migrate --run-syncdb >nul 2>&1

:: 6. Install Frontend Node Dependencies
echo.
echo [4/5] Checking React frontend dependencies (npm install)...
cd /d "%FRONTEND_DIR%"
if not exist "node_modules\" (
    echo Installing node modules (first time setup)...
    call npm install --legacy-peer-deps
) else (
    echo Node modules already installed.
)

:: 7. Launch Servers Concurrently
echo.
echo [5/5] Launching Backend & Frontend services...
echo.

:: Start Django Backend on Port 8000
start "SAIOTAF Django REST Backend (Port 8000)" cmd /k "cd /d "%BACKEND_DIR%" && title SAIOTAF Backend && color 0B && python manage.py runserver 8000"

:: Wait 2 seconds for backend to bind port
timeout /t 2 /nobreak >nul

:: Start React Vite Frontend on Port 5173
start "SAIOTAF React Frontend (Port 5173)" cmd /k "cd /d "%FRONTEND_DIR%" && title SAIOTAF Frontend && color 0D && npm run dev"

:: Wait 3 seconds and launch browser
timeout /t 3 /nobreak >nul
start http://localhost:5173

color 0A
echo ==============================================================================
echo    SUCCESS! SAIOTAF PLATFORM IS LIVE & RUNNING!
echo    - Frontend Application: http://localhost:5173
echo    - Backend REST API:     http://127.0.0.1:8000/api
echo.
echo    Keep both terminal windows open while using the application.
echo    To stop the platform, close both opened terminal windows.
echo ==============================================================================
echo.
pause

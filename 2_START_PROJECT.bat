@echo off
title SAIOTAF - Step 2: Start Application Servers
color 0A
echo ================================================================
echo   SAIOTAF - Semantic-Aware Opportunity Alignment Framework
echo   LAUNCHING BOTH BACKEND AND FRONTEND SERVERS...
echo ================================================================
echo.

set ROOT_DIR=%~dp0

:: Auto-detect directory layout (STUFAC wrapper vs cloned repository)
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

:: 1. Launch Backend Server (Django REST on Port 8000)
echo [1/2] Starting Django REST Backend on http://127.0.0.1:8000 ...
start "SAIOTAF Backend Server (Port 8000)" cmd /k "cd /d "%BACKEND_DIR%" && title SAIOTAF Backend && color 0B && python manage.py runserver 8000"

:: Wait 2 seconds for backend to bind port
timeout /t 2 /nobreak >nul

:: 2. Launch Frontend Server (Vite React on Port 5173)
echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "SAIOTAF Frontend Portal (Port 5173)" cmd /k "cd /d "%FRONTEND_DIR%" && title SAIOTAF Frontend && color 0D && npm run dev"

:: Wait 3 seconds then open browser
timeout /t 3 /nobreak >nul
echo.
echo Opening browser to http://localhost:5173 ...
start http://localhost:5173

echo.
echo ================================================================
echo   BOTH SERVERS ARE RUNNING!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://127.0.0.1:8000
echo.
echo   Keep both terminal windows open while using the application.
echo   To stop the application, simply close both command windows.
echo ================================================================
echo.
pause

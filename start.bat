@echo off
REM Script to start both backend and frontend servers on Windows
REM Usage: start.bat

echo Starting Inventory Management System...
echo.

REM Check if directories exist
if not exist "Ethernet-CRM-pr-executive-management" (
    echo Error: Ethernet-CRM-pr-executive-management directory not found
    pause
    exit /b 1
)

if not exist "inventory_module" (
    echo Error: inventory_module directory not found
    pause
    exit /b 1
)

echo Starting Backend Server...
cd Ethernet-CRM-pr-executive-management\server

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

REM Start backend in new window
start "Backend Server" cmd /k "npm start"

REM Wait a bit
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
cd ..\..\inventory_module

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

REM Start frontend in new window
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Backend: http://localhost:3000/api/v1
echo Frontend: http://localhost:5173
echo.
pause














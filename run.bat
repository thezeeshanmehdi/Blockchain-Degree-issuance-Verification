@echo off
title IQRA TrustLedger Launcher
echo ===================================================
echo   IQRA TrustLedger: Hybrid Blockchain System Launcher
echo ===================================================
echo.

:: Check for node_modules in backend
if not exist "backend\node_modules\" (
    echo [INFO] Backend node_modules not found. Installing dependencies...
    cd backend
    call npm install
    cd ..
) else (
    echo [INFO] Backend dependencies are already installed.
)

:: Check for node_modules in frontend
if not exist "frontend\node_modules\" (
    echo [INFO] Frontend node_modules not found. Installing dependencies...
    cd frontend
    call npm install
    cd ..
) else (
    echo [INFO] Frontend dependencies are already installed.
)

echo.
echo [INFO] Starting Backend Server (npm start)...
start "IQRA TrustLedger - Backend" cmd /k "cd backend && npm start"

echo [INFO] Starting Frontend Server (npm run dev)...
start "IQRA TrustLedger - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo [INFO] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo [INFO] Launching verification site in browser...
start http://localhost:5173

echo.
echo ===================================================
echo   Application started successfully!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo.
echo   Note: Please ensure MongoDB is running at:
echo         mongodb://localhost:27017
echo ===================================================
echo.
pause

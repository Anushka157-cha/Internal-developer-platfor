@echo off
echo ====================================
echo   Quick Setup - Fullstack IDP
echo ====================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed!
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    echo After installation:
    echo 1. Restart your computer
    echo 2. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo.
    echo Please start Docker Desktop and wait for it to be ready.
    echo Look for the Docker whale icon in your system tray.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

echo Starting PostgreSQL and Redis...
docker-compose up -d postgres redis

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Services started!
echo.
echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

echo.
echo ====================================
echo   Setup Complete!
echo ====================================
echo.
echo Next steps:
echo.
echo 1. Open a new terminal and run:
echo    cd backend
echo    npm run start:dev
echo.
echo 2. Open another terminal and run:
echo    cd frontend
echo    npm run dev
echo.
echo 3. Open your browser to: http://localhost:3000
echo.
echo To stop services:
echo    docker-compose down
echo.
pause

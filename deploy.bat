@echo off
REM Production Deployment Script for Windows
REM This script helps deploy the IDP Platform to production

echo ================================
echo IDP Platform - Production Deployment
echo ================================
echo.

REM Check if .env.production exists
if not exist .env.production (
    echo [ERROR] .env.production file not found!
    echo [INFO] Please create .env.production from .env.production.example
    echo.
    echo Steps:
    echo 1. copy .env.production.example .env.production
    echo 2. Edit .env.production with your production values
    echo 3. Run this script again
    exit /b 1
)

echo [OK] Found .env.production file
echo.

echo [INFO] Starting deployment...
echo.

REM Stop existing containers
echo [INFO] Stopping existing containers...
docker-compose down

REM Pull latest images
echo [INFO] Pulling latest base images...
docker-compose pull postgres redis

REM Build and start services
echo [INFO] Building and starting services...
docker-compose --env-file .env.production up -d --build

REM Wait for services to be ready
echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak > nul

REM Check if services are running
echo [INFO] Checking service health...
docker-compose ps

echo.
echo [SUCCESS] Deployment completed!
echo.
echo Service Status:
docker-compose ps
echo.
echo Next steps:
echo 1. Test the application
echo 2. Monitor logs: docker-compose logs -f
echo 3. Set up SSL/HTTPS if not already configured
echo 4. Configure domain DNS settings
echo 5. Set up monitoring and backups
echo.

pause

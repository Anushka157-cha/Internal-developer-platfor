# Quick Setup Script for Fullstack IDP
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "   Quick Setup - Fullstack IDP" -ForegroundColor Cyan  
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker is installed: $dockerVersion" -ForegroundColor Green
    } else {
        throw "Docker not found"
    }
} catch {
    Write-Host "[ERROR] Docker is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Docker Desktop from:" -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation:" -ForegroundColor Yellow
    Write-Host "1. Restart your computer" -ForegroundColor Yellow
    Write-Host "2. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if Docker is running
try {
    docker ps 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker is running" -ForegroundColor Green
    } else {
        throw "Docker not running"
    }
} catch {
    Write-Host "[ERROR] Docker is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop and wait for it to be ready." -ForegroundColor Yellow
    Write-Host "Look for the Docker whale icon in your system tray." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Starting PostgreSQL and Redis..." -ForegroundColor Yellow

docker-compose up -d postgres redis

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] Services started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "   Setup Complete!" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Open a new terminal and run:" -ForegroundColor White
    Write-Host "   cd backend" -ForegroundColor Cyan
    Write-Host "   npm run start:dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Open another terminal and run:" -ForegroundColor White
    Write-Host "   cd frontend" -ForegroundColor Cyan
    Write-Host "   npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Open your browser to: http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "To stop services:" -ForegroundColor Yellow
    Write-Host "   docker-compose down" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "[ERROR] Failed to start services" -ForegroundColor Red
    exit 1
}

Read-Host "Press Enter to exit"

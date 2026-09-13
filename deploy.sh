#!/bin/bash

# Production Deployment Script
# This script helps deploy the IDP Platform to production

set -e

echo "🚀 IDP Platform - Production Deployment"
echo "========================================"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "📝 Please create .env.production from .env.production.example"
    echo ""
    echo "Steps:"
    echo "1. cp .env.production.example .env.production"
    echo "2. Edit .env.production with your production values"
    echo "3. Run this script again"
    exit 1
fi

echo "✅ Found .env.production file"
echo ""

# Check if required environment variables are set
echo "🔍 Checking required environment variables..."

source .env.production

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" == "your-generated-jwt-secret-here" ]; then
    echo "❌ Error: JWT_SECRET not set properly in .env.production"
    exit 1
fi

if [ -z "$DATABASE_PASSWORD" ] || [ "$DATABASE_PASSWORD" == "your-strong-database-password-here" ]; then
    echo "❌ Error: DATABASE_PASSWORD not set properly in .env.production"
    exit 1
fi

if [ -z "$EMAIL_USER" ] || [ "$EMAIL_USER" == "apikey" ]; then
    echo "⚠️  Warning: EMAIL credentials not set properly"
    echo "Password reset emails will not work!"
fi

if [ -z "$FRONTEND_URL" ] || [ "$FRONTEND_URL" == "https://your-production-domain.com" ]; then
    echo "❌ Error: FRONTEND_URL not set properly in .env.production"
    exit 1
fi

echo "✅ All required environment variables are set"
echo ""

# Ask for confirmation
echo "📋 Deployment Summary:"
echo "   Frontend URL: $FRONTEND_URL"
echo "   Database Host: $DATABASE_HOST"
echo "   Email Service: $EMAIL_HOST"
echo "   Node Environment: $NODE_ENV"
echo ""

read -p "🤔 Do you want to proceed with deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "🔧 Starting deployment..."
echo ""

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Pull latest images
echo "📥 Pulling latest base images..."
docker-compose pull postgres redis

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose --env-file .env.production up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
else
    echo "❌ Error: Services failed to start"
    docker-compose logs
    exit 1
fi

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🌐 Your application should be accessible at:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend API: $FRONTEND_URL/api"
echo ""
echo "📝 Next steps:"
echo "   1. Test the application"
echo "   2. Monitor logs: docker-compose logs -f"
echo "   3. Set up SSL/HTTPS if not already configured"
echo "   4. Configure domain DNS settings"
echo "   5. Set up monitoring and backups"
echo ""

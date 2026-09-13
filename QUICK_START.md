# Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Docker Desktop** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **Node.js** (version 18+) - for local development only
- **Git**

## 🚀 Option 1: Docker Setup (Recommended)

This is the fastest way to get the entire platform running.

### Step 1: Clone or Navigate to Project
```bash
cd c:\Users\Anushka\OneDrive\Desktop\Fullstack
```

### Step 2: Create Environment File
Create a `.env` file in the `backend` directory:

```bash
cd backend
copy .env.example .env
```

The default values in `.env.example` are already configured for Docker.

### Step 3: Start All Services
```bash
cd ..
docker-compose up --build
```

This command will:
- Build the frontend and backend Docker images
- Start PostgreSQL database
- Start Redis for job queue
- Start the backend API server
- Start the frontend web server

### Step 4: Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001/api

### Step 5: Create Your First User

1. Navigate to http://localhost/signup
2. Fill in the form:
   - First Name: Your name
   - Last Name: Your last name
   - Email: your@email.com
   - Password: (minimum 6 characters)
   - Role: Select "Admin" for full access
3. Click "Create Account"

You'll be automatically logged in and redirected to the dashboard!

### Step 6: Explore Features

**Create a Service:**
1. Go to "Services" in the sidebar
2. Click "Add Service"
3. Fill in:
   - Name: `my-first-service`
   - Description: `My first test service`
   - Repository URL: `https://github.com/yourorg/repo`
   - Environment: `dev`
4. Click "Create Service"

**Trigger a Deployment:**
1. Click on your newly created service
2. Click the "Deploy" button
3. Watch the deployment progress in real-time
4. Deployment logs will appear as the process runs

**Create a Feature Flag:**
1. Go to "Feature Flags" in the sidebar
2. Click "Add Flag"
3. Fill in:
   - Flag Key: `new_feature`
   - Name: `New Feature`
   - Environments: Check "dev"
   - Rollout Percentage: 100
   - Enable immediately: Check
4. Click "Create Flag"

### Stopping Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

---

## 💻 Option 2: Local Development Setup

For development with hot-reload and better debugging.

### Step 1: Start Infrastructure Services

Start just the database and Redis:

```bash
docker-compose up postgres redis
```

### Step 2: Setup Backend

Open a new terminal:

```bash
cd backend
npm install
copy .env.example .env
```

Edit `.env` and update:
```env
DATABASE_HOST=localhost
REDIS_HOST=localhost
```

Start the backend:
```bash
npm run start:dev
```

Backend will run on http://localhost:3001

### Step 3: Setup Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on http://localhost:3000

---

## 🔧 Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
# Database
DATABASE_HOST=localhost          # or 'postgres' for Docker
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=idp_db

# Redis
REDIS_HOST=localhost            # or 'redis' for Docker
REDIS_PORT=6379

# JWT
JWT_SECRET=change-this-in-production-to-a-long-random-string
JWT_EXPIRATION=7d

# Server
PORT=3001
NODE_ENV=development
```

### Frontend Configuration

The frontend uses Vite's proxy configuration (already set up in `vite.config.ts`):
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
}
```

---

## 📊 Database Management

### Access PostgreSQL

**Using Docker:**
```bash
docker exec -it idp-postgres psql -U postgres -d idp_db
```

**Useful Commands:**
```sql
-- List all tables
\dt

-- Describe table structure
\d users

-- View users
SELECT * FROM users;

-- View services
SELECT * FROM services;
```

### Reset Database

**Warning: This will delete all data!**

```bash
# Stop containers
docker-compose down

# Remove volumes
docker volume rm fullstack_postgres_data

# Restart
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Port Already in Use

If you see "port already in use" errors:

**Option 1: Stop conflicting services**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Option 2: Change ports**

Edit `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "8080:80"  # Change from 80

backend:
  ports:
    - "3002:3001"  # Change from 3001
```

### Database Connection Issues

Check if PostgreSQL is running:
```bash
docker ps | findstr postgres
```

Check backend logs:
```bash
docker-compose logs backend
```

### Build Failures

Clean build:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### TypeScript Errors

Re-install dependencies:
```bash
cd backend  # or frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🧪 Testing the System

### 1. Test Authentication
```bash
# Signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "developer"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Test Service Creation

Get your token from signup/login response, then:

```bash
curl -X POST http://localhost:3001/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "api-service",
    "description": "Test service",
    "repositoryUrl": "https://github.com/test/repo",
    "environment": "dev"
  }'
```

### 3. Test Deployment

```bash
curl -X POST http://localhost:3001/api/deployments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "serviceId": "YOUR_SERVICE_ID",
    "version": "1.0.0"
  }'
```

---

## 📚 Next Steps

1. **Read the Documentation**
   - [README.md](README.md) - Complete overview
   - [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
   - [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) - Architecture deep dive

2. **Explore the Code**
   - Backend: `backend/src/modules/`
   - Frontend: `frontend/src/pages/`

3. **Customize**
   - Modify UI colors in `frontend/tailwind.config.js`
   - Add new features in their own modules
   - Extend the database schema

4. **Deploy to Production**
   - Set up a proper domain
   - Enable HTTPS with Let's Encrypt
   - Use managed database (AWS RDS, etc.)
   - Set up monitoring (Datadog, New Relic, etc.)

---

## 🆘 Getting Help

- Check logs: `docker-compose logs -f`
- Verify services are running: `docker-compose ps`
- Review documentation in this repository
- Check that all ports are available

---

## 📝 Development Workflow

### Making Changes

**Backend:**
1. Edit files in `backend/src/`
2. NestJS will auto-reload (in dev mode)
3. Test at http://localhost:3001/api

**Frontend:**
1. Edit files in `frontend/src/`
2. Vite will hot-reload automatically
3. View at http://localhost:3000

### Adding a New Feature

**Backend Example - New Endpoint:**
```bash
cd backend/src/modules/your-module
# Create controller, service, entity, DTOs
# Add to module imports
```

**Frontend Example - New Page:**
```bash
cd frontend/src/pages
# Create new page component
# Add route in App.tsx
```

---

## 🎉 Success!

You now have a fully functional Internal Developer Platform running locally!

Try creating services, triggering deployments, managing feature flags, and viewing logs and audit trails.

**Happy Building! 🚀**

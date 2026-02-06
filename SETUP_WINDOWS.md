# Windows Setup Guide - Fix Runtime Errors

## Current Issues
1. **Redis Connection Error** - Backend cannot connect to Redis (required for deployments)
2. **Port Conflict** - Port 3001 is already in use

## Solution 1: Install Docker Desktop (Recommended)

### Step 1: Install Docker Desktop
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Run the installer
3. Restart your computer after installation
4. Open Docker Desktop and wait for it to start

### Step 2: Start Required Services
Open PowerShell in the project root and run:
```powershell
cd "c:\Users\Anushka\OneDrive\Desktop\Fullstack"
docker-compose up -d postgres redis
```

This starts only PostgreSQL and Redis, allowing you to run the backend and frontend locally with hot-reload.

### Step 3: Start the Application
```powershell
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

---

## Solution 2: Install Services Manually (Without Docker)

### Install PostgreSQL

1. **Download PostgreSQL**
   - Go to: https://www.postgresql.org/download/windows/
   - Download version 15 or later
   - Run the installer
   - Set password: `postgres`
   - Port: `5432`
   - Remember to check "Launch Stack Builder" at the end

2. **Create Database**
   ```powershell
   # Open Command Prompt as Administrator
   psql -U postgres
   # Enter password: postgres
   
   CREATE DATABASE idp_db;
   \q
   ```

### Install Redis

1. **Download Redis for Windows**
   - Go to: https://github.com/microsoftarchive/redis/releases
   - Download `Redis-x64-3.2.100.msi` or latest version
   - Run installer with default settings
   
2. **Verify Redis is Running**
   ```powershell
   redis-cli ping
   # Should return: PONG
   ```
   
   If not running, start it:
   ```powershell
   redis-server
   ```

### Start the Application
```powershell
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend  
npm run dev
```

---

## Solution 3: Quick Fix - Disable Background Jobs (Development Only)

If you just want to get the app running quickly without deployments:

### Modify app.module.ts
Comment out BullMQ configuration:

```typescript
// BullMQ for background jobs
/* TEMPORARILY DISABLED - Uncomment when Redis is available
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    connection: {
      host: configService.get('REDIS_HOST') || 'localhost',
      port: configService.get('REDIS_PORT') || 6379,
    },
  }),
  inject: [ConfigService],
}),
*/
```

### Modify deployments.module.ts  
Comment out BullMQ queue:

```typescript
imports: [
  TypeOrmModule.forFeature([Deployment]),
  /* TEMPORARILY DISABLED
  BullModule.registerQueue({
    name: 'deployments',
  }),
  */
  ServicesModule,
  LogsModule,
  AuditModule,
],
```

**Note:** This will disable deployment functionality but allow the rest of the app to run.

---

## Fixing Port Conflicts

### Check what's using port 3001:
```powershell
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess
```

### Kill the process:
```powershell
Stop-Process -Id <PROCESS_ID> -Force
```

Or use a different port by editing `backend/.env`:
```env
PORT=3002
```

And update `frontend/vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3002',  // Changed from 3001
    changeOrigin: true,
  },
}
```

---

## Recommended Approach

**For full functionality**: Use Solution 1 (Docker Desktop)
**For quick testing**: Use Solution 3 (Disable Redis temporarily)
**For production-like setup**: Use Solution 2 (Manual installation)

## Verification

Once everything is set up, verify services are running:

```powershell
# Check PostgreSQL
psql -U postgres -c "SELECT version();"

# Check Redis
redis-cli ping

# Check Backend
curl http://localhost:3001/api

# Check Frontend
# Open browser to http://localhost:3000
```

## Still Having Issues?

1. Make sure no other services are using ports 3000, 3001, 5432, or 6379
2. Check firewall settings aren't blocking the ports
3. Restart your computer after installing Docker Desktop
4. Check backend logs for specific error messages

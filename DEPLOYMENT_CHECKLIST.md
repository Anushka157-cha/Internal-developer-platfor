# Production Deployment Checklist

## ❌ Current Status: NOT READY FOR PRODUCTION

### Critical Issues to Fix Before Deployment

## 1. 🔐 Security (CRITICAL)

### Backend `.env` - Change These Immediately:
```env
# ❌ WEAK - Must change
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# ❌ WEAK - Must change  
DATABASE_PASSWORD=postgres

# ❌ PLACEHOLDER - Must add real credentials
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### What to Do:
```bash
# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update backend/.env:
JWT_SECRET=<generated-secret>
DATABASE_PASSWORD=<strong-password>
EMAIL_USER=<your-real-email>
EMAIL_PASSWORD=<your-app-password>
```

## 2. 🌐 Environment URLs (CRITICAL)

### Update Frontend URL:
```env
# In backend/.env and docker-compose.yml
FRONTEND_URL=https://your-production-domain.com
```

### Frontend API URL:
Currently using `/api` (proxy-based). For production:
- Keep as is if using reverse proxy (recommended)
- Or update to full backend URL in production build

## 3. 📧 Email Configuration (REQUIRED)

### For Production, Use Professional Service:
- ❌ Don't use personal Gmail in production
- ✅ Use: SendGrid, AWS SES, Mailgun, or Postmark

### Example (AWS SES):
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=<AWS-SES-SMTP-USERNAME>
EMAIL_PASSWORD=<AWS-SES-SMTP-PASSWORD>
```

## 4. 🗄️ Database (CRITICAL)

### Current Setup (docker-compose.yml):
```yaml
DATABASE_PASSWORD: postgres  # ❌ WEAK
```

### Production Changes:
```yaml
# Use strong password
DATABASE_PASSWORD: ${DATABASE_PASSWORD}  # From environment

# Add persistent volume backup strategy
# Use managed database service (AWS RDS, Azure Database, etc.)
```

## 5. 🐳 Docker Compose Updates

### Update docker-compose.yml for production:

```yaml
backend:
  environment:
    NODE_ENV: production
    JWT_SECRET: ${JWT_SECRET}  # From environment variables
    DATABASE_PASSWORD: ${DATABASE_PASSWORD}
    EMAIL_USER: ${EMAIL_USER}
    EMAIL_PASSWORD: ${EMAIL_PASSWORD}
    FRONTEND_URL: ${FRONTEND_URL}
```

### Don't hardcode secrets in docker-compose.yml!

## 6. 🔒 CORS Configuration

Check backend CORS settings allow your production domain:
```typescript
// backend/src/main.ts
app.enableCors({
  origin: ['https://your-production-domain.com'],
  credentials: true,
});
```

## 7. 📦 Build Verification

### Test production builds locally:
```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend  
cd frontend
npm run build
npm run preview
```

## 8. 🚀 Deployment Steps

### Option A: Docker Compose (Single Server)

1. **Create `.env.production` file** with real values
2. **Update docker-compose.yml** to use environment variables
3. **Deploy:**
   ```bash
   docker-compose --env-file .env.production up -d
   ```

### Option B: Cloud Deployment (Recommended)

#### Backend (Node.js):
- **Vercel** / **Railway** / **Render** / **AWS ECS** / **Azure App Service**
- Set environment variables in platform dashboard
- Connect GitHub for auto-deploy

#### Frontend (React):
- **Vercel** / **Netlify** / **AWS S3+CloudFront** / **Azure Static Web Apps**
- Set build command: `npm run build`
- Set output directory: `dist`

#### Database:
- **AWS RDS** / **Azure Database** / **Railway** / **Supabase**
- Get connection string and update `DATABASE_*` env vars

#### Redis:
- **Redis Labs** / **AWS ElastiCache** / **Azure Cache for Redis**
- Get connection URL and update `REDIS_*` env vars

## 9. ✅ Pre-Deployment Checklist

- [ ] Strong JWT_SECRET generated and set
- [ ] Strong DATABASE_PASSWORD set
- [ ] Real EMAIL credentials configured (professional service)
- [ ] FRONTEND_URL updated to production domain
- [ ] All `.env` secrets stored securely (not in Git)
- [ ] CORS configured for production domain
- [ ] Database backups configured
- [ ] SSL/HTTPS certificates setup
- [ ] Environment variables set in hosting platform
- [ ] Logs monitoring configured
- [ ] Health check endpoints working
- [ ] Rate limiting enabled (if needed)
- [ ] Error tracking setup (Sentry, LogRocket, etc.)

## 10. 🔍 Post-Deployment Verification

```bash
# Test backend health
curl https://api.your-domain.com/health

# Test frontend
curl https://your-domain.com

# Test authentication flow
# - Login
# - Signup
# - Forgot password email
# - Reset password

# Monitor logs
docker-compose logs -f backend
```

## Quick Start for Production

### 1. Generate Secrets:
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Database Password
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Create `.env.production`:
```env
# Backend
JWT_SECRET=<generated-64-char-hex>
DATABASE_HOST=<your-db-host>
DATABASE_PASSWORD=<strong-password>
EMAIL_USER=<production-email>
EMAIL_PASSWORD=<smtp-password>
FRONTEND_URL=https://your-domain.com
NODE_ENV=production
```

### 3. Update docker-compose.yml:
```bash
# Replace hardcoded values with ${VARIABLE_NAME}
```

### 4. Deploy:
```bash
docker-compose --env-file .env.production up -d
```

## Security Best Practices

1. **Never commit `.env` files** (already in `.gitignore` ✅)
2. **Use environment variables** in CI/CD
3. **Rotate secrets regularly** (JWT, DB passwords)
4. **Enable HTTPS only** in production
5. **Set secure cookie flags** for auth tokens
6. **Add rate limiting** to auth endpoints
7. **Enable database encryption** at rest
8. **Use managed services** for DB, Redis, Email
9. **Set up monitoring** and alerting
10. **Regular security audits** and dependency updates

## Current Risk Level: 🔴 HIGH

**Do NOT deploy to production with current configuration!**

### Must Fix:
- Weak JWT secret
- Weak database password  
- Placeholder email credentials
- Hardcoded secrets in docker-compose.yml

### Recommended Timeline:
1. **Now**: Fix security issues (30 mins)
2. **Next**: Setup production email service (1 hour)
3. **Then**: Choose hosting platform and deploy (2-3 hours)
4. **Finally**: Testing and monitoring (ongoing)

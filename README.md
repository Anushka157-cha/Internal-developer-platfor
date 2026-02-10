# Internal Developer Platform (IDP)

A production-grade Internal Developer Platform built with modern technologies, designed for engineering teams to manage services, deployments, feature flags, and system observability.

# Internal Developer Platform (IDP)

## 🚀 Live Demo
- **Application:** https://frontend-eight-lilac-25.vercel.app
- **API:** https://idp-backend-nnzb.onrender.com/api/health

## Tech Stack
- **Frontend:** React + Vite + TypeScript + TailwindCSS (Deployed on Vercel)
- **Backend:** NestJS + PostgreSQL + Redis (Deployed on Render.com)


## 🏗️ Architecture Overview

The IDP follows a modular, microservices-inspired architecture:

```
┌─────────────────┐
│   React Frontend │  ← User Interface Layer
└────────┬────────┘
         │ HTTP/REST
┌────────▼────────┐
│   NestJS Backend │  ← API & Business Logic
└────────┬────────┘
         │
    ┌────┴─────┬───────────┬──────────┐
    │          │           │          │
┌───▼───┐  ┌──▼──┐   ┌────▼────┐ ┌──▼──┐
│ PostgreSQL│  │ Redis │   │ BullMQ  │ │ TypeORM│
│  Database │  │ Cache │   │  Jobs   │ │  ORM   │
└──────────┘  └─────┘   └─────────┘ └─────┘
```

### Key Components

1. **Frontend (React + TypeScript)**
   - Modern SPA with client-side routing
   - Role-based UI rendering
   - Real-time deployment monitoring
   - Responsive design with Tailwind CSS

2. **Backend (NestJS + TypeScript)**
   - Modular architecture with clear separation of concerns
   - JWT-based authentication
   - Role-Based Access Control (RBAC)
   - Async job processing with BullMQ
   - RESTful API design

3. **Database (PostgreSQL)**
   - Relational data model
   - TypeORM for migrations and queries
   - Normalized schema design

4. **Job Queue (Redis + BullMQ)**
   - Async deployment simulation
   - Background task processing
   - Job progress tracking

## 🚀 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Backend
- **NestJS** - Node.js framework
- **TypeScript** - Type safety
- **TypeORM** - ORM and migrations
- **Passport.js** - Authentication
- **JWT** - Token-based auth
- **Bcrypt** - Password hashing
- **Class Validator** - DTO validation
- **BullMQ** - Job queue

### Infrastructure
- **PostgreSQL** - Primary database
- **Redis** - Cache and job queue
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy (frontend)

## 📁 Project Structure

```
Fullstack/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # Authentication & JWT
│   │   │   ├── users/         # User management
│   │   │   ├── services/      # Service registry
│   │   │   ├── deployments/   # Deployment engine
│   │   │   ├── feature-flags/ # Feature flag system
│   │   │   ├── logs/          # System logs
│   │   │   └── audit/         # Audit trail
│   │   ├── common/
│   │   │   ├── decorators/    # Custom decorators
│   │   │   ├── guards/        # Auth guards
│   │   │   └── enums/         # Shared enums
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── contexts/          # React contexts
│   │   ├── pages/            # Page components
│   │   │   ├── auth/
│   │   │   ├── services/
│   │   │   ├── feature-flags/
│   │   │   ├── logs/
│   │   │   └── audit/
│   │   ├── lib/              # Utilities
│   │   ├── types/            # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
│
└── docker-compose.yml
```

## 🗄️ Database Schema

### Users Table
```sql
users (
  id: UUID PRIMARY KEY,
  email: VARCHAR UNIQUE,
  password: VARCHAR (hashed),
  first_name: VARCHAR,
  last_name: VARCHAR,
  role: ENUM('admin', 'developer', 'viewer'),
  is_active: BOOLEAN,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### Services Table
```sql
services (
  id: UUID PRIMARY KEY,
  name: VARCHAR,
  description: TEXT,
  repository_url: VARCHAR,
  environment: ENUM('dev', 'staging', 'prod'),
  health_status: ENUM('healthy', 'degraded', 'down'),
  version: VARCHAR,
  owner_id: UUID FOREIGN KEY → users(id),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### Deployments Table
```sql
deployments (
  id: UUID PRIMARY KEY,
  service_id: UUID FOREIGN KEY → services(id),
  status: ENUM('pending', 'running', 'success', 'failed'),
  version: VARCHAR,
  commit_hash: VARCHAR,
  logs: TEXT,
  triggered_by_id: UUID FOREIGN KEY → users(id),
  started_at: TIMESTAMP,
  completed_at: TIMESTAMP,
  duration_seconds: INTEGER,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### Feature Flags Table
```sql
feature_flags (
  id: UUID PRIMARY KEY,
  key: VARCHAR UNIQUE,
  name: VARCHAR,
  description: TEXT,
  enabled: BOOLEAN,
  environments: ARRAY,
  rollout_percentage: INTEGER,
  metadata: JSONB,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### Logs Table
```sql
logs (
  id: UUID PRIMARY KEY,
  service_id: UUID FOREIGN KEY → services(id),
  level: ENUM('debug', 'info', 'warn', 'error'),
  message: TEXT,
  metadata: JSONB,
  created_at: TIMESTAMP
)
```

### Audit Logs Table
```sql
audit_logs (
  id: UUID PRIMARY KEY,
  action: VARCHAR,
  actor_id: UUID FOREIGN KEY → users(id),
  metadata: JSONB,
  ip_address: INET,
  user_agent: VARCHAR,
  created_at: TIMESTAMP
)
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/:id` - Get user by ID

### Services
- `POST /api/services` - Create service (Admin/Developer)
- `GET /api/services` - List all services
- `GET /api/services/:id` - Get service details
- `PATCH /api/services/:id` - Update service (Admin/Developer)
- `DELETE /api/services/:id` - Delete service (Admin/Developer)

### Deployments
- `POST /api/deployments` - Trigger deployment (Admin/Developer)
- `GET /api/deployments` - List deployments
- `GET /api/deployments/:id` - Get deployment details

### Feature Flags
- `POST /api/feature-flags` - Create flag (Admin/Developer)
- `GET /api/feature-flags` - List all flags
- `GET /api/feature-flags/:id` - Get flag details
- `PATCH /api/feature-flags/:id` - Update flag (Admin/Developer)
- `POST /api/feature-flags/:id/toggle` - Toggle flag (Admin/Developer)
- `DELETE /api/feature-flags/:id` - Delete flag (Admin)
- `POST /api/feature-flags/evaluate` - Evaluate flag for user

### Logs
- `POST /api/logs` - Create log entry
- `GET /api/logs` - List logs (with filters)

### Audit
- `GET /api/audit` - List audit logs (Admin/Developer)
- `GET /api/audit/by-actor` - Logs by user (Admin)
- `GET /api/audit/by-action` - Logs by action (Admin/Developer)

## 🎯 Core Features

### 1. Authentication & RBAC
- JWT-based authentication with secure password hashing
- Three roles with hierarchical permissions:
  - **Admin**: Full system access
  - **Developer**: Can create/manage services, deploy, manage flags
  - **Viewer**: Read-only access
- Protected API endpoints with role-based guards
- Frontend route protection and conditional UI rendering

### 2. Service Registry
- Register backend services with metadata
- Track service health status
- Environment-based organization (dev/staging/prod)
- Git repository integration
- Version tracking
- Owner assignment

### 3. Deployment Simulation Engine
- Async deployment processing using BullMQ
- Real-time deployment status tracking
- Simulated deployment steps with progress
- Deployment history per service
- Auto-generated deployment logs
- Health status updates post-deployment
- 90% success rate simulation

### 4. Feature Flag Management
- Create and manage feature flags
- Instant enable/disable toggle
- Percentage-based gradual rollout (0-100%)
- Environment-specific flags
- Hash-based deterministic user evaluation
- Flag evaluation API for runtime checks

### 5. Logs & Audit System
- Centralized log collection
- Four log levels: debug, info, warn, error
- Service-specific log filtering
- Comprehensive audit trail for all actions:
  - User authentication
  - Service CRUD operations
  - Deployment triggers
  - Feature flag changes
- Actor tracking with timestamps
- Metadata storage for detailed context

## 🚢 Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development)
- Redis 7+ (for local development)

### Quick Start with Docker

1. **Clone and navigate to project**
```bash
cd Fullstack
```

2. **Create environment files**

Backend (.env):
```env
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=idp_db
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d
PORT=3001
NODE_ENV=production
```

3. **Start all services**
```bash
docker-compose up --build
```

4. **Access the application**
- Frontend: http://localhost
- Backend API: http://localhost:3001/api

5. **Create your first admin user**
- Navigate to http://localhost/signup
- Register with role "admin"

### Local Development Setup

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Update .env with local database credentials
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuration

### Environment Variables

#### Backend
- `DATABASE_HOST` - PostgreSQL host
- `DATABASE_PORT` - PostgreSQL port
- `DATABASE_USERNAME` - Database user
- `DATABASE_PASSWORD` - Database password
- `DATABASE_NAME` - Database name
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRATION` - Token expiration time
- `PORT` - Backend server port
- `NODE_ENV` - Environment (development/production)

## 🎨 Design Decisions & Trade-offs

### 1. Monorepo Structure
**Decision**: Keep frontend and backend in same repo
**Rationale**: Simplified development and deployment for internal tool
**Trade-off**: Could split for independent scaling in future

### 2. Synchronous vs Async Deployments
**Decision**: Use BullMQ for async deployment processing
**Rationale**: Deployments can be long-running, need non-blocking API
**Trade-off**: Requires Redis infrastructure, more complexity

### 3. Feature Flag Evaluation Strategy
**Decision**: Hash-based deterministic rollout
**Rationale**: Same user always gets same result, no state needed
**Trade-off**: Can't target specific users without additional logic

### 4. TypeORM with `synchronize: true`
**Decision**: Auto-sync schema in development
**Rationale**: Rapid iteration during development
**Trade-off**: MUST set to `false` in production, use migrations

### 5. JWT Storage in localStorage
**Decision**: Store tokens in localStorage
**Rationale**: Simple, works across tabs, no HTTP-only cookie complexity
**Trade-off**: Vulnerable to XSS (mitigated by CSP headers in production)

### 6. Polling for Deployment Status
**Decision**: Poll every 3 seconds for deployment updates
**Rationale**: Simpler than WebSockets for MVP
**Trade-off**: Not real-time, uses more bandwidth

### 7. Audit Logs vs Application Logs
**Decision**: Separate tables and modules
**Rationale**: Different query patterns and retention policies
**Trade-off**: More tables to manage

### 8. Role-Based Permissions
**Decision**: Three fixed roles with hierarchical permissions
**Rationale**: Simple model sufficient for internal tool
**Trade-off**: Less flexible than permission-based system

## 📈 Scalability Improvements

### Short Term (Current → 10K users)
1. **Add Caching Layer**
   - Redis caching for frequently accessed data
   - Cache service lists, feature flags
   - TTL-based invalidation

2. **Database Indexing**
   - Add indexes on foreign keys
   - Index commonly queried fields (email, serviceId, etc.)
   - Composite indexes for complex queries

3. **API Rate Limiting**
   - Implement rate limiting per user/IP
   - Prevent abuse and DoS

### Medium Term (10K → 100K users)
1. **Database Read Replicas**
   - Add PostgreSQL read replicas
   - Route read queries to replicas
   - Master for writes only

2. **Horizontal Scaling**
   - Run multiple backend instances
   - Load balancer (Nginx/HAProxy)
   - Stateless backend design enables this

3. **CDN for Frontend**
   - CloudFront/Cloudflare for static assets
   - Reduce latency globally

4. **Separate Job Queue Workers**
   - Dedicated workers for BullMQ
   - Scale workers independently
   - Different worker pools for different job types

### Long Term (100K+ users)
1. **Microservices Architecture**
   - Split into independent services:
     - Auth Service
     - Service Registry Service
     - Deployment Service
     - Feature Flag Service
   - Each with own database
   - Event-driven communication

2. **Event Streaming**
   - Kafka/RabbitMQ for events
   - Event sourcing for audit logs
   - CQRS pattern

3. **Advanced Observability**
   - Distributed tracing (Jaeger/Zipkin)
   - Metrics (Prometheus + Grafana)
   - Centralized logging (ELK stack)

4. **Database Sharding**
   - Shard by tenant/organization
   - Horizontal database scaling

5. **Multi-Region Deployment**
   - Deploy in multiple AWS regions
   - Geo-routing for latency reduction
   - Cross-region replication

## 🔒 Security Best Practices

### Implemented
- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Input validation with class-validator
- ✅ SQL injection prevention (TypeORM parameterized queries)
- ✅ CORS configuration
- ✅ HTTP security headers (Nginx)

### Recommended for Production
- [ ] HTTPS/TLS encryption
- [ ] Environment-specific secrets management (AWS Secrets Manager, Vault)
- [ ] API rate limiting
- [ ] Request logging and monitoring
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] CSP headers
- [ ] CSRF protection for stateful endpoints
- [ ] Helmet.js for additional headers

## 🧪 Testing Strategy (Future Implementation)

### Unit Tests
- Service methods
- Controller endpoints
- Utility functions
- Target: 80% coverage

### Integration Tests
- API endpoint flows
- Database operations
- Authentication flows
- Target: Critical paths covered

### E2E Tests
- User workflows
- Deployment simulation
- Feature flag evaluation
- Tools: Playwright/Cypress

## 📊 Monitoring & Observability

### Current
- Deployment logs
- System logs (4 levels)
- Audit trail

### Recommended Additions
1. **Application Performance Monitoring**
   - Response time tracking
   - Error rate monitoring
   - Database query performance

2. **Business Metrics**
   - Deployment success rate
   - Feature flag adoption rate
   - Active users per role

3. **Alerting**
   - Failed deployment alerts
   - Error spike detection
   - Database connection issues

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Run linters: `npm run lint`
4. Submit pull request
5. Code review required
6. Merge to `main`

### Code Standards
- TypeScript strict mode
- ESLint + Prettier configuration
- Conventional commits
- Descriptive variable/function names

## 📝 License

Internal use only. All rights reserved.

## 👥 Support

For issues or questions:
- Create GitHub issue
- Contact DevOps team
- Slack: #idp-support


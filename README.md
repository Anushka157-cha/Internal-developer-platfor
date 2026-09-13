# Internal Developer Platform (IDP) — Enterprise Production Edition

A production-grade, portfolio-level Internal Developer Platform (IDP) built with **React 18 + TypeScript**, **NestJS**, **PostgreSQL**, **Redis**, and **BullMQ**. Designed for engineering organizations to register microservices, orchestrate container deployments through asynchronous state-machine queues, manage cryptographically deterministic feature flags, inspect live terminal build logs via Server-Sent Events (SSE), and enforce strict Role-Based Access Control (RBAC).

---

## 🏛️ System Architecture

```
                               ┌────────────────────────────────────────┐
                               │       React 18 + Vite SPA Client        │
                               │  (TailwindCSS, React Query, Recharts)  │
                               └──────────────────┬─────────────────────┘
                                                  │ HTTP REST / SSE Stream
                                                  │ (/api/deployments/:id/stream)
                               ┌──────────────────▼─────────────────────┐
                               │           Nginx Reverse Proxy           │
                               │  (Proxy Buffering Off, Cache Bypass)   │
                               └──────────────────┬─────────────────────┘
                                                  │
                               ┌──────────────────▼─────────────────────┐
                               │         NestJS Backend API Layer       │
                               │ ┌────────────────────────────────────┐ │
                               │ │  Helmet, CORS, Rate Limit (Throttler│ │
                               │ │  JWT Auth Guard (15m Access Token) │ │
                               │ │  RBAC Guard (Admin, Dev, Viewer)   │ │
                               │ │  Centralized Exception Sanitizer   │ │
                               │ └────────────────────────────────────┘ │
                               └──────────┬─────────────────┬───────────┘
                                          │                 │
                Asynchronous Job Enqueue  │                 │ TypeORM Data Queries
             (Idempotency, Backoff, Retry)│                 │ (Strict Foreign Keys, Indexes)
                                          │                 │
                               ┌──────────▼──────────┐ ┌────▼─────────────────────┐
                               │    Redis + BullMQ   │ │   PostgreSQL Database    │
                               │   Queue Infrastructure│ │ (Fail-fast in Production)│
                               └──────────┬──────────┘ └──────────────────────────┘
                                          │
                               ┌──────────▼──────────┐
                               │ BullMQ Job Worker   │
                               │ ┌─────────────────┐ │
                               │ │ State Machine:  │ │
                               │ │ QUEUED          │ │
                               │ │ → BUILDING      │ │
                               │ │ → TESTING       │ │
                               │ │ → DEPLOYING     │ │
                               │ │ → HEALTH_CHECK  │ │  ──Real HTTP Probe──▶ Microservice
                               │ │ → SUCCESS/FAILED│ │
                               │ └─────────────────┘ │
                               └─────────────────────┘
```

---

## ✨ Core Production Capabilities

### 1. Fail-Fast PostgreSQL Database
- **Strict Production Requirement:** In production (`NODE_ENV=production`), the application strictly validates `DATABASE_URL` or `DATABASE_HOST`. If configuration is missing or unreachable, the service **fails fast immediately** rather than silently falling back.
- **Data Integrity:** PostgreSQL-compatible timestamp columns, composite indexes (`[serviceId, createdAt]`, `[actorId, createdAt]`), unique constraints, and foreign key cascades.
- **Local Dev / Test Mode:** Safe SQLite fallback (`better-sqlite3`) supported exclusively for local development and Jest test execution.

### 2. Enterprise Authentication & Security
- **Dual JWT Token Architecture:**
  - Short-lived 15-minute Access Tokens.
  - Long-lived 7-day Refresh Tokens, cryptographically hashed using SHA-256 in the database.
- **Token Rotation:** Every call to `POST /auth/refresh` rotates the refresh token and issues a new pair.
- **Server-Side Invalidation:** `POST /auth/logout` invalidates the stored refresh token hash, blocking replay attacks.
- **Brute-Force Rate Limiting:** Powered by `@nestjs/throttler` (strict 5 requests/minute threshold on login routes returning HTTP 429).
- **Security Headers & CORS:** Helmet security headers (`X-Frame-Options`, `Content-Security-Policy`, `X-Content-Type-Options`) and origin allowlist validation.
- **Sanitized Error Responses:** Centralized `AllExceptionsFilter` intercepts unhandled exceptions, logs internal stack traces securely on the server, and returns sanitized RFC-7807 JSON error envelopes to clients without leaking system internals.

### 3. API-Level Role-Based Access Control (RBAC)
Enforced at the NestJS controller and route level through custom `@Roles()` decorators and `RolesGuard`:

| Capability | Viewer | Developer | Admin |
| :--- | :---: | :---: | :---: |
| **Services — Read & Inspect** | ✅ | ✅ | ✅ |
| **Services — Register & Update** | ❌ | ✅ | ✅ |
| **Services — Delete** | ❌ | ❌ | ✅ |
| **Deployments — View & SSE Stream** | ✅ | ✅ | ✅ |
| **Deployments — Trigger & Rollback** | ❌ | ✅ | ✅ |
| **Feature Flags — Evaluate Target** | ✅ | ✅ | ✅ |
| **Feature Flags — Create & Modify** | ❌ | ✅ | ✅ |
| **Feature Flags — Delete** | ❌ | ❌ | ✅ |
| **Centralized System Logs — Read** | ✅ | ✅ | ✅ |
| **Security Audit Trail — Read** | ❌ | ✅ | ✅ |
| **User & Role Governance** | ❌ | ❌ | ✅ |

### 4. Service Registry with Real HTTP Health Probes
- **Live HTTP Probing:** `POST /services/:id/health-check` performs an actual HTTP request with timeout protection to the service's registered health endpoint.
- **Latency Measurement:** Measures response round-trip latency in milliseconds and records timestamps.
- **Health State Transitions:** Dynamically updates health status (`HEALTHY` `< 500ms`, `DEGRADED` `500-2000ms`, `DOWN` `> 2000ms` or network errors). Zero fake simulated health states.

### 5. BullMQ Redis Queue & Deployment State Machine
- **No `setTimeout()` Simulations:** All deployment jobs are dispatched to Redis via BullMQ (`deployments` queue).
- **State Machine Transitions:**
  $$\text{PENDING} \longrightarrow \text{QUEUED} \longrightarrow \text{BUILDING} \longrightarrow \text{TESTING} \longrightarrow \text{DEPLOYING} \longrightarrow \text{HEALTH\_CHECK} \longrightarrow \text{SUCCESS}$$
  $$\text{Any Active State} \longrightarrow \text{FAILED}$$
- **Job Configuration:** Unique idempotency job IDs (`deploy-{id}`), exponential backoff retry policies (3 attempts), and active deployment concurrency guards preventing conflicting deployments to the same service.
- **Real-Time SSE Streaming:** Emits live progress percentage, stage transitions, and stdout console logs via Server-Sent Events (`/api/deployments/:id/stream`). Nginx is tuned with `proxy_buffering off;` to ensure zero-latency streaming.

### 6. Forward-Deployment Rollback Engine
- When rolling back a service, the system identifies the previous stable (`SUCCESS`) immutable release.
- Creates a forward deployment record referencing `rollbackOfDeploymentId`, flags `isRollback: true`, enqueues the job through the BullMQ pipeline, updates traffic only upon health check verification, and records an immutable audit trail event.

### 7. Deterministic SHA-256 Feature Flags
- **Deterministic Assignment:** Replaces non-deterministic `Math.random()` with SHA-256 cryptographic hashing (`SHA256(flagKey + ":" + userId)` mapped to $[0, 100)$). The same user consistently receives the exact same variant across requests.
- **Multi-Dimensional Targeting:** Environment targeting (`dev`, `staging`, `prod`), user role targeting, country targeting, and scheduled expiration timestamps (`expiresAt`).
- **Comprehensive Reason Codes:** Emits deterministic decision reasons (`FLAG_DISABLED`, `ENVIRONMENT_MISMATCH`, `ROLE_NOT_TARGETED`, `FLAG_EXPIRED`, `PERCENTAGE_ROLLOUT_MATCH`).

### 8. Centralized Observability & Immutable Audit Trail
- **Zero-Mock Dashboard:** Real SQL aggregations for total deployments, success rates, average duration, 7-day velocity charts, and health distributions.
- **Central Logs:** Paginated search and filtering across service IDs, log levels (`debug`, `info`, `warn`, `error`), and date ranges.
- **Audit Trail:** Append-only immutable log recording administrative events (`USER_LOGIN`, `SERVICE_CREATED`, `DEPLOYMENT_TRIGGERED`, `ROLLBACK_TRIGGERED`, `FEATURE_FLAG_CREATED`, `USER_ROLE_UPDATED`).

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + Vite 5 + TypeScript
- **Styling:** TailwindCSS with modern dark platform console aesthetics
- **Routing:** React Router v6 with `React.lazy()` code-splitting
- **State Management & Caching:** TanStack React Query v5
- **Charts:** Recharts (responsive Area and Pie telemetry charts)
- **Streaming:** Server-Sent Events (`EventSource`)
- **HTTP Client:** Axios with transparent 401 refresh token interceptor

### Backend
- **Framework:** NestJS 10 + TypeScript
- **Database ORM:** TypeORM 0.3
- **Primary Database:** PostgreSQL (with SQLite for local dev/test)
- **Queue & Async Processing:** BullMQ 5 + Redis 7 (ioredis)
- **Authentication:** Passport-JWT + bcryptjs (pure JS, cross-platform)
- **Security:** Helmet, Throttler, Class-Validator, Custom AllExceptionsFilter
- **API Documentation:** OpenAPI 3.0 / Swagger UI (`/api/docs`)

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+ LTS
- npm 10+
- (Optional for full containerization) Docker & Docker Compose

### 1. Clone & Setup Environment
```bash
git clone https://github.com/your-username/idp-platform.git
cd idp-platform
```

Create `.env` in `backend/`:
```env
PORT=3001
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=idp_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=production-grade-jwt-secret-min-32-chars-long
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### 2. Install Dependencies & Build
```bash
# Backend
cd backend
npm install
npm run build

# Frontend
cd ../frontend
npm install
npm run build
```

### 3. Run Development Servers
```bash
# In terminal 1 (Backend API)
cd backend
npm run start:dev

# In terminal 2 (Frontend SPA)
cd frontend
npm run dev
```
Access the application at `http://localhost:5173`.  
Access interactive OpenAPI Swagger documentation at `http://localhost:3001/api/docs`.

---

## 🐳 Docker Deployment

The repository includes a complete multi-container setup configured with health checks, private networking, and optimized multi-stage container builds.

```bash
# Clean start with Docker Compose
docker compose down -v
docker compose up --build -d
```

### Services Started:
- **PostgreSQL 15:** Port `5432` with healthcheck (`pg_isready`)
- **Redis 7:** Port `6379` with healthcheck (`redis-cli ping`)
- **NestJS Backend:** Port `3001` (waits for Postgres and Redis health)
- **Frontend SPA (Nginx):** Port `80` (with unbuffered SSE proxying to `/api`)

---

## 🧪 Testing & Verification

The test suite covers unit tests, e2e controller contracts, rate limiting, and business lifecycle edge cases.

```bash
cd backend

# Run all test suites
npm test

# Run tests with code coverage report
npm run test:cov

# Run ESLint validation
npm run lint
```

### Test Suite Execution Results:
```
PASS src/common/guards/roles.guard.spec.ts
PASS test/app.e2e-spec.ts
PASS src/modules/logs/logs.service.spec.ts
PASS src/modules/audit/audit.service.spec.ts
PASS src/modules/dashboard/dashboard.service.spec.ts
PASS src/modules/feature-flags/feature-flags.service.spec.ts
PASS src/modules/services/services.service.spec.ts
PASS src/modules/deployments/deployments.service.spec.ts
PASS src/modules/auth/auth.service.spec.ts
PASS test/auth.e2e-spec.ts
PASS test/rate-limit.e2e-spec.ts

Test Suites: 11 passed, 11 total
Tests:       37 passed, 37 total
Snapshots:   0 total
Time:        12.36 s
Lint Status: 0 errors, 0 warnings
```

---

## 🔒 Security Best Practices

1. **No Hardcoded Credentials:** All secrets (JWT keys, DB passwords, Redis credentials) are loaded strictly through environment variables.
2. **Hashed Refresh Tokens:** Refresh tokens stored in the database are hashed with SHA-256 before persistence to prevent credential extraction from database backups.
3. **Safe Demo Evaluation:** For interview and evaluation purposes, the login page provides a controlled `demoLogin(role)` endpoint that provisions credentials in memory without exposing plain text passwords in public repositories.
4. **Brute Force Defense:** `@Throttle(5, 60)` strictly limits authentication endpoints to 5 attempts per minute per IP address.

---

## 📐 Trade-offs & Production Architectural Decisions

1. **BullMQ Worker Placement:** In high-throughput production, BullMQ workers should run as persistent background containers (e.g. AWS ECS, Google Cloud Run with CPU always allocated, or Kubernetes Pods) rather than ephemeral serverless platforms (like Vercel Serverless Functions) to prevent premature termination of multi-stage deployment steps.
2. **SSE vs WebSockets:** Server-Sent Events (SSE) were selected over full-duplex WebSockets because deployment log telemetry is strictly unidirectional (server to client). SSE operates natively over standard HTTP/HTTPS, avoids WebSocket handshake firewall blockers, and easily traverses Nginx with unbuffered chunked transfer encoding.
3. **Pure JS `bcryptjs` over native `bcrypt`:** Native C++ Node addons frequently fail compilation during cross-architecture Docker builds or on disparate operating systems (such as Windows with Node 24). `bcryptjs` guarantees 100% platform-agnostic portability while maintaining password hash compatibility.

---

## 📜 License
MIT License. Built for internal developer engineering productivity.

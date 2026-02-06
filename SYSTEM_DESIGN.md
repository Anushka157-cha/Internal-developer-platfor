# System Design Document: Internal Developer Platform

## Executive Summary

The Internal Developer Platform (IDP) is a centralized system designed to streamline service management, deployment orchestration, feature flag control, and system observability for engineering teams. Built with production-grade technologies, it provides a self-service portal for developers while maintaining enterprise-level security and auditability.

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer / CDN                    │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼──────┐            ┌──────▼──────┐
│   Frontend    │            │   Backend    │
│  (React SPA)  │◄──REST────►│   (NestJS)   │
└───────────────┘            └──────┬───────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼──────┐  ┌────▼────┐   ┌─────▼─────┐
            │  PostgreSQL   │  │  Redis   │   │  BullMQ   │
            │   Database    │  │  Cache   │   │  Workers  │
            └───────────────┘  └──────────┘   └───────────┘
```

### 1.2 Component Breakdown

#### Frontend Layer
- **Technology**: React 18 + TypeScript + Vite
- **Responsibilities**:
  - User interface rendering
  - Client-side routing
  - State management (React Query)
  - Authentication token management
  - Real-time UI updates via polling

#### API Layer
- **Technology**: NestJS + TypeScript
- **Responsibilities**:
  - Request validation
  - Business logic execution
  - Authentication & authorization
  - Database operations via TypeORM
  - Job queue management

#### Data Layer
- **PostgreSQL**: Primary data store
  - User accounts
  - Services registry
  - Deployment history
  - Feature flags
  - Logs and audit trail
  
- **Redis**: In-memory data store
  - BullMQ job queue
  - Session cache (future)
  - Rate limiting counters (future)

#### Background Processing
- **BullMQ**: Job queue system
  - Async deployment processing
  - Job retry logic
  - Progress tracking

---

## 2. Data Model

### 2.1 Entity Relationship Diagram

```
┌─────────┐
│  Users  │
└────┬────┘
     │
     ├──owns──────┐
     │            │
     ├──triggers──┤
     │            │
     ├──acts──────┤
     │            ▼
     │      ┌──────────┐       ┌──────────────┐
     │      │ Services │◄─has──┤  Deployments │
     │      └────┬─────┘       └──────┬───────┘
     │           │                    │
     │           └──logs──┐           │
     │                    ▼           ▼
     │              ┌──────────┐
     │              │   Logs   │
     │              └──────────┘
     │
     └──audits──► ┌──────────────┐
                  │  Audit Logs  │
                  └──────────────┘

┌────────────────┐
│ Feature Flags  │  (Independent)
└────────────────┘
```

### 2.2 Key Relationships

1. **User → Service**: One-to-Many (ownership)
2. **User → Deployment**: One-to-Many (triggered by)
3. **User → Audit Log**: One-to-Many (actor)
4. **Service → Deployment**: One-to-Many
5. **Service → Log**: One-to-Many

---

## 3. Security Model

### 3.1 Authentication Flow

```
┌────────┐                    ┌────────┐                    ┌──────────┐
│ Client │                    │  API   │                    │ Database │
└───┬────┘                    └───┬────┘                    └────┬─────┘
    │                             │                              │
    │ POST /auth/login            │                              │
    │ {email, password}           │                              │
    ├────────────────────────────►│                              │
    │                             │                              │
    │                             │ SELECT user WHERE email=?    │
    │                             ├─────────────────────────────►│
    │                             │                              │
    │                             │ User record                  │
    │                             │◄─────────────────────────────┤
    │                             │                              │
    │     bcrypt.compare()        │                              │
    │                             │                              │
    │     JWT.sign()              │                              │
    │                             │                              │
    │ {access_token, user}        │                              │
    │◄────────────────────────────┤                              │
    │                             │                              │
    │ Store token in localStorage │                              │
    │                             │                              │
```

### 3.2 Authorization Model

**Role Hierarchy:**
```
Admin
  ├─ All Developer permissions
  └─ User management
     Delete feature flags
     View all audit logs

Developer
  ├─ All Viewer permissions
  └─ Create/update/delete services (own only)
     Trigger deployments
     Create/update feature flags

Viewer
  └─ View services
     View deployments
     View feature flags
     View logs
```

### 3.3 API Protection

Every request passes through:
1. **JwtAuthGuard**: Validates token, extracts user
2. **RolesGuard**: Checks user role against required roles
3. **Controller**: Executes business logic

---

## 4. Deployment Simulation Engine

### 4.1 Deployment Flow

```
┌────────┐              ┌─────────┐              ┌─────────┐              ┌─────────┐
│ Trigger│              │   API   │              │  Queue  │              │ Worker  │
│ Deploy │              │         │              │         │              │         │
└───┬────┘              └────┬────┘              └────┬────┘              └────┬────┘
    │                        │                        │                        │
    │ POST /deployments      │                        │                        │
    ├───────────────────────►│                        │                        │
    │                        │                        │                        │
    │                        │ Create deployment      │                        │
    │                        │ (status: PENDING)      │                        │
    │                        │                        │                        │
    │                        │ Add job to queue       │                        │
    │                        ├───────────────────────►│                        │
    │                        │                        │                        │
    │ {deployment}           │                        │                        │
    │◄───────────────────────┤                        │                        │
    │                        │                        │                        │
    │                        │                        │ Pick job               │
    │                        │                        ├───────────────────────►│
    │                        │                        │                        │
    │                        │                        │                        │ Update: RUNNING
    │                        │                        │                        │
    │                        │                        │                        │ Step 1: Pull code
    │                        │                        │                        │ (2s delay)
    │                        │                        │                        │
    │                        │                        │                        │ Step 2: Install deps
    │                        │                        │                        │ (3s delay)
    │                        │                        │                        │
    │                        │                        │                        │ Step 3: Run tests
    │                        │                        │                        │ (2.5s delay)
    │                        │                        │                        │
    │                        │                        │                        │ Step 4: Build
    │                        │                        │                        │ (3.5s delay)
    │                        │                        │                        │
    │                        │                        │                        │ Step 5: Deploy
    │                        │                        │                        │ (2s delay)
    │                        │                        │                        │
    │                        │                        │                        │ Step 6: Health check
    │                        │                        │                        │ (1.5s delay)
    │                        │                        │                        │
    │                        │                        │                        │ Random outcome
    │                        │                        │                        │ (90% success)
    │                        │                        │                        │
    │                        │                        │                        │ Update: SUCCESS/FAILED
    │                        │                        │                        │
    │                        │                        │                        │ Update service health
    │                        │                        │                        │
```

### 4.2 Deployment States

1. **PENDING**: Initial state, job queued
2. **RUNNING**: Worker processing
3. **SUCCESS**: Completed successfully (90% probability)
4. **FAILED**: Deployment failed (10% probability)

---

## 5. Feature Flag System

### 5.1 Flag Evaluation Logic

```python
def evaluate_flag(flag_key, environment, user_id):
    flag = get_flag(flag_key)
    
    # Check 1: Is flag globally enabled?
    if not flag.enabled:
        return False, "Flag is disabled"
    
    # Check 2: Is environment in rollout list?
    if flag.environments and environment not in flag.environments:
        return False, "Environment not in rollout"
    
    # Check 3: Percentage rollout
    if flag.rollout_percentage < 100:
        user_hash = hash(user_id) % 100
        if user_hash >= flag.rollout_percentage:
            return False, "User not in rollout percentage"
    
    return True, "All conditions met"
```

### 5.2 Rollout Strategy

**Deterministic Hashing:**
- Same user ID always gets same result
- No database state required
- Stateless evaluation
- Predictable behavior

**Example:**
```
Flag: "new_feature"
Rollout: 50%

User "alice" → hash % 100 = 23 → IN (< 50)
User "bob"   → hash % 100 = 67 → OUT (>= 50)
```

---

## 6. Scalability Considerations

### 6.1 Current Bottlenecks

1. **Database**: Single PostgreSQL instance
2. **Job Queue**: Single Redis instance
3. **API**: Stateful (could add more instances)
4. **Deployment Polling**: Frontend polls every 3s

### 6.2 Scaling Path

#### Phase 1: Vertical Scaling (0 - 10K users)
- Increase server resources
- Add database indexes
- Enable caching

#### Phase 2: Horizontal Scaling (10K - 100K users)
```
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌─────▼────┐      ┌─────▼────┐
   │ API (1) │       │ API (2)  │      │ API (3)  │
   └────┬────┘       └─────┬────┘      └─────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  ┌─────▼─────┐      ┌─────▼─────┐     ┌─────▼─────┐
  │ DB Master │      │ DB Replica│     │ DB Replica│
  │ (writes)  │      │ (reads)   │     │ (reads)   │
  └───────────┘      └───────────┘     └───────────┘
```

#### Phase 3: Microservices (100K+ users)
- Split into independent services
- Event-driven architecture
- Service mesh (Istio)
- Database per service

### 6.3 Performance Optimizations

1. **Caching Strategy**
   ```
   - Feature flags: Cache 5 minutes
   - Service list: Cache 1 minute
   - User profile: Cache 15 minutes
   ```

2. **Database Optimization**
   ```sql
   -- Critical indexes
   CREATE INDEX idx_services_owner ON services(owner_id);
   CREATE INDEX idx_deployments_service ON deployments(service_id);
   CREATE INDEX idx_logs_service_created ON logs(service_id, created_at DESC);
   CREATE INDEX idx_audit_actor_created ON audit_logs(actor_id, created_at DESC);
   ```

3. **Query Optimization**
   - Use pagination for large result sets
   - Limit default query results
   - Use database projections (select specific fields)

---

## 7. Monitoring & Observability

### 7.1 Metrics to Track

**Application Metrics:**
- Request rate (req/s)
- Response time (p50, p95, p99)
- Error rate (%)
- Active users

**Business Metrics:**
- Deployments per day
- Deployment success rate
- Feature flags created
- Services registered

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Database connections
- Queue length

### 7.2 Logging Strategy

**Log Levels:**
- `DEBUG`: Development debugging
- `INFO`: Normal operations
- `WARN`: Potentially harmful situations
- `ERROR`: Error events that might still allow the application to continue

**Structured Logging:**
```json
{
  "timestamp": "2026-01-14T10:00:00Z",
  "level": "error",
  "service": "deployment-worker",
  "message": "Deployment failed",
  "metadata": {
    "deploymentId": "uuid",
    "error": "Connection timeout"
  }
}
```

### 7.3 Alerting Rules

1. **Critical: Deployment failure rate > 20%**
2. **Warning: API response time p95 > 2s**
3. **Warning: Database connection pool > 80%**
4. **Info: New service registered**

---

## 8. Disaster Recovery

### 8.1 Backup Strategy

**Database Backups:**
- Automated daily snapshots
- Point-in-time recovery enabled
- Retention: 30 days
- Off-site backup storage

**Configuration Backups:**
- Infrastructure as Code (Terraform)
- Git-based configuration
- Automated deployment pipelines

### 8.2 Recovery Procedures

**Database Failure:**
1. Promote read replica to master
2. Update connection strings
3. Restart applications
4. Rebuild failed master

**Total System Failure:**
1. Deploy from latest Docker images
2. Restore database from backup
3. Verify data integrity
4. Resume operations

---

## 9. Future Enhancements

### 9.1 Planned Features

1. **Real-time Updates**
   - WebSocket integration
   - Live deployment status
   - Real-time log streaming

2. **Advanced Deployment Features**
   - Canary deployments
   - Blue-green deployments
   - Rollback capabilities

3. **Enhanced Feature Flags**
   - User segment targeting
   - A/B test analytics
   - Feature flag dependencies

4. **CI/CD Integration**
   - GitHub Actions webhook
   - GitLab CI integration
   - Automated deployments on merge

5. **Multi-tenancy**
   - Organization support
   - Team-based access control
   - Resource quotas

### 9.2 Technical Debt

1. **Testing**: Add comprehensive test coverage
2. **Documentation**: OpenAPI/Swagger docs
3. **Migrations**: Switch from `synchronize` to proper migrations
4. **Error Handling**: Centralized error handler
5. **Logging**: Structured logging library

---

## 10. Cost Optimization

### 10.1 Resource Estimation (100 users)

```
Component          | Instance Type  | Monthly Cost
-------------------|----------------|-------------
Frontend (S3+CF)   | N/A           | $5
Backend (ECS)      | t3.small x2   | $30
Database (RDS)     | db.t3.micro   | $15
Redis (ElastiCache)| cache.t3.micro| $12
LoadBalancer       | ALB           | $20
-------------------|----------------|-------------
Total                               | ~$82/month
```

### 10.2 Scaling Cost (1000 users)

```
Component          | Instance Type  | Monthly Cost
-------------------|----------------|-------------
Frontend (S3+CF)   | N/A           | $20
Backend (ECS)      | t3.medium x3  | $90
Database (RDS)     | db.t3.small   | $30
Redis (ElastiCache)| cache.t3.small| $25
LoadBalancer       | ALB           | $20
-------------------|----------------|-------------
Total                               | ~$185/month
```

---

## Conclusion

The Internal Developer Platform provides a robust, scalable foundation for service management and deployment orchestration. Its modular architecture allows for independent scaling of components, while the clear separation of concerns ensures maintainability and extensibility.

The system balances simplicity for current needs with architectural patterns that enable future growth. As usage increases, the platform can evolve from a monolithic architecture to distributed microservices without requiring a complete rewrite.

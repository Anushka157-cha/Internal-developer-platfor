# API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All endpoints (except `/auth/login` and `/auth/signup`) require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/signup
Register a new user.

**Request Body:**
```json
{
  "email": "john@company.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "developer"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "uuid",
    "email": "john@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "developer"
  }
}
```

### POST /auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "john@company.com",
  "password": "password123"
}
```

**Response:** Same as signup

---

## Services Endpoints

### POST /services
Create a new service (Admin/Developer only).

**Request Body:**
```json
{
  "name": "payment-api",
  "description": "Payment processing service",
  "repositoryUrl": "https://github.com/company/payment-api",
  "environment": "dev",
  "version": "1.0.0"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "payment-api",
  "description": "Payment processing service",
  "repositoryUrl": "https://github.com/company/payment-api",
  "environment": "dev",
  "healthStatus": "healthy",
  "version": "1.0.0",
  "ownerId": "uuid",
  "owner": { ... },
  "createdAt": "2026-01-14T10:00:00Z",
  "updatedAt": "2026-01-14T10:00:00Z"
}
```

### GET /services
List all services.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "payment-api",
    ...
  }
]
```

### GET /services/:id
Get service details with deployment history.

### PATCH /services/:id
Update service (Admin/Developer, owner only).

### DELETE /services/:id
Delete service (Admin/Developer, owner only).

---

## Deployments Endpoints

### POST /deployments
Trigger a new deployment (Admin/Developer only).

**Request Body:**
```json
{
  "serviceId": "uuid",
  "version": "1.0.1",
  "commitHash": "abc123"
}
```

**Response:**
```json
{
  "id": "uuid",
  "serviceId": "uuid",
  "status": "pending",
  "version": "1.0.1",
  "commitHash": "abc123",
  "triggeredById": "uuid",
  "triggeredBy": { ... },
  "createdAt": "2026-01-14T10:00:00Z"
}
```

### GET /deployments
List all deployments, optionally filtered by service.

**Query Parameters:**
- `serviceId` (optional): Filter by service ID

### GET /deployments/:id
Get deployment details with logs.

---

## Feature Flags Endpoints

### POST /feature-flags
Create a new feature flag (Admin/Developer only).

**Request Body:**
```json
{
  "key": "new_checkout_flow",
  "name": "New Checkout Flow",
  "description": "Enable new checkout experience",
  "enabled": false,
  "environments": ["dev", "staging"],
  "rolloutPercentage": 50
}
```

### GET /feature-flags
List all feature flags.

### GET /feature-flags/:id
Get feature flag details.

### PATCH /feature-flags/:id
Update feature flag (Admin/Developer only).

### POST /feature-flags/:id/toggle
Toggle flag enabled status (Admin/Developer only).

### DELETE /feature-flags/:id
Delete feature flag (Admin only).

### POST /feature-flags/evaluate
Evaluate if flag is enabled for a user.

**Request Body:**
```json
{
  "flagKey": "new_checkout_flow",
  "environment": "prod",
  "userId": "user-123"
}
```

**Response:**
```json
{
  "enabled": true,
  "reason": "All conditions met"
}
```

---

## Logs Endpoints

### POST /logs
Create a log entry.

**Request Body:**
```json
{
  "serviceId": "uuid",
  "level": "error",
  "message": "Database connection failed",
  "metadata": {
    "error": "Connection timeout"
  }
}
```

### GET /logs
List logs with filtering.

**Query Parameters:**
- `serviceId` (optional): Filter by service
- `level` (optional): Filter by log level
- `limit` (optional): Number of logs to return (default: 100)

---

## Audit Endpoints

### GET /audit
List audit logs (Admin/Developer only).

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 100)

### GET /audit/by-actor
Get audit logs for a specific user (Admin only).

**Query Parameters:**
- `actorId` (required): User ID
- `limit` (optional): Number of logs to return (default: 50)

### GET /audit/by-action
Get audit logs for a specific action (Admin/Developer only).

**Query Parameters:**
- `action` (required): Action name
- `limit` (optional): Number of logs to return (default: 50)

---

## Error Responses

All endpoints may return the following error formats:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Service not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

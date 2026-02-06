export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'developer' | 'viewer'
}

export interface AuthResponse {
  access_token: string
  user: User
}

export interface Service {
  id: string
  name: string
  description?: string
  repositoryUrl: string
  environment: 'dev' | 'staging' | 'prod'
  healthStatus: 'healthy' | 'degraded' | 'down'
  version?: string
  owner: User
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface Deployment {
  id: string
  serviceId: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'rolled_back'
  version?: string
  commitHash?: string
  logs?: string
  triggeredBy: User
  triggeredById: string
  startedAt?: string
  completedAt?: string
  durationSeconds?: number
  createdAt: string
  updatedAt: string
}

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description?: string
  enabled: boolean
  environments: ('dev' | 'staging' | 'prod')[]
  rolloutPercentage: number
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Log {
  id: string
  serviceId?: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface AuditLog {
  id: string
  action: string
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'FAILED'
  actor: User
  actorId: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

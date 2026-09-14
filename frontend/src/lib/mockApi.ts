// In-browser mock adapter for static deployments (e.g. Vercel) where a dedicated backend is not yet attached

export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'DEVELOPER' | 'VIEWER' | 'admin' | 'developer' | 'viewer';
  isActive: boolean;
  createdAt: string;
}

export const STORAGE_KEYS = {
  USERS: 'idp_users_store',
  SERVICES: 'idp_services_store',
  DEPLOYMENTS: 'idp_deployments_store',
  FLAGS: 'idp_flags_store',
  AUDIT: 'idp_audit_store',
  LOGS: 'idp_logs_store',
};

export const defaultUser: MockUser = {
  id: 'usr-anushka',
  email: 'chaudharyanushka085@gmail.com',
  firstName: 'Anushka',
  lastName: 'Chaudhary',
  role: 'ADMIN',
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const defaultServices = [
  {
    id: 'srv-auth-prod',
    name: 'auth-identity-service',
    description: 'OAuth2 / OpenID Connect & dual JWT rotation cluster',
    environment: 'prod',
    healthStatus: 'healthy',
    status: 'HEALTHY',
    version: 'v1.9.4',
    port: 8081,
    healthEndpoint: '/health',
    repositoryUrl: 'https://github.com/Anushka157-cha/Internal-developer-platfor',
    owner: {
      id: 'usr-anushka',
      email: 'chaudharyanushka085@gmail.com',
      firstName: 'Anushka',
      lastName: 'Chaudhary',
      role: 'ADMIN',
    },
    ownerId: 'usr-anushka',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'srv-pay-prod',
    name: 'payment-gateway',
    description: 'Stripe, PayPal & Wire settlement transaction gateway',
    environment: 'prod',
    healthStatus: 'healthy',
    status: 'HEALTHY',
    version: 'v2.6.0',
    port: 8080,
    healthEndpoint: '/api/v1/health',
    repositoryUrl: 'https://github.com/Anushka157-cha/Internal-developer-platfor',
    owner: {
      id: 'usr-anushka',
      email: 'chaudharyanushka085@gmail.com',
      firstName: 'Anushka',
      lastName: 'Chaudhary',
      role: 'ADMIN',
    },
    ownerId: 'usr-anushka',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'srv-order-prod',
    name: 'order-fulfillment-engine',
    description: 'High-throughput BullMQ consumer for inventory reservation',
    environment: 'prod',
    healthStatus: 'healthy',
    status: 'HEALTHY',
    version: 'v3.1.2',
    port: 8082,
    healthEndpoint: '/healthz',
    repositoryUrl: 'https://github.com/Anushka157-cha/Internal-developer-platfor',
    owner: {
      id: 'usr-anushka',
      email: 'chaudharyanushka085@gmail.com',
      firstName: 'Anushka',
      lastName: 'Chaudhary',
      role: 'ADMIN',
    },
    ownerId: 'usr-anushka',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'srv-notif-prod',
    name: 'notification-dispatcher',
    description: 'Multi-channel push, SMS & AWS SES webhook engine',
    environment: 'staging',
    healthStatus: 'degraded',
    status: 'DEGRADED',
    version: 'v1.4.1',
    port: 8083,
    healthEndpoint: '/status',
    repositoryUrl: 'https://github.com/Anushka157-cha/Internal-developer-platfor',
    owner: {
      id: 'usr-anushka',
      email: 'chaudharyanushka085@gmail.com',
      firstName: 'Anushka',
      lastName: 'Chaudhary',
      role: 'ADMIN',
    },
    ownerId: 'usr-anushka',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'srv-telemetry-prod',
    name: 'telemetry-collector',
    description: 'OTel trace & Prometheus metrics aggregation daemon',
    environment: 'prod',
    healthStatus: 'healthy',
    status: 'HEALTHY',
    version: 'v4.0.2',
    port: 8084,
    healthEndpoint: '/metrics/health',
    repositoryUrl: 'https://github.com/Anushka157-cha/Internal-developer-platfor',
    owner: {
      id: 'usr-anushka',
      email: 'chaudharyanushka085@gmail.com',
      firstName: 'Anushka',
      lastName: 'Chaudhary',
      role: 'ADMIN',
    },
    ownerId: 'usr-anushka',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const defaultDeployments = [
  {
    id: 'dep-9821',
    serviceId: 'srv-pay-prod',
    version: 'v2.6.0',
    commitHash: '7f9a12c',
    environment: 'prod',
    status: 'success',
    currentStep: 'COMPLETED',
    progressPercentage: 100,
    durationSeconds: 46,
    logs: '[INIT] Pulling repository workspace...\n[BUILD] Compiling Dockerfile (multi-stage Go binary)...\n[TEST] Running 48 test suites (Coverage: 98.4%)...\n[DEPLOY] Rolling rollout across 3 container replicas...\n[HEALTH] Probing /api/v1/health -> HTTP 200 (14ms latency)\n[SUCCESS] Traffic switch verified. Release live!',
    isRollback: false,
    triggeredBy: {
      id: 'usr-anushka',
      email: 'chaudharyanushka085@gmail.com',
      firstName: 'Anushka',
      lastName: 'Chaudhary',
      role: 'ADMIN',
    },
    triggeredById: 'usr-anushka',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
    service: {
      id: 'srv-pay-prod',
      name: 'payment-gateway',
      environment: 'prod',
      healthEndpoint: '/api/v1/health',
    },
  },
  {
    id: 'dep-9820',
    serviceId: 'srv-auth-prod',
    version: 'v1.9.4',
    commitHash: '3a41bc9',
    environment: 'prod',
    status: 'success',
    currentStep: 'COMPLETED',
    progressPercentage: 100,
    durationSeconds: 52,
    logs: '[INIT] Enqueued in BullMQ Redis queue\n[BUILD] Building NestJS dist bundle...\n[TEST] Jest: 37 of 37 passed\n[DEPLOY] Container rolling update successful\n[HEALTH] Health check probe OK (28ms)\n[SUCCESS] Deployment active.',
    isRollback: false,
    triggeredBy: {
      id: 'usr-anushka',
      email: 'chaudharyanushka085@gmail.com',
      firstName: 'Anushka',
      lastName: 'Chaudhary',
      role: 'ADMIN',
    },
    triggeredById: 'usr-anushka',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 119).toISOString(),
    service: {
      id: 'srv-auth-prod',
      name: 'auth-identity-service',
      environment: 'prod',
      healthEndpoint: '/health',
    },
  },
  {
    id: 'dep-9819',
    serviceId: 'srv-notif-prod',
    version: 'v1.4.1',
    commitHash: 'e5b28fa',
    environment: 'staging',
    status: 'failed',
    failureReason: 'Health check timeout: response latency > 3000ms',
    currentStep: 'HEALTH_CHECK',
    progressPercentage: 80,
    durationSeconds: 78,
    logs: '[INIT] Enqueued job\n[BUILD] Docker image built\n[TEST] Unit tests passed\n[DEPLOY] Staging container started\n[ERROR] Health check probe timed out after 3000ms. Halting rollout!',
    isRollback: false,
    triggeredBy: {
      id: 'usr-anushka',
      email: 'chaudharyanushka085@gmail.com',
      firstName: 'Anushka',
      lastName: 'Chaudhary',
      role: 'ADMIN',
    },
    triggeredById: 'usr-anushka',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 238).toISOString(),
    service: {
      id: 'srv-notif-prod',
      name: 'notification-dispatcher',
      environment: 'staging',
      healthEndpoint: '/status',
    },
  },
];

export const defaultFlags = [
  {
    id: 'flag-dark-mode',
    key: 'dark-theme-v2',
    name: 'Dark Theme Console v2',
    description: 'Enables OLED dark console interface for all internal engineers',
    enabled: true,
    isEnabled: true,
    rolloutPercentage: 100,
    environments: ['prod', 'staging', 'dev'],
    targetEnvironments: ['prod', 'staging', 'dev'],
    targetRoles: ['ADMIN', 'DEVELOPER', 'VIEWER'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'flag-canary',
    key: 'canary-rollout-engine',
    name: 'Canary Deployment Pipeline',
    description: 'Routes 10% live production traffic to new container versions',
    enabled: true,
    isEnabled: true,
    rolloutPercentage: 25,
    environments: ['prod'],
    targetEnvironments: ['prod'],
    targetRoles: ['ADMIN'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'flag-rate-limit',
    key: 'strict-rate-limiting',
    name: 'Enhanced Rate Limiting',
    description: 'Applies token bucket rate limiting on public gateway endpoints',
    enabled: false,
    isEnabled: false,
    rolloutPercentage: 0,
    environments: ['prod'],
    targetEnvironments: ['prod'],
    targetRoles: ['ADMIN', 'DEVELOPER'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const defaultAudit = [
  {
    id: 'aud-1',
    action: 'SERVICE_REGISTERED',
    entityType: 'Service',
    entityId: 'srv-telemetry-prod',
    severity: 'SUCCESS',
    actor: {
      id: 'usr-anushka',
      email: 'chaudharyanushka085@gmail.com',
      firstName: 'Anushka',
      lastName: 'Chaudhary',
      role: 'ADMIN',
    },
    actorEmail: 'chaudharyanushka085@gmail.com',
    actorId: 'usr-anushka',
    ipAddress: '10.0.4.12',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'aud-2',
    action: 'DEPLOYMENT_SUCCESS',
    entityType: 'Deployment',
    entityId: 'dep-9821',
    severity: 'SUCCESS',
    actor: {
      id: 'usr-anushka',
      email: 'chaudharyanushka085@gmail.com',
      firstName: 'Anushka',
      lastName: 'Chaudhary',
      role: 'ADMIN',
    },
    actorEmail: 'chaudharyanushka085@gmail.com',
    actorId: 'usr-anushka',
    ipAddress: '10.0.2.85',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    createdAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
  },
  {
    id: 'aud-3',
    action: 'FEATURE_FLAG_ENABLED',
    entityType: 'FeatureFlag',
    entityId: 'flag-canary',
    severity: 'INFO',
    actor: {
      id: 'usr-anushka',
      email: 'chaudharyanushka085@gmail.com',
      firstName: 'Anushka',
      lastName: 'Chaudhary',
      role: 'ADMIN',
    },
    actorEmail: 'chaudharyanushka085@gmail.com',
    actorId: 'usr-anushka',
    ipAddress: '10.0.1.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

export const defaultLogs = [
  {
    id: 'log-1',
    serviceId: 'srv-pay-prod',
    serviceName: 'payment-gateway',
    level: 'info',
    message: 'Stripe webhook received: charge.succeeded [evt_3N82b]',
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
  },
  {
    id: 'log-2',
    serviceId: 'srv-order-prod',
    serviceName: 'order-fulfillment-engine',
    level: 'info',
    message: 'BullMQ batch job completed: 42 reservations committed',
    createdAt: new Date(Date.now() - 1000 * 30).toISOString(),
    timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
  },
  {
    id: 'log-3',
    serviceId: 'srv-notif-prod',
    serviceName: 'notification-dispatcher',
    level: 'warn',
    message: 'AWS SES rate limit threshold reached (85%), buffering messages',
    createdAt: new Date(Date.now() - 1000 * 90).toISOString(),
    timestamp: new Date(Date.now() - 1000 * 90).toISOString(),
  },
  {
    id: 'log-4',
    serviceId: 'srv-auth-prod',
    serviceName: 'auth-identity-service',
    level: 'info',
    message: 'Dual JWT refresh rotation token validated successfully',
    createdAt: new Date(Date.now() - 1000 * 150).toISOString(),
    timestamp: new Date(Date.now() - 1000 * 150).toISOString(),
  },
];

export function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);

    // If fallback is an array, strictly ensure parsed is also an array!
    if (Array.isArray(fallback)) {
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setStored(key, fallback);
        return fallback;
      }
    }
    return parsed;
  } catch {
    return fallback;
  }
}

export function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

// Auto-repair any corrupt localStorage state from previous visits
export function autoRepairStores(): void {
  const storeDefs: Array<{ key: string; fallback: any[] }> = [
    { key: STORAGE_KEYS.SERVICES, fallback: defaultServices },
    { key: STORAGE_KEYS.DEPLOYMENTS, fallback: defaultDeployments },
    { key: STORAGE_KEYS.FLAGS, fallback: defaultFlags },
    { key: STORAGE_KEYS.AUDIT, fallback: defaultAudit },
    { key: STORAGE_KEYS.LOGS, fallback: defaultLogs },
  ];

  for (const store of storeDefs) {
    try {
      const raw = localStorage.getItem(store.key);
      if (!raw) {
        setStored(store.key, store.fallback);
        continue;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setStored(store.key, store.fallback);
      }
    } catch {
      setStored(store.key, store.fallback);
    }
  }
}

// Run auto-repair on load
if (typeof window !== 'undefined') {
  autoRepairStores();
}

export async function handleMockRequest(method: string, path: string, data?: any): Promise<any> {
  const normalizedMethod = (method || 'GET').toUpperCase();

  // Robust URL path extraction: strip origin, protocol, and leading /api
  let normalizedPath = path || '';
  try {
    if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
      const urlObj = new URL(normalizedPath);
      normalizedPath = urlObj.pathname + urlObj.search;
    }
  } catch {
    // Ignore URL parse error
  }

  // Remove leading /api if present
  let cleanPath = normalizedPath.replace(/^\/?api/, '');
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  // Separate pathname and query params
  const [rawPathname, rawQueryString = ''] = cleanPath.split('?');
  const pathname = rawPathname.replace(/\/+$/, '') || '/';
  const queryParams = new URLSearchParams(rawQueryString);

  // 1. Authentication
  if (pathname === '/auth/signup' && normalizedMethod === 'POST') {
    const users = getStored<MockUser[]>(STORAGE_KEYS.USERS, []);
    const existing = users.find((u) => u.email.toLowerCase() === (data?.email || '').toLowerCase());

    const newUser: MockUser = {
      id: existing ? existing.id : `usr-${Date.now()}`,
      email: data?.email || 'chaudharyanushka085@gmail.com',
      firstName: data?.firstName || 'Anushka',
      lastName: data?.lastName || 'Chaudhary',
      role: (data?.role || 'ADMIN').toUpperCase(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    if (!existing) {
      users.push(newUser);
      setStored(STORAGE_KEYS.USERS, users);
    }

    const audit = getStored<any[]>(STORAGE_KEYS.AUDIT, defaultAudit);
    audit.unshift({
      id: `aud-${Date.now()}`,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: newUser.id,
      severity: 'INFO',
      actor: newUser,
      actorEmail: newUser.email,
      actorId: newUser.id,
      ipAddress: '127.0.0.1',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser',
      createdAt: new Date().toISOString(),
    });
    setStored(STORAGE_KEYS.AUDIT, audit);

    return {
      access_token: `idp_mock_token_${Date.now()}`,
      refresh_token: `idp_mock_refresh_${Date.now()}`,
      user: newUser,
    };
  }

  if (pathname === '/auth/login' && normalizedMethod === 'POST') {
    const users = getStored<MockUser[]>(STORAGE_KEYS.USERS, []);
    let user = users.find((u) => u.email.toLowerCase() === (data?.email || '').toLowerCase());

    if (!user) {
      const emailParts = (data?.email || 'anushka.chaudhary').split('@')[0].split('.');
      const firstName = emailParts[0] ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : 'Anushka';
      const lastName = emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : 'Chaudhary';

      user = {
        id: `usr-${Date.now()}`,
        email: data?.email || 'chaudharyanushka085@gmail.com',
        firstName,
        lastName,
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      setStored(STORAGE_KEYS.USERS, users);
    }

    return {
      access_token: `idp_mock_token_${Date.now()}`,
      refresh_token: `idp_mock_refresh_${Date.now()}`,
      user,
    };
  }

  if (pathname === '/auth/demo-login' && normalizedMethod === 'POST') {
    return {
      access_token: `idp_mock_token_${Date.now()}`,
      refresh_token: `idp_mock_refresh_${Date.now()}`,
      user: defaultUser,
    };
  }

  if (pathname === '/auth/logout') {
    return { success: true };
  }

  if (pathname === '/auth/forgot-password') {
    return { message: 'Password reset link sent to your registered email.' };
  }

  if (pathname === '/auth/me' && normalizedMethod === 'GET') {
    return defaultUser;
  }

  // 2. Dashboard Metrics
  if (pathname === '/dashboard/metrics' || pathname === '/metrics') {
    const services = getStored<any[]>(STORAGE_KEYS.SERVICES, defaultServices);
    const deployments = getStored<any[]>(STORAGE_KEYS.DEPLOYMENTS, defaultDeployments);
    const flags = getStored<any[]>(STORAGE_KEYS.FLAGS, defaultFlags);

    const healthyCount = services.filter((s) => (s.healthStatus || s.status || '').toLowerCase() === 'healthy').length;
    const degradedCount = services.filter((s) => (s.healthStatus || s.status || '').toLowerCase() === 'degraded').length;
    const downCount = services.filter((s) => {
      const st = (s.healthStatus || s.status || '').toLowerCase();
      return st === 'down' || st === 'failed';
    }).length;

    const successfulCount = deployments.filter((d) => (d.status || '').toLowerCase() === 'success').length;
    const failedCount = deployments.filter((d) => (d.status || '').toLowerCase() === 'failed').length;
    const totalDeps = deployments.length;
    const successRate = totalDeps > 0 ? Math.round((successfulCount / totalDeps) * 100) : 100;

    return {
      overview: {
        totalServices: services.length,
        healthyServices: healthyCount,
        totalDeployments: totalDeps,
        successfulDeployments: successfulCount,
        failedDeployments: failedCount,
        deploymentSuccessRate: successRate,
        averageDeploymentDurationSeconds: 46,
        totalFeatureFlags: flags.length,
      },
      deploymentTrends: [
        { day: 'Mon', date: 'Sep 08', deployments: 4, successful: 4, failed: 0 },
        { day: 'Tue', date: 'Sep 09', deployments: 7, successful: 6, failed: 1 },
        { day: 'Wed', date: 'Sep 10', deployments: 5, successful: 5, failed: 0 },
        { day: 'Thu', date: 'Sep 11', deployments: 9, successful: 8, failed: 1 },
        { day: 'Fri', date: 'Sep 12', deployments: 6, successful: 6, failed: 0 },
        { day: 'Sat', date: 'Sep 13', deployments: 8, successful: 7, failed: 1 },
        { day: 'Sun', date: 'Sep 14', deployments: 12, successful: 12, failed: 0 },
      ],
      recentDeployments: deployments.slice(0, 5),
      serviceHealthDistribution: [
        { name: 'Healthy', value: healthyCount || 1, color: '#10b981' },
        { name: 'Degraded', value: degradedCount, color: '#f59e0b' },
        { name: 'Down', value: downCount, color: '#ef4444' },
      ],
    };
  }

  // 3. Services API
  if (pathname === '/services') {
    if (normalizedMethod === 'GET') {
      const services = getStored<any[]>(STORAGE_KEYS.SERVICES, defaultServices);
      const envFilter = queryParams.get('environment');
      const healthFilter = queryParams.get('healthStatus');
      let filtered = services;
      if (envFilter) {
        filtered = filtered.filter((s) => (s.environment || '').toLowerCase() === envFilter.toLowerCase());
      }
      if (healthFilter) {
        filtered = filtered.filter((s) => (s.healthStatus || s.status || '').toLowerCase() === healthFilter.toLowerCase());
      }
      return filtered;
    }

    if (normalizedMethod === 'POST') {
      const services = getStored<any[]>(STORAGE_KEYS.SERVICES, defaultServices);
      const newService = {
        id: `srv-${Date.now()}`,
        name: data?.name || 'new-microservice',
        description: data?.description || '',
        environment: data?.environment || 'dev',
        healthStatus: 'healthy',
        status: 'HEALTHY',
        version: data?.version || 'v1.0.0',
        port: data?.port || 8080,
        healthEndpoint: data?.healthEndpoint || '/health',
        repositoryUrl: data?.repositoryUrl || 'https://github.com/Anushka157-cha/Internal-developer-platfor',
        owner: defaultUser,
        ownerId: defaultUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      services.unshift(newService);
      setStored(STORAGE_KEYS.SERVICES, services);

      const audit = getStored<any[]>(STORAGE_KEYS.AUDIT, defaultAudit);
      audit.unshift({
        id: `aud-${Date.now()}`,
        action: 'SERVICE_CREATED',
        entityType: 'Service',
        entityId: newService.id,
        severity: 'SUCCESS',
        actor: defaultUser,
        actorEmail: defaultUser.email,
        actorId: defaultUser.id,
        ipAddress: '127.0.0.1',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser',
        createdAt: new Date().toISOString(),
      });
      setStored(STORAGE_KEYS.AUDIT, audit);

      return newService;
    }
  }

  // Service Detail: /services/:id
  const serviceDetailMatch = pathname.match(/^\/services\/([^/?]+)$/);
  if (serviceDetailMatch) {
    const serviceId = serviceDetailMatch[1];
    const services = getStored<any[]>(STORAGE_KEYS.SERVICES, defaultServices);

    if (normalizedMethod === 'GET') {
      const s = services.find((item) => item.id === serviceId);
      return s || services[0] || null;
    }

    if (normalizedMethod === 'PATCH' || normalizedMethod === 'PUT') {
      const s = services.find((item) => item.id === serviceId);
      if (s) {
        Object.assign(s, data, { updatedAt: new Date().toISOString() });
        setStored(STORAGE_KEYS.SERVICES, services);
        return s;
      }
      return { success: true };
    }

    if (normalizedMethod === 'DELETE') {
      const filtered = services.filter((item) => item.id !== serviceId);
      setStored(STORAGE_KEYS.SERVICES, filtered);
      return { success: true };
    }
  }

  // Health Check: /services/:id/health-check
  const healthCheckMatch = pathname.match(/^\/services\/([^/?]+)\/health-check$/);
  if (healthCheckMatch && normalizedMethod === 'POST') {
    const serviceId = healthCheckMatch[1];
    const services = getStored<any[]>(STORAGE_KEYS.SERVICES, defaultServices);
    const s = services.find((item) => item.id === serviceId);
    if (s) {
      s.healthStatus = 'healthy';
      s.status = 'HEALTHY';
      s.updatedAt = new Date().toISOString();
      setStored(STORAGE_KEYS.SERVICES, services);
    }
    return { status: 'healthy', latencyMs: Math.floor(Math.random() * 40) + 12 };
  }

  // 4. Deployments API
  if (pathname === '/deployments') {
    const deployments = getStored<any[]>(STORAGE_KEYS.DEPLOYMENTS, defaultDeployments);

    if (normalizedMethod === 'GET') {
      const serviceId = queryParams.get('serviceId');
      const status = queryParams.get('status');
      let filtered = deployments;
      if (serviceId) {
        filtered = filtered.filter((d) => d.serviceId === serviceId);
        return filtered; // ServiceDetailPage expects direct array
      }
      if (status) {
        filtered = filtered.filter((d) => (d.status || '').toLowerCase() === status.toLowerCase());
      }
      return {
        data: filtered,
        meta: {
          total: filtered.length,
          page: 1,
          totalPages: 1,
        },
      };
    }

    if (normalizedMethod === 'POST') {
      const services = getStored<any[]>(STORAGE_KEYS.SERVICES, defaultServices);
      const s = services.find((srv) => srv.id === data?.serviceId) || services[0];

      const newDep = {
        id: `dep-${Math.floor(1000 + Math.random() * 9000)}`,
        serviceId: s.id,
        version: data?.version || 'v2.0.0',
        commitHash: data?.commitHash || Math.random().toString(16).substring(2, 9),
        environment: data?.environment || s.environment || 'prod',
        status: 'success',
        currentStep: 'COMPLETED',
        progressPercentage: 100,
        durationSeconds: 38,
        logs: `[QUEUED] Job enqueued to BullMQ Redis queue\n[BUILD] Dockerfile compiled successfully\n[TEST] 37 of 37 unit & integration tests passed\n[DEPLOY] Container rolling rollout completed\n[HEALTH] Probe returned HTTP 200 (18ms)\n[SUCCESS] Production traffic enabled.`,
        isRollback: false,
        triggeredBy: defaultUser,
        triggeredById: defaultUser.id,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        service: {
          id: s.id,
          name: s.name,
          environment: s.environment,
          healthEndpoint: s.healthEndpoint,
        },
      };

      deployments.unshift(newDep);
      setStored(STORAGE_KEYS.DEPLOYMENTS, deployments);

      if (s) {
        s.version = newDep.version;
        setStored(STORAGE_KEYS.SERVICES, services);
      }

      return newDep;
    }
  }

  // Deployment Detail: /deployments/:id
  const depDetailMatch = pathname.match(/^\/deployments\/([^/?]+)$/);
  if (depDetailMatch && normalizedMethod === 'GET') {
    const depId = depDetailMatch[1];
    const deployments = getStored<any[]>(STORAGE_KEYS.DEPLOYMENTS, defaultDeployments);
    let dep = deployments.find((d) => d.id === depId);
    if (!dep) dep = deployments[0];
    if (dep) {
      if (!dep.environment) {
        dep.environment = dep.service?.environment || 'prod';
      }
      if (!dep.service) {
        dep.service = {
          id: dep.serviceId || 'srv-pay-prod',
          name: 'payment-gateway',
          environment: dep.environment || 'prod',
          healthEndpoint: '/api/v1/health',
        };
      }
    }
    return dep || null;
  }

  // Rollback: /deployments/:id/rollback
  const rollbackMatch = pathname.match(/^\/deployments\/([^/?]+)\/rollback$/);
  if (rollbackMatch && normalizedMethod === 'POST') {
    const depId = rollbackMatch[1];
    const deployments = getStored<any[]>(STORAGE_KEYS.DEPLOYMENTS, defaultDeployments);
    const original = deployments.find((d) => d.id === depId) || deployments[0];

    const rollbackDep = {
      id: `dep-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceId: original.serviceId,
      version: `${original.version}-rollback`,
      commitHash: original.commitHash,
      environment: original.environment,
      status: 'success',
      currentStep: 'COMPLETED',
      progressPercentage: 100,
      durationSeconds: 28,
      logs: `[ROLLBACK] Forward rollback triggered for ${depId}\n[DEPLOY] Restoring previous healthy container revision\n[HEALTH] Zero downtime health verification passed\n[SUCCESS] Rollback release live.`,
      isRollback: true,
      rollbackOfDeploymentId: depId,
      triggeredBy: defaultUser,
      triggeredById: defaultUser.id,
      createdAt: new Date().toISOString(),
      service: original.service,
    };

    deployments.unshift(rollbackDep);
    setStored(STORAGE_KEYS.DEPLOYMENTS, deployments);
    return rollbackDep;
  }

  // 5. Feature Flags API
  if (pathname === '/feature-flags' || pathname === '/flags') {
    if (normalizedMethod === 'GET') {
      return getStored<any[]>(STORAGE_KEYS.FLAGS, defaultFlags);
    }

    if (normalizedMethod === 'POST') {
      const flags = getStored<any[]>(STORAGE_KEYS.FLAGS, defaultFlags);
      const newFlag = {
        id: `flag-${Date.now()}`,
        key: data?.key || `flag-${Date.now()}`,
        name: data?.name || 'New Feature Flag',
        description: data?.description || '',
        enabled: !!data?.enabled || !!data?.isEnabled,
        isEnabled: !!data?.enabled || !!data?.isEnabled,
        rolloutPercentage: data?.rolloutPercentage ?? 100,
        environments: data?.environments || ['prod'],
        targetEnvironments: data?.targetEnvironments || ['prod'],
        targetRoles: data?.targetRoles || ['ADMIN', 'DEVELOPER'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      flags.unshift(newFlag);
      setStored(STORAGE_KEYS.FLAGS, flags);
      return newFlag;
    }
  }

  const flagToggleMatch = pathname.match(/^\/feature-flags\/([^/?]+)\/toggle$/);
  if (flagToggleMatch && normalizedMethod === 'POST') {
    const flagId = flagToggleMatch[1];
    const flags = getStored<any[]>(STORAGE_KEYS.FLAGS, defaultFlags);
    const f = flags.find((item) => item.id === flagId);
    if (f) {
      f.enabled = !f.enabled;
      f.isEnabled = f.enabled;
      setStored(STORAGE_KEYS.FLAGS, flags);
      return f;
    }
    return { success: true };
  }

  const flagDeleteMatch = pathname.match(/^\/feature-flags\/([^/?]+)$/);
  if (flagDeleteMatch && normalizedMethod === 'DELETE') {
    const flagId = flagDeleteMatch[1];
    let flags = getStored<any[]>(STORAGE_KEYS.FLAGS, defaultFlags);
    flags = flags.filter((item) => item.id !== flagId);
    setStored(STORAGE_KEYS.FLAGS, flags);
    return { success: true };
  }

  // 6. Logs API
  if (pathname === '/logs' || pathname.startsWith('/logs')) {
    const logs = getStored<any[]>(STORAGE_KEYS.LOGS, defaultLogs);
    const serviceId = queryParams.get('serviceId');
    if (serviceId) {
      return logs.filter((l) => l.serviceId === serviceId);
    }
    return logs;
  }

  // 7. Audit Logs API
  if (pathname === '/audit' || pathname.startsWith('/audit')) {
    return getStored<any[]>(STORAGE_KEYS.AUDIT, defaultAudit);
  }

  // 8. Users API
  if (pathname === '/users' || pathname.startsWith('/users')) {
    const users = getStored<MockUser[]>(STORAGE_KEYS.USERS, []);
    const list = users.length > 0 ? users : [defaultUser];
    return {
      data: list,
      total: list.length,
    };
  }

  // Fallback for unknown collection GET requests: NEVER return { success: true }
  if (normalizedMethod === 'GET') {
    if (pathname.includes('service')) {
      return defaultServices;
    }
    if (pathname.includes('deploy')) {
      return { data: defaultDeployments, meta: { total: defaultDeployments.length, page: 1, totalPages: 1 } };
    }
    if (pathname.includes('flag')) {
      return defaultFlags;
    }
    if (pathname.includes('log')) {
      return defaultLogs;
    }
    if (pathname.includes('audit')) {
      return defaultAudit;
    }
    return [];
  }

  return { success: true };
}

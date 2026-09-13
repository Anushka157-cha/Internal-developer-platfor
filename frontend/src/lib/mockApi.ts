// In-browser mock adapter for static deployments (e.g. Vercel) where a dedicated backend is not yet attached

interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'DEVELOPER' | 'VIEWER';
  isActive: boolean;
  createdAt: string;
}

const STORAGE_KEYS = {
  USERS: 'idp_users_store',
  SERVICES: 'idp_services_store',
  DEPLOYMENTS: 'idp_deployments_store',
  FLAGS: 'idp_flags_store',
  AUDIT: 'idp_audit_store',
  LOGS: 'idp_logs_store',
};

const defaultServices = [
  {
    id: 'srv-auth-prod',
    name: 'auth-identity-service',
    description: 'OAuth2 / OpenID Connect & dual JWT rotation cluster',
    environment: 'production',
    version: 'v1.9.4',
    port: 8081,
    status: 'HEALTHY',
    healthEndpoint: '/health',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'srv-pay-prod',
    name: 'payment-gateway',
    description: 'Stripe, PayPal & Wire settlement transaction gateway',
    environment: 'production',
    version: 'v2.6.0',
    port: 8080,
    status: 'HEALTHY',
    healthEndpoint: '/api/v1/health',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'srv-order-prod',
    name: 'order-fulfillment-engine',
    description: 'High-throughput BullMQ consumer for inventory reservation',
    environment: 'production',
    version: 'v3.1.2',
    port: 8082,
    status: 'HEALTHY',
    healthEndpoint: '/healthz',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'srv-notif-prod',
    name: 'notification-dispatcher',
    description: 'Multi-channel push, SMS & AWS SES webhook engine',
    environment: 'production',
    version: 'v1.4.1',
    port: 8083,
    status: 'DEGRADED',
    healthEndpoint: '/status',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'srv-telemetry-prod',
    name: 'telemetry-collector',
    description: 'OTel trace & Prometheus metrics aggregation daemon',
    environment: 'production',
    version: 'v4.0.2',
    port: 8084,
    status: 'HEALTHY',
    healthEndpoint: '/metrics/health',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultDeployments = [
  {
    id: 'dep-9821',
    serviceId: 'srv-pay-prod',
    version: 'v2.6.0',
    commitHash: '7f9a12c',
    environment: 'production',
    status: 'SUCCESS',
    currentStep: 'COMPLETED',
    progressPercentage: 100,
    durationSeconds: 46,
    logs: '[INIT] Pulling repository workspace...\n[BUILD] Compiling Dockerfile (multi-stage Go binary)...\n[TEST] Running 48 test suites (Coverage: 98.4%)...\n[DEPLOY] Rolling rollout across 3 container replicas...\n[HEALTH] Probing /api/v1/health -> HTTP 200 (14ms latency)\n[SUCCESS] Traffic switch verified. Release live!',
    isRollback: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
    service: {
      id: 'srv-pay-prod',
      name: 'payment-gateway',
      environment: 'production',
      healthEndpoint: '/api/v1/health',
    },
  },
  {
    id: 'dep-9820',
    serviceId: 'srv-auth-prod',
    version: 'v1.9.4',
    commitHash: '3a41bc9',
    environment: 'production',
    status: 'SUCCESS',
    currentStep: 'COMPLETED',
    progressPercentage: 100,
    durationSeconds: 52,
    logs: '[INIT] Enqueued in BullMQ Redis queue\n[BUILD] Building NestJS dist bundle...\n[TEST] Jest: 37 of 37 passed\n[DEPLOY] Container rolling update successful\n[HEALTH] Health check probe OK (28ms)\n[SUCCESS] Deployment active.',
    isRollback: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 119).toISOString(),
    service: {
      id: 'srv-auth-prod',
      name: 'auth-identity-service',
      environment: 'production',
      healthEndpoint: '/health',
    },
  },
  {
    id: 'dep-9819',
    serviceId: 'srv-notif-prod',
    version: 'v1.4.1',
    commitHash: 'e5b28fa',
    environment: 'production',
    status: 'FAILED',
    failureReason: 'Health check timeout: response latency > 3000ms',
    currentStep: 'HEALTH_CHECK',
    progressPercentage: 80,
    durationSeconds: 78,
    logs: '[INIT] Enqueued job\n[BUILD] Docker image built\n[TEST] Unit tests passed\n[DEPLOY] Staging container started\n[ERROR] Health check probe timed out after 3000ms. Halting rollout!',
    isRollback: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    service: {
      id: 'srv-notif-prod',
      name: 'notification-dispatcher',
      environment: 'production',
      healthEndpoint: '/status',
    },
  },
];

const defaultFlags = [
  {
    id: 'flag-dark-mode',
    key: 'dark-theme-v2',
    name: 'Dark Theme Console v2',
    description: 'Enables OLED dark console interface for all internal engineers',
    isEnabled: true,
    rolloutPercentage: 100,
    targetEnvironments: ['production', 'staging', 'development'],
    targetRoles: ['ADMIN', 'DEVELOPER', 'VIEWER'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'flag-canary',
    key: 'canary-rollout-engine',
    name: 'Canary Deployment Pipeline',
    description: 'Routes 10% live production traffic to new container versions',
    isEnabled: true,
    rolloutPercentage: 25,
    targetEnvironments: ['production'],
    targetRoles: ['ADMIN'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'flag-rate-limit',
    key: 'strict-rate-limiting',
    name: 'Enhanced Rate Limiting',
    description: 'Applies token bucket rate limiting on public gateway endpoints',
    isEnabled: false,
    rolloutPercentage: 0,
    targetEnvironments: ['production'],
    targetRoles: ['ADMIN', 'DEVELOPER'],
    createdAt: new Date().toISOString(),
  },
];

const defaultAudit = [
  {
    id: 'aud-1',
    action: 'SERVICE_REGISTERED',
    entityType: 'Service',
    entityId: 'srv-telemetry-prod',
    actorEmail: 'admin@platform.internal',
    ipAddress: '10.0.4.12',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'aud-2',
    action: 'DEPLOYMENT_SUCCESS',
    entityType: 'Deployment',
    entityId: 'dep-9821',
    actorEmail: 'anushka@platform.internal',
    ipAddress: '10.0.2.85',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    createdAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
  },
  {
    id: 'aud-3',
    action: 'FEATURE_FLAG_ENABLED',
    entityType: 'FeatureFlag',
    entityId: 'flag-canary',
    actorEmail: 'admin@platform.internal',
    ipAddress: '10.0.1.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

const defaultLogs = [
  {
    id: 'log-1',
    serviceName: 'payment-gateway',
    level: 'INFO',
    message: 'Stripe webhook received: charge.succeeded [evt_3N82b]',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'log-2',
    serviceName: 'order-fulfillment-engine',
    level: 'INFO',
    message: 'BullMQ batch job completed: 42 reservations committed',
    timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
  },
  {
    id: 'log-3',
    serviceName: 'notification-dispatcher',
    level: 'WARN',
    message: 'AWS SES rate limit threshold reached (85%), buffering messages',
    timestamp: new Date(Date.now() - 1000 * 90).toISOString(),
  },
  {
    id: 'log-4',
    serviceName: 'auth-identity-service',
    level: 'INFO',
    message: 'Dual JWT refresh rotation token validated successfully',
    timestamp: new Date(Date.now() - 1000 * 150).toISOString(),
  },
];

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

// Ensure defaults are initialized
if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
  setStored(STORAGE_KEYS.SERVICES, defaultServices);
}
if (!localStorage.getItem(STORAGE_KEYS.DEPLOYMENTS)) {
  setStored(STORAGE_KEYS.DEPLOYMENTS, defaultDeployments);
}
if (!localStorage.getItem(STORAGE_KEYS.FLAGS)) {
  setStored(STORAGE_KEYS.FLAGS, defaultFlags);
}
if (!localStorage.getItem(STORAGE_KEYS.AUDIT)) {
  setStored(STORAGE_KEYS.AUDIT, defaultAudit);
}
if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
  setStored(STORAGE_KEYS.LOGS, defaultLogs);
}

export async function handleMockRequest(method: string, path: string, data?: any): Promise<any> {
  const normalizedMethod = method.toUpperCase();
  const cleanPath = path.replace(/^\/api/, '');

  // 1. Authentication
  if (cleanPath === '/auth/signup' && normalizedMethod === 'POST') {
    const users = getStored<MockUser[]>(STORAGE_KEYS.USERS, []);
    const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());

    const newUser: MockUser = {
      id: existing ? existing.id : `usr-${Date.now()}`,
      email: data.email,
      firstName: data.firstName || 'Platform',
      lastName: data.lastName || 'Engineer',
      role: (data.role || 'DEVELOPER').toUpperCase(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    if (!existing) {
      users.push(newUser);
      setStored(STORAGE_KEYS.USERS, users);
    }

    // Add audit entry
    const audit = getStored<any[]>(STORAGE_KEYS.AUDIT, []);
    audit.unshift({
      id: `aud-${Date.now()}`,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: newUser.id,
      actorEmail: newUser.email,
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
    });
    setStored(STORAGE_KEYS.AUDIT, audit);

    return {
      access_token: `idp_mock_token_${Date.now()}`,
      refresh_token: `idp_mock_refresh_${Date.now()}`,
      user: newUser,
    };
  }

  if (cleanPath === '/auth/login' && normalizedMethod === 'POST') {
    const users = getStored<MockUser[]>(STORAGE_KEYS.USERS, []);
    let user = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());

    if (!user) {
      // Auto-provision user session for easy authentication
      const emailParts = data.email.split('@')[0].split('.');
      const firstName = emailParts[0] ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : 'User';
      const lastName = emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : 'Engineer';

      user = {
        id: `usr-${Date.now()}`,
        email: data.email,
        firstName,
        lastName,
        role: 'DEVELOPER',
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

  if (cleanPath === '/auth/demo-login' && normalizedMethod === 'POST') {
    const role = (data.role || 'DEVELOPER').toUpperCase();
    const demoUser: MockUser = {
      id: `usr-demo-${role.toLowerCase()}`,
      email: `${role.toLowerCase()}@platform.internal`,
      firstName: role === 'ADMIN' ? 'Anushka' : role === 'DEVELOPER' ? 'Lead' : 'Guest',
      lastName: role === 'ADMIN' ? 'Chaudhary' : 'Engineer',
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    return {
      access_token: `idp_mock_token_${Date.now()}`,
      refresh_token: `idp_mock_refresh_${Date.now()}`,
      user: demoUser,
    };
  }

  if (cleanPath === '/auth/logout') {
    return { success: true };
  }

  if (cleanPath === '/auth/forgot-password') {
    return { message: 'If the email exists, a password reset link has been dispatched.' };
  }

  if (cleanPath === '/auth/reset-password') {
    return { message: 'Password has been updated successfully.' };
  }

  // 2. Dashboard Metrics
  if (cleanPath === '/dashboard/metrics') {
    const services = getStored<any[]>(STORAGE_KEYS.SERVICES, defaultServices);
    const deployments = getStored<any[]>(STORAGE_KEYS.DEPLOYMENTS, defaultDeployments);

    const healthyCount = services.filter((s) => s.status === 'HEALTHY').length;
    const degradedCount = services.filter((s) => s.status === 'DEGRADED').length;
    const downCount = services.filter((s) => s.status === 'DOWN').length;
    const successfulCount = deployments.filter((d) => d.status === 'SUCCESS').length;
    const failedCount = deployments.filter((d) => d.status === 'FAILED').length;
    const totalDeps = deployments.length;
    const successRate = totalDeps > 0 ? ((successfulCount / totalDeps) * 100).toFixed(1) : '100.0';

    return {
      totalServices: services.length,
      healthyServices: healthyCount,
      degradedServices: degradedCount,
      downServices: downCount,
      totalDeployments: totalDeps,
      activeDeployments: deployments.filter((d) => ['QUEUED', 'BUILDING', 'TESTING', 'DEPLOYING'].includes(d.status)).length,
      successfulDeployments: successfulCount,
      failedDeployments: failedCount,
      successRate: parseFloat(successRate),
      avgDuration: 46,
      deploymentsPerDay: [
        { date: '2026-09-08', count: 4 },
        { date: '2026-09-09', count: 7 },
        { date: '2026-09-10', count: 5 },
        { date: '2026-09-11', count: 9 },
        { date: '2026-09-12', count: 6 },
        { date: '2026-09-13', count: 8 },
        { date: '2026-09-14', count: 12 },
      ],
    };
  }

  // 3. Services
  if (cleanPath === '/services' && normalizedMethod === 'GET') {
    return getStored<any[]>(STORAGE_KEYS.SERVICES, defaultServices);
  }

  if (cleanPath === '/services' && normalizedMethod === 'POST') {
    const services = getStored<any[]>(STORAGE_KEYS.SERVICES, defaultServices);
    const newService = {
      id: `srv-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      environment: data.environment || 'production',
      version: data.version || 'v1.0.0',
      port: data.port || 8080,
      status: 'HEALTHY',
      healthEndpoint: data.healthEndpoint || '/health',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    services.unshift(newService);
    setStored(STORAGE_KEYS.SERVICES, services);

    // Audit log
    const audit = getStored<any[]>(STORAGE_KEYS.AUDIT, []);
    audit.unshift({
      id: `aud-${Date.now()}`,
      action: 'SERVICE_CREATED',
      entityType: 'Service',
      entityId: newService.id,
      actorEmail: 'current_user',
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
    });
    setStored(STORAGE_KEYS.AUDIT, audit);

    return newService;
  }

  // GET /services/:id
  const serviceDetailMatch = cleanPath.match(/^\/services\/([^/?]+)$/);
  if (serviceDetailMatch && normalizedMethod === 'GET') {
    const serviceId = serviceDetailMatch[1];
    const services = getStored<any[]>(STORAGE_KEYS.SERVICES, defaultServices);
    const s = services.find((item) => item.id === serviceId);
    if (s) return s;
    return services[0] || null;
  }

  // DELETE /services/:id
  if (serviceDetailMatch && normalizedMethod === 'DELETE') {
    const serviceId = serviceDetailMatch[1];
    let services = getStored<any[]>(STORAGE_KEYS.SERVICES, defaultServices);
    services = services.filter((item) => item.id !== serviceId);
    setStored(STORAGE_KEYS.SERVICES, services);
    return { success: true };
  }

  // POST /services/:id/health-check
  const healthCheckMatch = cleanPath.match(/^\/services\/([^/?]+)\/health-check$/);
  if (healthCheckMatch && normalizedMethod === 'POST') {
    const serviceId = healthCheckMatch[1];
    const services = getStored<any[]>(STORAGE_KEYS.SERVICES, defaultServices);
    const s = services.find((item) => item.id === serviceId);
    if (s) {
      s.status = 'HEALTHY';
      s.updatedAt = new Date().toISOString();
      setStored(STORAGE_KEYS.SERVICES, services);
    }
    return { status: 'HEALTHY', latencyMs: Math.floor(Math.random() * 50) + 15 };
  }

  // 4. Deployments
  if (cleanPath.startsWith('/deployments') && normalizedMethod === 'GET') {
    const urlParams = new URLSearchParams(cleanPath.split('?')[1] || '');
    const serviceId = urlParams.get('serviceId');
    const deployments = getStored<any[]>(STORAGE_KEYS.DEPLOYMENTS, defaultDeployments);

    if (serviceId) {
      return deployments.filter((d) => d.serviceId === serviceId);
    }
    return deployments;
  }

  // POST /deployments
  if (cleanPath === '/deployments' && normalizedMethod === 'POST') {
    const deployments = getStored<any[]>(STORAGE_KEYS.DEPLOYMENTS, defaultDeployments);
    const services = getStored<any[]>(STORAGE_KEYS.SERVICES, defaultServices);
    const s = services.find((srv) => srv.id === data.serviceId) || services[0];

    const newDep = {
      id: `dep-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceId: s.id,
      version: data.version || 'v2.0.0',
      commitHash: (data.commitHash || Math.random().toString(16).substring(2, 9)),
      environment: data.environment || 'production',
      status: 'SUCCESS',
      currentStep: 'COMPLETED',
      progressPercentage: 100,
      durationSeconds: 42,
      logs: `[QUEUED] Job enqueued to BullMQ Redis\n[BUILD] Docker image built successfully\n[TEST] All unit & integration tests passed\n[DEPLOY] Container rolling rollout completed\n[HEALTH] Probe returned HTTP 200\n[SUCCESS] Production traffic enabled.`,
      isRollback: false,
      createdAt: new Date().toISOString(),
      service: {
        id: s.id,
        name: s.name,
        environment: s.environment,
        healthEndpoint: s.healthEndpoint,
      },
    };

    deployments.unshift(newDep);
    setStored(STORAGE_KEYS.DEPLOYMENTS, deployments);

    // Update service version
    if (s) {
      s.version = newDep.version;
      setStored(STORAGE_KEYS.SERVICES, services);
    }

    return newDep;
  }

  // GET /deployments/:id
  const depDetailMatch = cleanPath.match(/^\/deployments\/([^/?]+)$/);
  if (depDetailMatch && normalizedMethod === 'GET') {
    const depId = depDetailMatch[1];
    const deployments = getStored<any[]>(STORAGE_KEYS.DEPLOYMENTS, defaultDeployments);
    const dep = deployments.find((d) => d.id === depId);
    if (dep) return dep;
    return deployments[0] || null;
  }

  // POST /deployments/:id/rollback
  const rollbackMatch = cleanPath.match(/^\/deployments\/([^/?]+)\/rollback$/);
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
      status: 'SUCCESS',
      currentStep: 'COMPLETED',
      progressPercentage: 100,
      durationSeconds: 32,
      logs: `[ROLLBACK] Triggering forward rollback of ${depId}\n[DEPLOY] Restoring previous verified container state\n[HEALTH] Zero downtime health verification passed\n[SUCCESS] Rollback completed.`,
      isRollback: true,
      rollbackOfDeploymentId: depId,
      createdAt: new Date().toISOString(),
      service: original.service,
    };

    deployments.unshift(rollbackDep);
    setStored(STORAGE_KEYS.DEPLOYMENTS, deployments);
    return rollbackDep;
  }

  // 5. Feature Flags
  if (cleanPath === '/feature-flags' && normalizedMethod === 'GET') {
    return getStored<any[]>(STORAGE_KEYS.FLAGS, defaultFlags);
  }

  if (cleanPath === '/feature-flags' && normalizedMethod === 'POST') {
    const flags = getStored<any[]>(STORAGE_KEYS.FLAGS, defaultFlags);
    const newFlag = {
      id: `flag-${Date.now()}`,
      key: data.key,
      name: data.name,
      description: data.description || '',
      isEnabled: !!data.isEnabled,
      rolloutPercentage: data.rolloutPercentage ?? 100,
      targetEnvironments: data.targetEnvironments || ['production'],
      targetRoles: data.targetRoles || ['ADMIN', 'DEVELOPER'],
      createdAt: new Date().toISOString(),
    };
    flags.unshift(newFlag);
    setStored(STORAGE_KEYS.FLAGS, flags);
    return newFlag;
  }

  const flagToggleMatch = cleanPath.match(/^\/feature-flags\/([^/?]+)\/toggle$/);
  if (flagToggleMatch && normalizedMethod === 'POST') {
    const flagId = flagToggleMatch[1];
    const flags = getStored<any[]>(STORAGE_KEYS.FLAGS, defaultFlags);
    const f = flags.find((item) => item.id === flagId);
    if (f) {
      f.isEnabled = !f.isEnabled;
      setStored(STORAGE_KEYS.FLAGS, flags);
      return f;
    }
    return { success: true };
  }

  const flagDeleteMatch = cleanPath.match(/^\/feature-flags\/([^/?]+)$/);
  if (flagDeleteMatch && normalizedMethod === 'DELETE') {
    const flagId = flagDeleteMatch[1];
    let flags = getStored<any[]>(STORAGE_KEYS.FLAGS, defaultFlags);
    flags = flags.filter((item) => item.id !== flagId);
    setStored(STORAGE_KEYS.FLAGS, flags);
    return { success: true };
  }

  // 6. Logs & Audit
  if (cleanPath.startsWith('/logs')) {
    return getStored<any[]>(STORAGE_KEYS.LOGS, defaultLogs);
  }

  if (cleanPath.startsWith('/audit')) {
    return getStored<any[]>(STORAGE_KEYS.AUDIT, defaultAudit);
  }

  // 7. Users
  if (cleanPath.startsWith('/users') && normalizedMethod === 'GET') {
    const users = getStored<MockUser[]>(STORAGE_KEYS.USERS, []);
    return {
      data: users.length > 0 ? users : [
        {
          id: 'usr-anushka',
          email: 'chaudharyanushka085@gmail.com',
          firstName: 'Anushka',
          lastName: 'Chaudhary',
          role: 'ADMIN',
          isActive: true,
          createdAt: new Date().toISOString(),
        }
      ],
      total: users.length || 1,
    };
  }

  return { success: true };
}

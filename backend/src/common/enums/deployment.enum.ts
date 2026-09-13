export enum DeploymentStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

export enum DeploymentStep {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  BUILDING = 'BUILDING',
  TESTING = 'TESTING',
  DEPLOYING = 'DEPLOYING',
  HEALTH_CHECK = 'HEALTH_CHECK',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}


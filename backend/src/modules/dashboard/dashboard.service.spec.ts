import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Service } from '../services/service.entity';
import { Deployment } from '../deployments/deployment.entity';
import { FeatureFlag } from '../feature-flags/feature-flag.entity';

describe('DashboardService (unit)', () => {
  let service: DashboardService;
  let servicesRepoMock: any;
  let deploymentsRepoMock: any;
  let featureFlagsRepoMock: any;

  beforeEach(async () => {
    servicesRepoMock = {
      count: jest.fn().mockImplementation((opts?: any) => {
        const where = opts?.where;
        if (!where) return Promise.resolve(10);
        if (where.healthStatus === 'healthy') return Promise.resolve(8);
        if (where.healthStatus === 'degraded') return Promise.resolve(1);
        if (where.healthStatus === 'down') return Promise.resolve(1);
        return Promise.resolve(0);
      }),
    };

    const qbMock: any = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ avgDuration: '45' }),
      getMany: jest.fn().mockResolvedValue([
        { id: 'dep-1', createdAt: new Date(), status: 'success' },
      ]),
    };

    deploymentsRepoMock = {
      count: jest.fn().mockImplementation((opts?: any) => {
        const where = opts?.where;
        if (!where) return Promise.resolve(50);
        if (where.status === 'success') return Promise.resolve(45);
        if (where.status === 'failed') return Promise.resolve(5);
        return Promise.resolve(0);
      }),
      find: jest.fn().mockResolvedValue([
        { id: 'dep-1', durationSeconds: 60, status: 'success', createdAt: new Date() },
        { id: 'dep-2', durationSeconds: 40, status: 'success', createdAt: new Date() },
      ]),
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
    };

    featureFlagsRepoMock = {
      count: jest.fn().mockResolvedValue(12),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Service), useValue: servicesRepoMock },
        { provide: getRepositoryToken(Deployment), useValue: deploymentsRepoMock },
        { provide: getRepositoryToken(FeatureFlag), useValue: featureFlagsRepoMock },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should compute real database metrics without random data', async () => {
    const metrics = await service.getMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.overview.totalServices).toBe(10);
    expect(metrics.overview.healthyServices).toBe(8);
    expect(metrics.overview.degradedServices).toBe(1);
    expect(metrics.overview.downServices).toBe(1);
    expect(metrics.overview.totalDeployments).toBe(50);
    expect(metrics.overview.successfulDeployments).toBe(45);
    expect(metrics.overview.failedDeployments).toBe(5);
    expect(metrics.overview.deploymentSuccessRate).toBe(90);
    expect(metrics.overview.totalFeatureFlags).toBe(12);
    expect(metrics.serviceHealthDistribution).toHaveLength(3);
    expect(metrics.deploymentTrends).toHaveLength(7);
  });

  it('should handle zero deployments gracefully with 100% success rate default', async () => {
    deploymentsRepoMock.count.mockResolvedValue(0);
    deploymentsRepoMock.find.mockResolvedValue([]);
    deploymentsRepoMock.createQueryBuilder().getRawOne.mockResolvedValue({ avgDuration: null });

    const metrics = await service.getMetrics();

    expect(metrics.overview.totalDeployments).toBe(0);
    expect(metrics.overview.deploymentSuccessRate).toBe(100);
    expect(metrics.overview.averageDeploymentDurationSeconds).toBe(0);
  });
});

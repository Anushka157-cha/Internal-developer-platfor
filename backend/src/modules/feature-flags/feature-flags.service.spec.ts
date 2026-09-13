import { FeatureFlagsService } from './feature-flags.service';

describe('FeatureFlagsService (unit)', () => {
  let service: FeatureFlagsService;
  let repoMock: any;
  let auditMock: any;

  beforeEach(() => {
    repoMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };
    auditMock = { log: jest.fn() };
    service = new FeatureFlagsService(repoMock as any, auditMock as any);
  });

  it('evaluate returns disabled when feature not enabled', async () => {
    repoMock.findOne.mockResolvedValue({ enabled: false } as any);
    const res = await service.evaluate({ flagKey: 'k', environment: 'prod' } as any);
    expect(res.enabled).toBe(false);
  });

  it('evaluate respects rollout percentage', async () => {
    // full rollout
    repoMock.findOne.mockResolvedValue({ enabled: true, environments: [], rolloutPercentage: 100 } as any);
    const r1 = await service.evaluate({ flagKey: 'k', userId: 'u1', environment: 'prod' } as any);
    expect(r1.enabled).toBe(true);

    // zero rollout
    repoMock.findOne.mockResolvedValue({ enabled: true, environments: [], rolloutPercentage: 0 } as any);
    const r2 = await service.evaluate({ flagKey: 'k', userId: 'u1', environment: 'prod' } as any);
    expect(r2.enabled).toBe(false);
  });

  it('evaluate returns environment rollout mismatch', async () => {
    repoMock.findOne.mockResolvedValue({ enabled: true, environments: ['staging'], rolloutPercentage: 100 } as any);
    const res = await service.evaluate({ flagKey: 'k', userId: 'u1', environment: 'prod' } as any);
    expect(res.enabled).toBe(false);
    expect(res.reason).toContain('ENVIRONMENT_MISMATCH');
  });
});

import { ServicesService } from './services.service';
import { ServiceHealthStatus } from '../../common/enums/service.enum';

describe('ServicesService (unit)', () => {
  let service: ServicesService;
  let repoMock: any;
  let auditMock: any;

  beforeEach(() => {
    repoMock = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    auditMock = { log: jest.fn() };

    service = new ServicesService(repoMock as any, auditMock as any);
  });

  it('creates a service and logs audit', async () => {
    const dto = { name: 'svc' } as any;
    const created = { id: '1', name: 'svc' } as any;
    repoMock.create.mockReturnValue(created);
    repoMock.save.mockResolvedValue(created);

    const res = await service.create(dto, 'user-1');

    expect(repoMock.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'svc', ownerId: 'user-1' }));
    expect(repoMock.save).toHaveBeenCalled();
    expect(auditMock.log).toHaveBeenCalled();
    expect(res).toBe(created);
  });

  it('findOne throws when not found', async () => {
    repoMock.findOne.mockResolvedValue(null);
    await expect(service.findOne('nope')).rejects.toThrow();
  });

  it('update throws when user not permitted', async () => {
    const svc = { id: '1', ownerId: 'owner', name: 'x' } as any;
    service.findOne = jest.fn().mockResolvedValue(svc) as any;

    await expect(service.update('1', { name: 'y' } as any, 'other', 'DEVELOPER' as any)).rejects.toThrow();
  });

  it('findAll returns list', async () => {
    repoMock.find.mockResolvedValue([{ id: '1' }] as any);
    const r = await service.findAll();
    expect(r).toHaveLength(1);
  });

  it('updateHealthStatus saves and returns', async () => {
    const svc = { id: '1', healthStatus: ServiceHealthStatus.HEALTHY } as any;
    service.findOne = jest.fn().mockResolvedValue(svc) as any;
    repoMock.save.mockResolvedValue({ ...svc, healthStatus: ServiceHealthStatus.DEGRADED });

    const out = await service.updateHealthStatus('1', ServiceHealthStatus.DEGRADED);
    expect(out.healthStatus).toBe(ServiceHealthStatus.DEGRADED);
  });
});

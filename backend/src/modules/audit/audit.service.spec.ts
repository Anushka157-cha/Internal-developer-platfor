import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './audit-log.entity';
import { AuditSeverity } from '../../common/enums/audit-severity.enum';

describe('AuditService (unit)', () => {
  let service: AuditService;
  let repoMock: any;

  beforeEach(async () => {
    const qbMock: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          { id: 'aud-1', action: 'USER_LOGIN', actorId: 'u-1', severity: AuditSeverity.INFO },
          { id: 'aud-2', action: 'SERVICE_DELETE', actorId: 'u-1', severity: AuditSeverity.WARNING },
        ],
        2,
      ]),
    };

    repoMock = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'aud-new', ...dto })),
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: repoMock },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should record an audit event and assign severity if missing', async () => {
    const audit = await service.log({
      action: 'DEPLOYMENT_TRIGGERED',
      actorId: 'u-1',
      metadata: { version: 'v1.2.0' },
    });

    expect(audit).toBeDefined();
    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DEPLOYMENT_TRIGGERED',
        severity: expect.any(String),
      }),
    );
    expect(repoMock.save).toHaveBeenCalled();
  });

  it('should find paginated audit records', async () => {
    const res = await service.findAll({
      action: 'USER_LOGIN',
      actorId: 'u-1',
      page: 1,
      limit: 20,
    });

    expect(res.data).toHaveLength(2);
    expect(res.meta.total).toBe(2);
    expect(res.meta.page).toBe(1);
  });
});

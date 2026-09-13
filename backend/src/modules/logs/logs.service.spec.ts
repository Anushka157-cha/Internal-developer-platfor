import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LogsService } from './logs.service';
import { Log } from './log.entity';
import { LogLevel } from '../../common/enums/log.enum';

describe('LogsService (unit)', () => {
  let service: LogsService;
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
          { id: 'l-1', message: 'Starting build step', level: LogLevel.INFO },
          { id: 'l-2', message: 'Build failed with code 1', level: LogLevel.ERROR },
        ],
        2,
      ]),
    };

    repoMock = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'l-new', ...dto })),
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogsService,
        { provide: getRepositoryToken(Log), useValue: repoMock },
      ],
    }).compile();

    service = module.get<LogsService>(LogsService);
  });

  it('should create and persist a log entry', async () => {
    const log = await service.create({
      serviceId: 'srv-1',
      level: LogLevel.INFO,
      message: 'Container started',
    });

    expect(log).toBeDefined();
    expect(repoMock.create).toHaveBeenCalled();
    expect(repoMock.save).toHaveBeenCalled();
  });

  it('should find paginated logs with filters', async () => {
    const res = await service.findAll({
      serviceId: 'srv-1',
      level: LogLevel.ERROR,
      search: 'failed',
      page: 1,
      limit: 10,
    });

    expect(res.data).toHaveLength(2);
    expect(res.meta.total).toBe(2);
    expect(res.meta.page).toBe(1);
    expect(res.meta.totalPages).toBe(1);
  });
});

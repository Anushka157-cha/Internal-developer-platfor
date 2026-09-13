import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from './log.entity';
import { CreateLogDto } from './dto/create-log.dto';
import { LogLevel } from '../../common/enums/log.enum';

export interface PaginatedLogsResult {
  data: Log[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log)
    private logsRepository: Repository<Log>,
  ) {}

  async create(createLogDto: CreateLogDto): Promise<Log> {
    const log = this.logsRepository.create(createLogDto);
    return this.logsRepository.save(log);
  }

  async findAll(query?: {
    serviceId?: string;
    level?: LogLevel;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedLogsResult> {
    const page = query?.page || 1;
    const limit = query?.limit || 50;

    const qb = this.logsRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.service', 'service')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query?.serviceId) {
      qb.andWhere('log.serviceId = :serviceId', { serviceId: query.serviceId });
    }

    if (query?.level) {
      qb.andWhere('log.level = :level', { level: query.level });
    }

    if (query?.search) {
      qb.andWhere('LOWER(log.message) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    if (query?.startDate) {
      qb.andWhere('log.createdAt >= :startDate', { startDate: new Date(query.startDate) });
    }

    if (query?.endDate) {
      qb.andWhere('log.createdAt <= :endDate', { endDate: new Date(query.endDate) });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByService(serviceId: string, limit: number = 50): Promise<Log[]> {
    return this.logsRepository.find({
      where: { serviceId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

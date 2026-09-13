import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { getSeverityFromAction } from '../../common/utils/audit-helpers';

export interface PaginatedAuditResult {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
  ) {}

  async log(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    if (!createAuditLogDto.severity) {
      createAuditLogDto.severity = getSeverityFromAction(createAuditLogDto.action);
    }
    
    const auditLog = this.auditLogsRepository.create(createAuditLogDto);
    return this.auditLogsRepository.save(auditLog);
  }

  async findAll(query?: {
    action?: string;
    actorId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedAuditResult> {
    const page = query?.page || 1;
    const limit = query?.limit || 50;

    const qb = this.auditLogsRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.actor', 'actor')
      .orderBy('audit.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query?.action) {
      qb.andWhere('audit.action = :action', { action: query.action });
    }

    if (query?.actorId) {
      qb.andWhere('audit.actorId = :actorId', { actorId: query.actorId });
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

  async findByActor(actorId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogsRepository.find({
      where: { actorId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['actor'],
    });
  }

  async findByAction(action: string, limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogsRepository.find({
      where: { action },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['actor'],
    });
  }
}

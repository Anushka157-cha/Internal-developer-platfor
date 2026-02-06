import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { getSeverityFromAction } from '../../common/utils/audit-helpers';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
  ) {}

  async log(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    // Auto-detect severity if not provided
    if (!createAuditLogDto.severity) {
      createAuditLogDto.severity = getSeverityFromAction(createAuditLogDto.action);
    }
    
    const auditLog = this.auditLogsRepository.create(createAuditLogDto);
    return this.auditLogsRepository.save(auditLog);
  }

  async findAll(limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogsRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByActor(actorId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogsRepository.find({
      where: { actorId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByAction(action: string, limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogsRepository.find({
      where: { action },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

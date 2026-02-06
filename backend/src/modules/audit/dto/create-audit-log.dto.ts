import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { AuditSeverity } from '../../../common/enums/audit-severity.enum';

export class CreateAuditLogDto {
  @IsString()
  action: string;

  @IsEnum(AuditSeverity)
  @IsOptional()
  severity?: AuditSeverity;

  @IsUUID()
  actorId: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}

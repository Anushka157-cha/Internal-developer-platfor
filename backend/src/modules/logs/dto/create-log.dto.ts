import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { LogLevel } from '../../../common/enums/log.enum';

export class CreateLogDto {
  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @IsEnum(LogLevel)
  level: LogLevel;

  @IsString()
  message: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

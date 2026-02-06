import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ServiceEnvironment } from '../../../common/enums/service.enum';

export class EvaluateFeatureFlagDto {
  @IsString()
  flagKey: string;

  @IsEnum(ServiceEnvironment)
  environment: ServiceEnvironment;

  @IsString()
  @IsOptional()
  userId?: string;
}

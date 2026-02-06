import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { ServiceEnvironment, ServiceHealthStatus } from '../../../common/enums/service.enum';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  repositoryUrl: string;

  @IsEnum(ServiceEnvironment)
  environment: ServiceEnvironment;

  @IsEnum(ServiceHealthStatus)
  @IsOptional()
  healthStatus?: ServiceHealthStatus;

  @IsString()
  @IsOptional()
  version?: string;
}

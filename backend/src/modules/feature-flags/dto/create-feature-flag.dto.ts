import { IsString, IsBoolean, IsOptional, IsEnum, IsInt, Min, Max, IsArray } from 'class-validator';
import { ServiceEnvironment } from '../../../common/enums/service.enum';

export class CreateFeatureFlagDto {
  @IsString()
  key: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsArray()
  @IsEnum(ServiceEnvironment, { each: true })
  @IsOptional()
  environments?: ServiceEnvironment[];

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  rolloutPercentage?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}

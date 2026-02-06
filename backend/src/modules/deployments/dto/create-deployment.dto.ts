import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateDeploymentDto {
  @IsUUID()
  serviceId: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  commitHash?: string;
}

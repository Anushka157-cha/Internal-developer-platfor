import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class DemoLoginDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.DEVELOPER;
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  findAll(@Query('limit') limit?: string) {
    return this.auditService.findAll(limit ? parseInt(limit) : 100);
  }

  @Get('by-actor')
  @Roles(UserRole.ADMIN)
  findByActor(
    @Query('actorId') actorId: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findByActor(actorId, limit ? parseInt(limit) : 50);
  }

  @Get('by-action')
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  findByAction(
    @Query('action') action: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findByAction(action, limit ? parseInt(limit) : 50);
  }
}

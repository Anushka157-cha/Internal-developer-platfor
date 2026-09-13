import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuditService } from '../audit/audit.service';
import { AuditSeverity } from '../../common/enums/audit-severity.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.usersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @Request() req,
  ) {
    const updated = await this.usersService.updateRole(id, role);
    await this.auditService.log({
      action: 'USER_ROLE_CHANGED',
      severity: AuditSeverity.WARNING,
      actorId: req.user.id,
      metadata: { targetUserId: id, newRole: role },
    });
    return updated;
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Request() req,
  ) {
    const updated = await this.usersService.updateStatus(id, isActive);
    await this.auditService.log({
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      severity: AuditSeverity.WARNING,
      actorId: req.user.id,
      metadata: { targetUserId: id, isActive },
    });
    return updated;
  }
}

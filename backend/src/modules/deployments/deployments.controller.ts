import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  Sse,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DeploymentsService } from './deployments.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { DeploymentStatus } from '../../common/enums/deployment.enum';

@Controller('deployments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  create(@Body() createDeploymentDto: CreateDeploymentDto, @Request() req) {
    return this.deploymentsService.create(createDeploymentDto, req.user.id);
  }

  @Get()
  findAll(
    @Query('serviceId') serviceId?: string,
    @Query('status') status?: DeploymentStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.deploymentsService.findAll({
      serviceId,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deploymentsService.findOne(id);
  }

  @Post(':id/rollback')
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  rollback(@Param('id') id: string, @Request() req) {
    return this.deploymentsService.rollback(id, req.user.id);
  }

  // Server-Sent Events (SSE) endpoint for real-time progress and logs
  @Sse(':id/stream')
  streamEvents(@Param('id') id: string): Observable<MessageEvent> {
    return this.deploymentsService.getDeploymentStream(id);
  }
}

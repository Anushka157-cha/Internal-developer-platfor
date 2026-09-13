import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService, DashboardMetrics } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  getMetrics(): Promise<DashboardMetrics> {
    return this.dashboardService.getMetrics();
  }
}

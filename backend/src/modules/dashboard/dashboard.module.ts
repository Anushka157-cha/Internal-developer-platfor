import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Service } from '../services/service.entity';
import { Deployment } from '../deployments/deployment.entity';
import { FeatureFlag } from '../feature-flags/feature-flag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Deployment, FeatureFlag])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

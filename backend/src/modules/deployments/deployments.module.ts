import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { DeploymentsService } from './deployments.service';
import { DeploymentsController } from './deployments.controller';
import { Deployment } from './deployment.entity';
import { DeploymentProcessor } from './deployment.processor';
import { ServicesModule } from '../services/services.module';
import { LogsModule } from '../logs/logs.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deployment]),
    // TEMPORARILY DISABLED - Install Redis or Docker to enable async deployments
    // BullModule.registerQueue({
    //   name: 'deployments',
    // }),
    ServicesModule,
    LogsModule,
    AuditModule,
  ],
  controllers: [DeploymentsController],
  providers: [DeploymentsService, DeploymentProcessor],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}

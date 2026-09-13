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
    BullModule.registerQueue({
      name: 'deployments',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    }),
    ServicesModule,
    LogsModule,
    AuditModule,
  ],
  controllers: [DeploymentsController],
  providers: [DeploymentsService, DeploymentProcessor],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}

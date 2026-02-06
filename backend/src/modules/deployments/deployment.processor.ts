import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DeploymentsService } from './deployments.service';
import { DeploymentStatus } from '../../common/enums/deployment.enum';
import { LogsService } from '../logs/logs.service';
import { ServiceHealthStatus } from '../../common/enums/service.enum';
import { ServicesService } from '../services/services.service';
import { LogLevel } from '../../common/enums/log.enum';

@Processor('deployments')
export class DeploymentProcessor extends WorkerHost {
  constructor(
    private deploymentsService: DeploymentsService,
    private logsService: LogsService,
    private servicesService: ServicesService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { deploymentId } = job.data;

    try {
      // Update status to RUNNING
      const deployment = await this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatus.RUNNING,
        'Deployment started...'
      );

      // Log deployment start
      await this.logsService.create({
        serviceId: deployment.serviceId,
        message: `Deployment ${deploymentId} started`,
        level: LogLevel.INFO,
        metadata: { deploymentId },
      });

      // Simulate deployment steps
      const steps = [
        { message: 'Pulling code from repository...', duration: 2000 },
        { message: 'Installing dependencies...', duration: 3000 },
        { message: 'Running tests...', duration: 2500 },
        { message: 'Building application...', duration: 3500 },
        { message: 'Deploying to environment...', duration: 2000 },
        { message: 'Running health checks...', duration: 1500 },
      ];

      let logs = 'Deployment started...\n';

      for (const step of steps) {
        await this.sleep(step.duration);
        logs += `${step.message}\n`;
        
        await this.deploymentsService.updateStatus(
          deploymentId,
          DeploymentStatus.RUNNING,
          logs
        );

        // Update job progress
        const progress = (steps.indexOf(step) + 1) / steps.length * 100;
        await job.updateProgress(progress);
      }

      // Randomly determine success or failure (90% success rate)
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        logs += 'Deployment completed successfully!\n';
        await this.deploymentsService.updateStatus(
          deploymentId,
          DeploymentStatus.SUCCESS,
          logs
        );

        // Update service health to healthy
        await this.servicesService.updateHealthStatus(
          deployment.serviceId,
          ServiceHealthStatus.HEALTHY
        );

        await this.logsService.create({
          serviceId: deployment.serviceId,
          message: `Deployment ${deploymentId} completed successfully`,
          level: LogLevel.INFO,
          metadata: { deploymentId },
        });
      } else {
        logs += 'ERROR: Deployment failed! Rolling back...\n';
        await this.deploymentsService.updateStatus(
          deploymentId,
          DeploymentStatus.FAILED,
          logs
        );

        // Update service health to degraded
        await this.servicesService.updateHealthStatus(
          deployment.serviceId,
          ServiceHealthStatus.DEGRADED
        );

        await this.logsService.create({
          serviceId: deployment.serviceId,
          message: `Deployment ${deploymentId} failed`,
          level: LogLevel.ERROR,
          metadata: { deploymentId },
        });
      }

      return { deploymentId, status: isSuccess ? 'success' : 'failed' };
    } catch (error) {
      console.error('Deployment processing error:', error);
      
      await this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatus.FAILED,
        `Error: ${error.message}`
      );

      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

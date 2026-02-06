import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { InjectQueue } from '@nestjs/bullmq';
// import { Queue } from 'bullmq';
import { Deployment } from './deployment.entity';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { DeploymentStatus } from '../../common/enums/deployment.enum';
import { ServicesService } from '../services/services.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DeploymentsService {
  constructor(
    @InjectRepository(Deployment)
    private deploymentsRepository: Repository<Deployment>,
    // @InjectQueue('deployments')
    // private deploymentsQueue: Queue,
    private servicesService: ServicesService,
    private auditService: AuditService,
  ) {}

  async create(createDeploymentDto: CreateDeploymentDto, userId: string): Promise<Deployment> {
    // Verify service exists
    await this.servicesService.findOne(createDeploymentDto.serviceId);

    const deployment = this.deploymentsRepository.create({
      ...createDeploymentDto,
      triggeredById: userId,
      status: DeploymentStatus.PENDING,
    });

    const savedDeployment = await this.deploymentsRepository.save(deployment);

    // TEMPORARILY DISABLED - Process deployment synchronously without Redis
    // await this.deploymentsQueue.add('process-deployment', {
    //   deploymentId: savedDeployment.id,
    // });
    
    // Simulate deployment process without queue
    this.simulateDeployment(savedDeployment.id).catch(console.error);

    // Create audit log
    await this.auditService.log({
      action: 'DEPLOYMENT_TRIGGERED',
      actorId: userId,
      metadata: {
        deploymentId: savedDeployment.id,
        serviceId: createDeploymentDto.serviceId,
      },
    });

    return savedDeployment;
  }

  async findAll(serviceId?: string): Promise<Deployment[]> {
    const where = serviceId ? { serviceId } : {};
    return this.deploymentsRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async findOne(id: string): Promise<Deployment> {
    const deployment = await this.deploymentsRepository.findOne({
      where: { id },
      relations: ['service'],
    });

    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }

    return deployment;
  }

  async updateStatus(id: string, status: DeploymentStatus, logs?: string): Promise<Deployment> {
    const deployment = await this.findOne(id);
    
    deployment.status = status;
    
    if (logs) {
      deployment.logs = logs;
    }

    if (status === DeploymentStatus.RUNNING && !deployment.startedAt) {
      deployment.startedAt = new Date();
    }

    if (status === DeploymentStatus.SUCCESS || status === DeploymentStatus.FAILED) {
      deployment.completedAt = new Date();
      if (deployment.startedAt) {
        deployment.durationSeconds = Math.floor(
          (deployment.completedAt.getTime() - deployment.startedAt.getTime()) / 1000
        );
      }
    }

    return this.deploymentsRepository.save(deployment);
  }

  // Temporary method to simulate deployment without Redis queue
  private async simulateDeployment(deploymentId: string): Promise<void> {
    try {
      // Simulate deployment steps
      await this.updateStatus(deploymentId, DeploymentStatus.RUNNING, 'Starting deployment...\n');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.updateStatus(
        deploymentId,
        DeploymentStatus.RUNNING,
        'Starting deployment...\nBuilding application...\n'
      );
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.updateStatus(
        deploymentId,
        DeploymentStatus.RUNNING,
        'Starting deployment...\nBuilding application...\nRunning tests...\n'
      );
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.updateStatus(
        deploymentId,
        DeploymentStatus.RUNNING,
        'Starting deployment...\nBuilding application...\nRunning tests...\nDeploying to environment...\n'
      );
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.updateStatus(
        deploymentId,
        DeploymentStatus.SUCCESS,
        'Starting deployment...\nBuilding application...\nRunning tests...\nDeploying to environment...\n✓ Deployment completed successfully!\n'
      );
    } catch (error) {
      await this.updateStatus(
        deploymentId,
        DeploymentStatus.FAILED,
        `Deployment failed: ${error.message}\n`
      );
    }
  }
}

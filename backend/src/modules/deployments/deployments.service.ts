import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Deployment } from './deployment.entity';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { DeploymentStatus, DeploymentStep } from '../../common/enums/deployment.enum';
import { ServicesService } from '../services/services.service';
import { AuditService } from '../audit/audit.service';
import { Subject, Observable, filter, map } from 'rxjs';

export interface DeploymentStreamEvent {
  deploymentId: string;
  data: {
    status: DeploymentStatus;
    currentStep: DeploymentStep;
    progressPercentage: number;
    logs: string;
    durationSeconds?: number;
    failureReason?: string;
    timestamp: string;
  };
}

@Injectable()
export class DeploymentsService {
  private readonly logger = new Logger(DeploymentsService.name);
  private readonly deploymentEvents$ = new Subject<DeploymentStreamEvent>();

  constructor(
    @InjectRepository(Deployment)
    private deploymentsRepository: Repository<Deployment>,
    @InjectQueue('deployments')
    private deploymentsQueue: Queue,
    private servicesService: ServicesService,
    private auditService: AuditService,
  ) {
    if (this.deploymentsQueue && typeof this.deploymentsQueue.on === 'function') {
      this.deploymentsQueue.on('error', (err: any) => {
        this.logger.warn(`Deployments BullMQ queue warning: ${err?.message || err}`);
      });
    }
  }

  // Broadcast real-time SSE events to subscribers
  emitEvent(deploymentId: string, payload: any) {
    this.deploymentEvents$.next({
      deploymentId,
      data: {
        ...payload,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // SSE Observable stream for a specific deployment
  getDeploymentStream(deploymentId: string): Observable<MessageEvent> {
    return this.deploymentEvents$.asObservable().pipe(
      filter((event) => event.deploymentId === deploymentId),
      map((event) => ({
        data: event.data,
      } as unknown as MessageEvent)),
    );
  }

  async create(createDeploymentDto: CreateDeploymentDto, userId: string): Promise<Deployment> {
    const service = await this.servicesService.findOne(createDeploymentDto.serviceId);

    // Prevent concurrent deployments on the same service
    const activeDeployment = await this.deploymentsRepository.findOne({
      where: [
        { serviceId: service.id, status: DeploymentStatus.RUNNING },
        { serviceId: service.id, status: DeploymentStatus.QUEUED },
      ],
    });

    if (activeDeployment) {
      throw new BadRequestException(
        `A deployment is already active (${activeDeployment.id}) for service ${service.name}. Wait for it to finish.`,
      );
    }

    const deployment = this.deploymentsRepository.create({
      ...createDeploymentDto,
      environment: service.environment,
      version: createDeploymentDto.version || service.version || '1.0.0',
      triggeredById: userId,
      status: DeploymentStatus.QUEUED,
      currentStep: DeploymentStep.QUEUED,
      progressPercentage: 0,
      logs: `Deployment queued at ${new Date().toISOString()}...\n`,
    });

    const savedDeployment = await this.deploymentsRepository.save(deployment);

    // Enqueue BullMQ job with idempotency and retry configuration
    try {
      await this.deploymentsQueue.add(
        'process-deployment',
        {
          deploymentId: savedDeployment.id,
          serviceId: service.id,
          version: savedDeployment.version,
        },
        {
          jobId: `deploy-${savedDeployment.id}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
      this.logger.log(`Dispatched deployment job deploy-${savedDeployment.id} to BullMQ`);
    } catch (error: any) {
      this.logger.error(`Failed to dispatch job to BullMQ: ${error.message}`, error.stack);
      savedDeployment.status = DeploymentStatus.FAILED;
      savedDeployment.currentStep = DeploymentStep.FAILED;
      savedDeployment.failureReason = `Queue dispatch error: ${error.message}`;
      await this.deploymentsRepository.save(savedDeployment);

      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Critical Queue Dispatch Failure: ${error.message}`);
      }
    }

    // Create audit log
    await this.auditService.log({
      action: 'DEPLOYMENT_TRIGGERED',
      actorId: userId,
      metadata: {
        deploymentId: savedDeployment.id,
        serviceId: service.id,
        version: savedDeployment.version,
      },
    });

    return savedDeployment;
  }

  async rollback(deploymentId: string, userId: string): Promise<Deployment> {
    const targetDeployment = await this.findOne(deploymentId);

    if (targetDeployment.status !== DeploymentStatus.SUCCESS) {
      throw new BadRequestException('Rollback can only be initiated on a successfully completed deployment');
    }

    const service = await this.servicesService.findOne(targetDeployment.serviceId);

    // Find the previous successful deployment before this one
    const previousDeployments = await this.deploymentsRepository
      .createQueryBuilder('deployment')
      .where('deployment.serviceId = :serviceId', { serviceId: service.id })
      .andWhere('deployment.status = :status', { status: DeploymentStatus.SUCCESS })
      .andWhere('deployment.createdAt < :createdAt', { createdAt: targetDeployment.createdAt })
      .orderBy('deployment.createdAt', 'DESC')
      .take(1)
      .getMany();

    if (previousDeployments.length === 0) {
      throw new BadRequestException('No previous successful deployment found to roll back to');
    }

    const rollbackTarget = previousDeployments[0];

    const rollbackDeployment = this.deploymentsRepository.create({
      serviceId: service.id,
      version: rollbackTarget.version,
      commitHash: rollbackTarget.commitHash,
      environment: service.environment,
      triggeredById: userId,
      status: DeploymentStatus.QUEUED,
      currentStep: DeploymentStep.QUEUED,
      progressPercentage: 0,
      isRollback: true,
      rollbackOfDeploymentId: targetDeployment.id,
      logs: `Rollback deployment initiated to restore version ${rollbackTarget.version} (from deployment ${targetDeployment.id})...\n`,
    });

    const saved = await this.deploymentsRepository.save(rollbackDeployment);

    // Enqueue rollback in BullMQ
    try {
      await this.deploymentsQueue.add(
        'process-deployment',
        {
          deploymentId: saved.id,
          serviceId: service.id,
          version: rollbackTarget.version,
          isRollback: true,
        },
        {
          jobId: `rollback-${saved.id}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
    } catch (error: any) {
      saved.status = DeploymentStatus.FAILED;
      saved.failureReason = `Queue dispatch error: ${error.message}`;
      await this.deploymentsRepository.save(saved);
      throw new Error(`Failed to enqueue rollback: ${error.message}`);
    }

    // Record audit event
    await this.auditService.log({
      action: 'ROLLBACK_TRIGGERED',
      actorId: userId,
      metadata: {
        rollbackDeploymentId: saved.id,
        targetDeploymentId: targetDeployment.id,
        targetVersion: rollbackTarget.version,
        serviceId: service.id,
      },
    });

    return saved;
  }

  async findAll(query?: {
    serviceId?: string;
    status?: DeploymentStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: Deployment[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = query?.page || 1;
    const limit = query?.limit || 20;

    const qb = this.deploymentsRepository
      .createQueryBuilder('deployment')
      .leftJoinAndSelect('deployment.service', 'service')
      .leftJoinAndSelect('deployment.triggeredBy', 'triggeredBy')
      .orderBy('deployment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query?.serviceId) {
      qb.andWhere('deployment.serviceId = :serviceId', { serviceId: query.serviceId });
    }

    if (query?.status) {
      qb.andWhere('deployment.status = :status', { status: query.status });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Deployment> {
    const deployment = await this.deploymentsRepository.findOne({
      where: { id },
      relations: ['service', 'triggeredBy'],
    });

    if (!deployment) {
      throw new NotFoundException(`Deployment ${id} not found`);
    }

    return deployment;
  }

  async updateProgressAndStep(
    id: string,
    params: {
      status?: DeploymentStatus;
      currentStep?: DeploymentStep;
      progressPercentage?: number;
      logMessage?: string;
      failureReason?: string;
    },
  ): Promise<Deployment> {
    const deployment = await this.findOne(id);

    if (params.status) {
      // Validate state machine transitions
      this.validateTransition(deployment.status, params.status);
      deployment.status = params.status;
    }

    if (params.currentStep) {
      deployment.currentStep = params.currentStep;
    }

    if (typeof params.progressPercentage === 'number') {
      deployment.progressPercentage = params.progressPercentage;
    }

    if (params.logMessage) {
      deployment.logs = (deployment.logs || '') + params.logMessage + '\n';
    }

    if (params.failureReason) {
      deployment.failureReason = params.failureReason;
    }

    if (params.status === DeploymentStatus.RUNNING && !deployment.startedAt) {
      deployment.startedAt = new Date();
    }

    if (params.status === DeploymentStatus.SUCCESS || params.status === DeploymentStatus.FAILED) {
      deployment.completedAt = new Date();
      if (deployment.startedAt) {
        deployment.durationSeconds = Math.max(
          1,
          Math.floor((deployment.completedAt.getTime() - deployment.startedAt.getTime()) / 1000),
        );
      }
    }

    const saved = await this.deploymentsRepository.save(deployment);

    // Emit live SSE update
    this.emitEvent(id, {
      status: saved.status,
      currentStep: saved.currentStep,
      progressPercentage: saved.progressPercentage,
      logs: saved.logs,
      durationSeconds: saved.durationSeconds,
      failureReason: saved.failureReason,
    });

    return saved;
  }

  private validateTransition(from: DeploymentStatus, to: DeploymentStatus) {
    // If state doesn't change, allow
    if (from === to) return;

    // Terminal states cannot transition to active states
    if (from === DeploymentStatus.SUCCESS && to !== DeploymentStatus.ROLLED_BACK) {
      throw new BadRequestException(`Cannot transition from terminal state ${from} to ${to}`);
    }
    if (from === DeploymentStatus.FAILED) {
      throw new BadRequestException(`Cannot transition from failed state ${from} to ${to}`);
    }
  }
}

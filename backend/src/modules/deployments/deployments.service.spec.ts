import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { Deployment } from './deployment.entity';
import { ServicesService } from '../services/services.service';
import { AuditService } from '../audit/audit.service';
import { DeploymentStatus, DeploymentStep } from '../../common/enums/deployment.enum';
import { ServiceEnvironment } from '../../common/enums/service.enum';

describe('DeploymentsService (unit)', () => {
  let service: DeploymentsService;
  let repoMock: any;
  let queueMock: any;
  let servicesServiceMock: any;
  let auditServiceMock: any;

  const mockService = {
    id: 'service-1',
    name: 'payment-service',
    environment: ServiceEnvironment.PROD,
    currentVersion: 'v1.0.0',
  };

  beforeEach(async () => {
    const qbMock: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'deploy-1',
          serviceId: 'service-1',
          version: 'v1.0.0',
          commitHash: 'c1',
          status: DeploymentStatus.SUCCESS,
        },
      ]),
    };

    repoMock = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'deploy-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'deploy-1', ...entity })),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
    };

    queueMock = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      on: jest.fn(),
    };

    servicesServiceMock = {
      findOne: jest.fn().mockResolvedValue(mockService),
    };

    auditServiceMock = {
      log: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeploymentsService,
        { provide: getRepositoryToken(Deployment), useValue: repoMock },
        { provide: getQueueToken('deployments'), useValue: queueMock },
        { provide: ServicesService, useValue: servicesServiceMock },
        { provide: AuditService, useValue: auditServiceMock },
      ],
    }).compile();

    service = module.get<DeploymentsService>(DeploymentsService);
  });

  describe('create', () => {
    it('should create deployment and dispatch to BullMQ queue', async () => {
      repoMock.findOne.mockResolvedValueOnce(null); // no currently running deployment

      const result = await service.create(
        {
          serviceId: 'service-1',
          version: 'v1.1.0',
        },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(servicesServiceMock.findOne).toHaveBeenCalledWith('service-1');
      expect(repoMock.create).toHaveBeenCalled();
      expect(queueMock.add).toHaveBeenCalledWith(
        'process-deployment',
        expect.objectContaining({
          deploymentId: 'deploy-1',
          serviceId: 'service-1',
          version: 'v1.1.0',
        }),
        expect.any(Object),
      );
      expect(auditServiceMock.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException if another deployment is currently active', async () => {
      repoMock.findOne.mockResolvedValueOnce({
        id: 'active-deploy',
        status: DeploymentStatus.RUNNING,
      });

      await expect(
        service.create(
          {
            serviceId: 'service-1',
            version: 'v1.1.0',
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('state transitions and progress updates', () => {
    it('should validate legal transitions in the lifecycle', async () => {
      const existing = {
        id: 'deploy-1',
        status: DeploymentStatus.QUEUED,
        serviceId: 'service-1',
        logs: '',
      };
      repoMock.findOne.mockResolvedValue(existing);

      const updated = await service.updateProgressAndStep('deploy-1', {
        status: DeploymentStatus.RUNNING,
        currentStep: DeploymentStep.BUILDING,
        progressPercentage: 25,
      });

      expect(updated.status).toBe(DeploymentStatus.RUNNING);
      expect(repoMock.save).toHaveBeenCalled();
    });

    it('should reject illegal state transitions from terminal states', async () => {
      const existing = {
        id: 'deploy-1',
        status: DeploymentStatus.SUCCESS,
        serviceId: 'service-1',
        logs: '',
      };
      repoMock.findOne.mockResolvedValue(existing);

      await expect(
        service.updateProgressAndStep('deploy-1', {
          status: DeploymentStatus.RUNNING,
          currentStep: DeploymentStep.BUILDING,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow transition to FAILED from any in-progress state', async () => {
      const existing = {
        id: 'deploy-1',
        status: DeploymentStatus.RUNNING,
        serviceId: 'service-1',
        logs: '',
      };
      repoMock.findOne.mockResolvedValue(existing);

      const failed = await service.updateProgressAndStep('deploy-1', {
        status: DeploymentStatus.FAILED,
        currentStep: DeploymentStep.TESTING,
        progressPercentage: 50,
        failureReason: 'Integration tests failed',
      });

      expect(failed.status).toBe(DeploymentStatus.FAILED);
      expect(failed.failureReason).toBe('Integration tests failed');
    });
  });

  describe('rollback', () => {
    it('should initiate rollback forward deployment to previous stable version', async () => {
      const currentDeployment = {
        id: 'deploy-2',
        serviceId: 'service-1',
        version: 'v2.0.0',
        status: DeploymentStatus.SUCCESS,
        environment: ServiceEnvironment.PROD,
        createdAt: new Date(),
      };

      repoMock.findOne.mockResolvedValueOnce(currentDeployment);

      const rollbackResult = await service.rollback('deploy-2', 'user-1');

      expect(rollbackResult).toBeDefined();
      expect(queueMock.add).toHaveBeenCalled();
      expect(auditServiceMock.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException if target deployment was not successful', async () => {
      const failedDeployment = {
        id: 'deploy-1',
        serviceId: 'service-1',
        version: 'v1.0.0',
        status: DeploymentStatus.FAILED,
        environment: ServiceEnvironment.PROD,
      };

      repoMock.findOne.mockResolvedValueOnce(failedDeployment);

      await expect(
        service.rollback('deploy-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

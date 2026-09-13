import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { ServiceHealthStatus, ServiceEnvironment } from '../../common/enums/service.enum';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    private auditService: AuditService,
  ) {}

  async create(createServiceDto: CreateServiceDto, userId: string): Promise<Service> {
    const service = this.servicesRepository.create({
      ...createServiceDto,
      ownerId: userId,
      healthStatus: ServiceHealthStatus.HEALTHY,
      healthEndpoint: createServiceDto.healthEndpoint || '/health',
    });

    const savedService = await this.servicesRepository.save(service);

    // Create audit log
    await this.auditService.log({
      action: 'SERVICE_CREATED',
      actorId: userId,
      metadata: {
        serviceId: savedService.id,
        serviceName: savedService.name,
      },
    });

    return savedService;
  }

  async findAll(query?: {
    environment?: ServiceEnvironment;
    healthStatus?: ServiceHealthStatus;
  }): Promise<Service[]> {
    const where: any = {};
    if (query?.environment) {
      where.environment = query.environment;
    }
    if (query?.healthStatus) {
      where.healthStatus = query.healthStatus;
    }

    return this.servicesRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['owner'],
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({ 
      where: { id },
      relations: ['deployments', 'owner'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(
    id: string, 
    updateServiceDto: UpdateServiceDto, 
    userId: string,
    userRole: UserRole,
  ): Promise<Service> {
    const service = await this.findOne(id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && service.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to update this service');
    }

    Object.assign(service, updateServiceDto);
    const updatedService = await this.servicesRepository.save(service);

    // Create audit log
    await this.auditService.log({
      action: 'SERVICE_UPDATED',
      actorId: userId,
      metadata: {
        serviceId: updatedService.id,
        serviceName: updatedService.name,
        changes: updateServiceDto,
      },
    });

    return updatedService;
  }

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const service = await this.findOne(id);

    // Backend RBAC enforcement: Only ADMIN can delete services
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admins are permitted to delete services');
    }

    await this.servicesRepository.remove(service);

    // Create audit log
    await this.auditService.log({
      action: 'SERVICE_DELETED',
      actorId: userId,
      metadata: {
        serviceId: id,
        serviceName: service.name,
      },
    });
  }

  async updateHealthStatus(id: string, healthStatus: ServiceHealthStatus): Promise<Service> {
    const service = await this.findOne(id);
    service.healthStatus = healthStatus;
    return this.servicesRepository.save(service);
  }

  async checkHealth(id: string): Promise<Service> {
    const service = await this.findOne(id);
    const endpoint = service.healthEndpoint || '/health';
    let targetUrl = endpoint;

    // Resolve relative endpoints to server URL or repository origin if http
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      if (service.repositoryUrl?.startsWith('http://') || service.repositoryUrl?.startsWith('https://')) {
        try {
          const parsed = new URL(service.repositoryUrl);
          targetUrl = `${parsed.origin}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        } catch {
          targetUrl = `http://localhost:${process.env.PORT || 3001}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        }
      } else {
        targetUrl = `http://localhost:${process.env.PORT || 3001}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      }
    }

    const startTime = Date.now();
    let status = ServiceHealthStatus.HEALTHY;
    let latency = 0;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(targetUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      latency = Date.now() - startTime;

      if (response.ok) {
        status = latency > 500 ? ServiceHealthStatus.DEGRADED : ServiceHealthStatus.HEALTHY;
      } else if (response.status >= 500) {
        status = ServiceHealthStatus.DOWN;
      } else {
        status = ServiceHealthStatus.DEGRADED;
      }
    } catch (err: any) {
      latency = Date.now() - startTime;
      status = ServiceHealthStatus.DOWN;
    }

    service.healthStatus = status;
    service.lastHealthCheck = new Date();
    service.responseLatencyMs = latency;

    return this.servicesRepository.save(service);
  }
}

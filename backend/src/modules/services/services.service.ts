import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UserRole } from '../../common/enums/user-role.enum';
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

  async findAll(): Promise<Service[]> {
    return this.servicesRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({ 
      where: { id },
      relations: ['deployments'],
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

    // Check permissions
    if (userRole !== UserRole.ADMIN && service.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this service');
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

  async updateHealthStatus(id: string, healthStatus: string): Promise<Service> {
    const service = await this.findOne(id);
    service.healthStatus = healthStatus as any;
    return this.servicesRepository.save(service);
  }
}

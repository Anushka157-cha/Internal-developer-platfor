import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../services/service.entity';
import { Deployment } from '../deployments/deployment.entity';
import { FeatureFlag } from '../feature-flags/feature-flag.entity';
import { ServiceHealthStatus } from '../../common/enums/service.enum';
import { DeploymentStatus } from '../../common/enums/deployment.enum';

export interface DashboardMetrics {
  overview: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    downServices: number;
    totalDeployments: number;
    activeDeployments: number;
    successfulDeployments: number;
    failedDeployments: number;
    deploymentSuccessRate: number;
    averageDeploymentDurationSeconds: number;
    totalFeatureFlags: number;
  };
  deploymentTrends: {
    day: string;
    date: string;
    deployments: number;
    successful: number;
    failed: number;
  }[];
  recentDeployments: Deployment[];
  serviceHealthDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(Deployment)
    private deploymentsRepository: Repository<Deployment>,
    @InjectRepository(FeatureFlag)
    private featureFlagsRepository: Repository<FeatureFlag>,
  ) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const [
      totalServices,
      healthyServices,
      degradedServices,
      downServices,
      totalDeployments,
      activeDeployments,
      successfulDeployments,
      failedDeployments,
      totalFeatureFlags,
    ] = await Promise.all([
      this.servicesRepository.count(),
      this.servicesRepository.count({ where: { healthStatus: ServiceHealthStatus.HEALTHY } }),
      this.servicesRepository.count({ where: { healthStatus: ServiceHealthStatus.DEGRADED } }),
      this.servicesRepository.count({ where: { healthStatus: ServiceHealthStatus.DOWN } }),
      this.deploymentsRepository.count(),
      this.deploymentsRepository.count({ where: { status: DeploymentStatus.RUNNING } }),
      this.deploymentsRepository.count({ where: { status: DeploymentStatus.SUCCESS } }),
      this.deploymentsRepository.count({ where: { status: DeploymentStatus.FAILED } }),
      this.featureFlagsRepository.count(),
    ]);

    const deploymentSuccessRate = totalDeployments > 0
      ? Math.round((successfulDeployments / totalDeployments) * 100)
      : 100;

    // Compute average duration of successful deployments
    const avgDurationResult = await this.deploymentsRepository
      .createQueryBuilder('deployment')
      .select('AVG(deployment.durationSeconds)', 'avgDuration')
      .where('deployment.status = :status', { status: DeploymentStatus.SUCCESS })
      .andWhere('deployment.durationSeconds IS NOT NULL')
      .getRawOne();

    const averageDeploymentDurationSeconds = Math.round(
      Number(avgDurationResult?.avgDuration) || 0,
    );

    // Compute real 7-day deployment trends based on database records
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const pastDeployments = await this.deploymentsRepository
      .createQueryBuilder('d')
      .where('d.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getMany();

    const trendMap = new Map<string, { total: number; success: number; failed: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      trendMap.set(dateKey, { total: 0, success: 0, failed: 0 });
    }

    pastDeployments.forEach((dep) => {
      const dateKey = new Date(dep.createdAt).toISOString().split('T')[0];
      if (trendMap.has(dateKey)) {
        const item = trendMap.get(dateKey)!;
        item.total++;
        if (dep.status === DeploymentStatus.SUCCESS) item.success++;
        if (dep.status === DeploymentStatus.FAILED) item.failed++;
      }
    });

    const deploymentTrends = Array.from(trendMap.entries()).map(([dateStr, stats]) => {
      const dayIndex = new Date(dateStr).getDay();
      return {
        day: days[dayIndex],
        date: dateStr,
        deployments: stats.total,
        successful: stats.success,
        failed: stats.failed,
      };
    });

    // Recent deployments (top 6)
    const recentDeployments = await this.deploymentsRepository.find({
      order: { createdAt: 'DESC' },
      take: 6,
      relations: ['service', 'triggeredBy'],
    });

    // Service health breakdown
    const serviceHealthDistribution = [
      { name: 'Healthy', value: healthyServices, color: '#10B981' },
      { name: 'Degraded', value: degradedServices, color: '#F59E0B' },
      { name: 'Down', value: downServices, color: '#EF4444' },
    ];

    return {
      overview: {
        totalServices,
        healthyServices,
        degradedServices,
        downServices,
        totalDeployments,
        activeDeployments,
        successfulDeployments,
        failedDeployments,
        deploymentSuccessRate,
        averageDeploymentDurationSeconds,
        totalFeatureFlags,
      },
      deploymentTrends,
      recentDeployments,
      serviceHealthDistribution,
    };
  }
}

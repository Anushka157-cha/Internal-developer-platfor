import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag } from './feature-flag.entity';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { EvaluateFeatureFlagDto } from './dto/evaluate-feature-flag.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(FeatureFlag)
    private featureFlagsRepository: Repository<FeatureFlag>,
    private auditService: AuditService,
  ) {}

  async create(createFeatureFlagDto: CreateFeatureFlagDto, userId: string): Promise<FeatureFlag> {
    // Check if flag with this key already exists
    const existing = await this.featureFlagsRepository.findOne({
      where: { key: createFeatureFlagDto.key },
    });

    if (existing) {
      throw new ConflictException('Feature flag with this key already exists');
    }

    const featureFlag = this.featureFlagsRepository.create(createFeatureFlagDto);
    const saved = await this.featureFlagsRepository.save(featureFlag);

    await this.auditService.log({
      action: 'FEATURE_FLAG_CREATED',
      actorId: userId,
      metadata: {
        flagId: saved.id,
        flagKey: saved.key,
      },
    });

    return saved;
  }

  async findAll(): Promise<FeatureFlag[]> {
    return this.featureFlagsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<FeatureFlag> {
    const featureFlag = await this.featureFlagsRepository.findOne({ where: { id } });
    
    if (!featureFlag) {
      throw new NotFoundException('Feature flag not found');
    }

    return featureFlag;
  }

  async findByKey(key: string): Promise<FeatureFlag> {
    const featureFlag = await this.featureFlagsRepository.findOne({ where: { key } });
    
    if (!featureFlag) {
      throw new NotFoundException('Feature flag not found');
    }

    return featureFlag;
  }

  async update(
    id: string, 
    updateFeatureFlagDto: UpdateFeatureFlagDto,
    userId: string,
  ): Promise<FeatureFlag> {
    const featureFlag = await this.findOne(id);

    Object.assign(featureFlag, updateFeatureFlagDto);
    const updated = await this.featureFlagsRepository.save(featureFlag);

    await this.auditService.log({
      action: 'FEATURE_FLAG_UPDATED',
      actorId: userId,
      metadata: {
        flagId: updated.id,
        flagKey: updated.key,
        changes: updateFeatureFlagDto,
      },
    });

    return updated;
  }

  async toggle(id: string, userId: string): Promise<FeatureFlag> {
    const featureFlag = await this.findOne(id);
    featureFlag.enabled = !featureFlag.enabled;
    
    const updated = await this.featureFlagsRepository.save(featureFlag);

    await this.auditService.log({
      action: featureFlag.enabled ? 'FEATURE_FLAG_ENABLED' : 'FEATURE_FLAG_DISABLED',
      actorId: userId,
      metadata: {
        flagId: updated.id,
        flagKey: updated.key,
        enabled: updated.enabled,
      },
    });

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const featureFlag = await this.findOne(id);
    
    await this.featureFlagsRepository.remove(featureFlag);

    await this.auditService.log({
      action: 'FEATURE_FLAG_DELETED',
      actorId: userId,
      metadata: {
        flagId: id,
        flagKey: featureFlag.key,
      },
    });
  }

  async evaluate(evaluateDto: EvaluateFeatureFlagDto): Promise<{ enabled: boolean; reason: string }> {
    const featureFlag = await this.findByKey(evaluateDto.flagKey);

    // Check if flag is globally enabled
    if (!featureFlag.enabled) {
      return { enabled: false, reason: 'Flag is disabled' };
    }

    // Check environment
    if (featureFlag.environments.length > 0 && 
        !featureFlag.environments.includes(evaluateDto.environment)) {
      return { enabled: false, reason: 'Environment not in rollout' };
    }

    // Check percentage rollout
    if (featureFlag.rolloutPercentage < 100) {
      // Simple hash-based deterministic evaluation
      const hash = this.hashCode(evaluateDto.userId || 'anonymous');
      const userPercentile = Math.abs(hash % 100);
      
      if (userPercentile >= featureFlag.rolloutPercentage) {
        return { enabled: false, reason: 'User not in rollout percentage' };
      }
    }

    return { enabled: true, reason: 'All conditions met' };
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

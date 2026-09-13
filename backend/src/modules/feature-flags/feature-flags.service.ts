import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag } from './feature-flag.entity';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { EvaluateFeatureFlagDto } from './dto/evaluate-feature-flag.dto';
import { AuditService } from '../audit/audit.service';
import * as crypto from 'crypto';

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

    // 1. Check if flag is globally enabled
    if (!featureFlag.enabled) {
      return { enabled: false, reason: 'FLAG_DISABLED' };
    }

    // 2. Check scheduled expiration
    if (featureFlag.expiresAt && new Date(featureFlag.expiresAt) < new Date()) {
      return { enabled: false, reason: 'FLAG_EXPIRED' };
    }

    // 3. Check environment targeting
    if (
      featureFlag.environments &&
      featureFlag.environments.length > 0 &&
      !featureFlag.environments.includes(evaluateDto.environment)
    ) {
      return { enabled: false, reason: 'ENVIRONMENT_MISMATCH' };
    }

    // 4. Check role targeting
    if (
      featureFlag.roles &&
      featureFlag.roles.length > 0 &&
      (!evaluateDto.role || !featureFlag.roles.includes(evaluateDto.role))
    ) {
      return { enabled: false, reason: 'ROLE_MISMATCH' };
    }

    // 5. Check country targeting
    if (
      featureFlag.countries &&
      featureFlag.countries.length > 0 &&
      (!evaluateDto.country || !featureFlag.countries.includes(evaluateDto.country))
    ) {
      return { enabled: false, reason: 'COUNTRY_MISMATCH' };
    }

    // 6. Deterministic cryptographic SHA-256 percentage rollout
    if (featureFlag.rolloutPercentage < 100) {
      const userKey = evaluateDto.userId || 'anonymous';
      const hash = crypto
        .createHash('sha256')
        .update(`${featureFlag.key}:${userKey}`)
        .digest('hex');
      const hashInt = parseInt(hash.substring(0, 8), 16);
      const userPercentile = hashInt % 100;

      if (userPercentile >= featureFlag.rolloutPercentage) {
        return { enabled: false, reason: 'PERCENTAGE_EXCLUDED' };
      }
    }

    return { enabled: true, reason: 'MATCH' };
  }
}

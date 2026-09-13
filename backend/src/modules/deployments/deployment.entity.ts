import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Service } from '../services/service.entity';
import { User } from '../users/user.entity';
import { DeploymentStatus } from '../../common/enums/deployment.enum';

@Entity('deployments')
@Index(['serviceId'])
@Index(['status'])
@Index(['createdAt'])
@Index(['triggeredById'])
export class Deployment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Service, (service) => service.deployments)
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column()
  serviceId: string;

  @Column({
    type: 'text',
    default: DeploymentStatus.PENDING,
  })
  status: DeploymentStatus;

  @Column({ default: 'PENDING' })
  currentStep: string;

  @Column({ type: 'int', default: 0 })
  progressPercentage: number;

  @Column({ nullable: true })
  version: string;

  @Column({ nullable: true })
  commitHash: string;

  @Column({ nullable: true })
  environment: string;

  @Column({ type: 'text', nullable: true })
  logs: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ default: false })
  isRollback: boolean;

  @Column({ nullable: true })
  rollbackOfDeploymentId: string;

  @ManyToOne(() => User, (user) => user.deployments, { eager: true })
  @JoinColumn({ name: 'triggeredById' })
  triggeredBy: User;

  @Column()
  triggeredById: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

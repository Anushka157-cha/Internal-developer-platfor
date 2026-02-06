import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Service } from '../services/service.entity';
import { User } from '../users/user.entity';
import { DeploymentStatus } from '../../common/enums/deployment.enum';

@Entity('deployments')
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

  @Column({ nullable: true })
  version: string;

  @Column({ nullable: true })
  commitHash: string;

  @Column({ type: 'text', nullable: true })
  logs: string;

  @ManyToOne(() => User, (user) => user.deployments, { eager: true })
  @JoinColumn({ name: 'triggeredById' })
  triggeredBy: User;

  @Column()
  triggeredById: string;

  @Column({ type: 'datetime', nullable: true })
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Deployment } from '../deployments/deployment.entity';
import { ServiceEnvironment, ServiceHealthStatus } from '../../common/enums/service.enum';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  repositoryUrl: string;

  @Column({
    type: 'text',
    default: ServiceEnvironment.DEV,
  })
  environment: ServiceEnvironment;

  @Column({
    type: 'text',
    default: ServiceHealthStatus.HEALTHY,
  })
  healthStatus: ServiceHealthStatus;

  @Column({ nullable: true })
  version: string;

  @ManyToOne(() => User, (user) => user.services, { eager: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => Deployment, (deployment) => deployment.service)
  deployments: Deployment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

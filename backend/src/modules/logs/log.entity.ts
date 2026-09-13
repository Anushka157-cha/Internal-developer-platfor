import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Service } from '../services/service.entity';
import { LogLevel } from '../../common/enums/log.enum';

@Entity('logs')
@Index(['serviceId', 'createdAt'])
@Index(['level', 'createdAt'])
@Index(['createdAt'])
export class Log {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ nullable: true })
  serviceId: string;

  @Column({
    type: 'text',
    default: LogLevel.INFO,
  })
  level: LogLevel;

  @Column({ type: 'text' })
  message: string;

  @Column({ 
    type: 'text', 
    nullable: true,
    transformer: {
      to: (value: Record<string, any> | string | null): string | null => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'string') return value;
        return JSON.stringify(value);
      },
      from: (value: string | null): Record<string, any> | null => {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      },
    },
  })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ServiceEnvironment } from '../../common/enums/service.enum';

@Entity('feature_flags')
@Index(['key'], { unique: true })
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  enabled: boolean;

  @Column({
    type: 'text',
    default: '[]',
    transformer: {
      to: (value: ServiceEnvironment[] | string): string => {
        if (typeof value === 'string') return value;
        return JSON.stringify(value || []);
      },
      from: (value: string): ServiceEnvironment[] => {
        try {
          return JSON.parse(value || '[]');
        } catch {
          return [];
        }
      },
    },
  })
  environments: ServiceEnvironment[];

  @Column({
    type: 'text',
    default: '[]',
    transformer: {
      to: (value: string[] | string): string => {
        if (typeof value === 'string') return value;
        return JSON.stringify(value || []);
      },
      from: (value: string): string[] => {
        try {
          return JSON.parse(value || '[]');
        } catch {
          return [];
        }
      },
    },
  })
  roles: string[];

  @Column({
    type: 'text',
    default: '[]',
    transformer: {
      to: (value: string[] | string): string => {
        if (typeof value === 'string') return value;
        return JSON.stringify(value || []);
      },
      from: (value: string): string[] => {
        try {
          return JSON.parse(value || '[]');
        } catch {
          return [];
        }
      },
    },
  })
  countries: string[];

  @Column({ type: 'int', default: 100 })
  rolloutPercentage: number;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

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

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ServiceEnvironment } from '../../common/enums/service.enum';

@Entity('feature_flags')
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

  @Column({ type: 'int', default: 100 })
  rolloutPercentage: number;

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

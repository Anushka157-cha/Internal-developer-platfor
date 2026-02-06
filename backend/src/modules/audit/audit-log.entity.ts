import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { AuditSeverity } from '../../common/enums/audit-severity.enum';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string;

  @Column({
    type: 'text',
    default: AuditSeverity.INFO,
  })
  severity: AuditSeverity;

  @ManyToOne(() => User, (user) => user.auditLogs, { eager: true })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column()
  actorId: string;

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

  @Column({ type: 'text', nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}

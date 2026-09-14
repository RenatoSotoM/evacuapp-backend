import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IncidentSeverity, IncidentStatus, IncidentType } from '../../common/enums';
import { Emergency } from '../../emergencies/entities/emergency.entity';
import { User } from '../../users/entities/user.entity';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: IncidentType })
  type: IncidentType;

  @Column({ type: 'enum', enum: IncidentSeverity, default: IncidentSeverity.MEDIUM })
  severity: IncidentSeverity;

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.PENDING })
  status: IncidentStatus;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  location: object;

  @Column({ name: 'emergency_id', nullable: true })
  emergencyId?: string;

  @ManyToOne(() => Emergency, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'emergency_id' })
  emergency?: Emergency;

  @Column({ name: 'reported_by_id' })
  reportedById: string;

  @ManyToOne(() => User, (user) => user.incidents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reported_by_id' })
  reportedBy: User;

  @Column({ type: 'int', default: 1 })
  alpha: number;

  @Column({ type: 'int', default: 1 })
  beta: number;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

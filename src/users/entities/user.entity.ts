import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../../common/enums';
import { MobilityProfile } from './mobility-profile.entity';
import { Incident } from '../../incidents/entities/incident.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ unique: true, length: 160 })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ nullable: true, length: 30 })
  phone?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  active: boolean;

  @OneToOne(() => MobilityProfile, (profile) => profile.user, { cascade: true })
  mobilityProfile?: MobilityProfile;

  @OneToMany(() => Incident, (incident) => incident.reportedBy)
  incidents: Incident[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

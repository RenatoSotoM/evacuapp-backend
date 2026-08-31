import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MobilityType } from '../../common/enums';
import { User } from './user.entity';

@Entity('mobility_profiles')
export class MobilityProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.mobilityProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: MobilityType, default: MobilityType.PEATON })
  mobilityType: MobilityType;

  @Column({ default: false })
  requiresAccessibleRoute: boolean;

  @Column({ default: false })
  travelsWithMinors: boolean;

  @Column({ type: 'int', default: 0 })
  companionCount: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

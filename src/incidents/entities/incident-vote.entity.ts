import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { IncidentVoteType } from '../enums/incident-vote-type.enum';

@Entity('incident_votes')
@Index(['incidentId', 'userId'], { unique: true })
export class IncidentVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'incident_id', type: 'uuid' })
  incidentId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: IncidentVoteType,
  })
  vote: IncidentVoteType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

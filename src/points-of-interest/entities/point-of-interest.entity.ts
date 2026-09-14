import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';
import { PointOfInterestType } from '../../common/enums';

@Entity('points_of_interest')
export class PointOfInterest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'enum', enum: PointOfInterestType })
  type: PointOfInterestType;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ default: true })
  active: boolean;

  @Index({ spatial: true })
  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  location: object;

  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Column({ type: 'double precision', nullable: true })
  longitude: number;
}
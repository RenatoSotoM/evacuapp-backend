import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('graph_edges')
export class GraphEdge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'node_from' })
  nodeFrom: number;

  @Column({ name: 'node_to' })
  nodeTo: number;

  @Column({ type: 'double precision' })
  distance: number;

  @Column({ type: 'double precision' })
  weight: number;

  @Column({ default: false })
  oneway: boolean;

  @Column({ name: 'highway_type', length: 50 })
  highwayType: string;

  @Column({ default: true })
  accessible: boolean;

  @Column({ type: 'geometry', spatialFeatureType: 'LineString', srid: 4326 })
  geometry: object;
}

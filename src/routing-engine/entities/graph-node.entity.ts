import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('graph_nodes')
export class GraphNode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  geometry: object;
}

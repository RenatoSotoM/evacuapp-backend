import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapDataController } from './controllers/map-data.controller';
import { GraphEdge } from './entities/graph-edge.entity';
import { GraphNode } from './entities/graph-node.entity';
import { GraphPipelineService } from './services/graph-pipeline.service';
import { OsmIngestionService } from './services/osm-ingestion.service';

@Module({
  imports: [TypeOrmModule.forFeature([GraphNode, GraphEdge])],
  controllers: [MapDataController],
  providers: [GraphPipelineService, OsmIngestionService],
  exports: [GraphPipelineService, OsmIngestionService],
})
export class RoutingEngineModule {}

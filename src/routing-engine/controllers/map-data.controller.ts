import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BoundingBoxProfileDto } from '../dto/bounding-box-profile.dto';
import { GraphPipelineService } from '../services/graph-pipeline.service';

@ApiTags('Map data')
@Controller('map-data')
export class MapDataController {
  constructor(private readonly graphPipeline: GraphPipelineService) {}

  @Get('graph')
  getGraph(@Query() profile: BoundingBoxProfileDto) {
    return this.graphPipeline.buildGraph(profile);
  }
}

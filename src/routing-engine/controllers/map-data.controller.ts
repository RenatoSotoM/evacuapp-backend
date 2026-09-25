import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BoundingBoxProfileDto } from '../dto/bounding-box-profile.dto';
import { GraphPipelineService, GraphResponse } from '../services/graph-pipeline.service';

@ApiTags('Map data')
@Controller('map-data')
export class MapDataController {
  constructor(private readonly graphPipeline: GraphPipelineService) {}

  private unwrapJsonResponse(data: any): any {
    let result = data;

    while (typeof result === 'string') {
      try {
        result = JSON.parse(result);
      } catch {
        break;
      }
    }

    if (result && typeof result === 'object') {
      for (const key of Object.keys(result)) {
        if (typeof result[key] === 'string') {
          try {
            result[key] = JSON.parse(result[key]);
          } catch {
            // Preserve regular string values.
          }
        }
      }
    }

    return result;
  }

  @Get('graph')
  async getGraph(@Query() profile: BoundingBoxProfileDto): Promise<GraphResponse> {
    const rawResult = await this.graphPipeline.buildGraph(profile);
    const result = this.unwrapJsonResponse(rawResult) as GraphResponse;

    return {
      ...result,
      nodes: result.nodes ?? [],
      edges: result.edges ?? [],
    };
  }
}

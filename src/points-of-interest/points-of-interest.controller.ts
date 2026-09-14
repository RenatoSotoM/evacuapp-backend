import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { PointsOfInterestService } from './points-of-interest.service';
import { PointOfInterestType } from '../common/enums';

@ApiTags('Points of interest')
@Controller('points-of-interest')
export class PointsOfInterestController {
  constructor(private readonly poiService: PointsOfInterestService) {}

  @Get()
  @ApiQuery({ name: 'type', required: false, enum: PointOfInterestType })
  findAll(@Query('type') type?: PointOfInterestType) {
    return this.poiService.findAll(type);
  }

  @Get('nearby')
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: PointOfInterestType })
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
    @Query('type') type?: PointOfInterestType,
  ) {
    return this.poiService.findNearby(Number(lat), Number(lng), radius ? Number(radius) : 30000, type);
  }
}
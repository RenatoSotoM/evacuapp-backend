import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointOfInterestType } from '../common/enums';
import { PointOfInterest } from './entities/point-of-interest.entity';

@ApiTags('Points of interest')
@Controller('points-of-interest')
export class PointsOfInterestController {
  constructor(@InjectRepository(PointOfInterest) private readonly repository: Repository<PointOfInterest>) {}

  @Get()
  findAll(@Query('type') type?: PointOfInterestType) {
    return this.repository.find({ where: { active: true, ...(type ? { type } : {}) } });
  }
}

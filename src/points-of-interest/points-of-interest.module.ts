import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointOfInterest } from './entities/point-of-interest.entity';
import { PointsOfInterestController } from './points-of-interest.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PointOfInterest])],
  controllers: [PointsOfInterestController],
})
export class PointsOfInterestModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointOfInterest } from './entities/point-of-interest.entity';
import { PointsOfInterestController } from './points-of-interest.controller';
import { PointsOfInterestService } from './points-of-interest.service';

@Module({
  imports: [TypeOrmModule.forFeature([PointOfInterest])],
  controllers: [PointsOfInterestController],
  providers: [PointsOfInterestService],
  exports: [PointsOfInterestService],
})
export class PointsOfInterestModule {}
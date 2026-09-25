import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsInt,
  Min,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  Max,
} from 'class-validator';

export enum TravelMode {
  PEDESTRIAN = 'pedestrian',
  VEHICLE = 'vehicle',
}

export class BoundingBoxProfileDto {
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  centerLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  centerLon?: number;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(30000)
  radiusMeters?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30000)
  ringMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30000)
  ringMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  minLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  minLon?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  maxLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  maxLon?: number;

  @IsEnum(TravelMode)
  @IsNotEmpty()
  travelMode: TravelMode;

  @Transform(({ value }) =>
    value === true || value === 'true' ? true : value === false || value === 'false' ? false : value,
  )
  @IsBoolean()
  isReducedMobility: boolean;

  @Transform(({ value }) =>
    value === true || value === 'true' ? true : value === false || value === 'false' ? false : value,
  )
  @IsBoolean()
  avoidIncidents: boolean;
}

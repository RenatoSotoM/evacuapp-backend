import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MobilityType } from '../../common/enums';

export class UpdateMobilityProfileDto {
  @ApiPropertyOptional({ enum: MobilityType })
  @IsOptional()
  @IsEnum(MobilityType)
  mobilityType?: MobilityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresAccessibleRoute?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  travelsWithMinors?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  companionCount?: number;
}

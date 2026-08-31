import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { EmergencyStatus, EmergencyType } from '../../common/enums';

export class CreateEmergencyDto {
  @ApiProperty({ enum: EmergencyType })
  @IsEnum(EmergencyType)
  type: EmergencyType;

  @ApiProperty({ example: 'Simulacion de sismo - San Bernardo' })
  @IsString()
  @MaxLength(180)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: EmergencyStatus, default: EmergencyStatus.DRAFT })
  @IsOptional()
  @IsEnum(EmergencyStatus)
  status?: EmergencyStatus;

  @ApiPropertyOptional({ example: '2026-08-31T16:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  startedAt?: string;

  @ApiPropertyOptional({ description: 'GeoJSON Polygon' })
  @IsOptional()
  @IsObject()
  affectedArea?: object;
}

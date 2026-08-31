import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSafeZoneDto {
  @ApiProperty()
  @IsString()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty({ example: -33.5951 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: -70.7022 })
  @IsLongitude()
  longitude: number;
}

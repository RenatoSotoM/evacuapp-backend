import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateSafeZoneDto } from './dto/create-safe-zone.dto';
import { SafeZonesService } from './safe-zones.service';

@ApiTags('Safe zones')
@Controller('safe-zones')
export class SafeZonesController {
  constructor(private readonly service: SafeZonesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('nearby')
  nearby(@Query('lat') lat: string, @Query('lng') lng: string, @Query('radius') radius?: string) {
    return this.service.nearby(Number(lat), Number(lng), radius ? Number(radius) : 5000);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateSafeZoneDto) {
    return this.service.create(dto);
  }
}

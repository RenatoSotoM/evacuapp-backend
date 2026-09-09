import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafeZone } from './entities/safe-zone.entity';
import { SafeZonesController } from './safe-zones.controller';
import { SafeZonesService } from './safe-zones.service';

@Module({
  imports: [TypeOrmModule.forFeature([SafeZone]), PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [SafeZonesController],
  providers: [SafeZonesService],
})
export class SafeZonesModule {}

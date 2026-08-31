import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSafeZoneDto } from './dto/create-safe-zone.dto';
import { SafeZone } from './entities/safe-zone.entity';

@Injectable()
export class SafeZonesService {
  constructor(@InjectRepository(SafeZone) private readonly repository: Repository<SafeZone>) {}

  findAll() {
    return this.repository.find({ where: { active: true } });
  }

  create(dto: CreateSafeZoneDto) {
    return this.repository.save(
      this.repository.create({
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity,
        location: { type: 'Point', coordinates: [dto.longitude, dto.latitude] },
      }),
    );
  }

  async nearby(latitude: number, longitude: number, radius = 5000) {
    const rows = await this.repository.query(
      `SELECT id, name, description, capacity, active,
        ST_X(location) AS longitude, ST_Y(location) AS latitude,
        ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters
       FROM safe_zones
       WHERE active = true
         AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
       ORDER BY distance_meters ASC`,
      [longitude, latitude, radius],
    );
    return rows;
  }
}

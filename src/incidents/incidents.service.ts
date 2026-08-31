import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentStatus } from '../common/enums';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { Incident } from './entities/incident.entity';

@Injectable()
export class IncidentsService {
  constructor(@InjectRepository(Incident) private readonly repository: Repository<Incident>) {}

  create(userId: string, dto: CreateIncidentDto) {
    return this.repository.save(
      this.repository.create({
        type: dto.type,
        severity: dto.severity,
        description: dto.description,
        emergencyId: dto.emergencyId,
        reportedById: userId,
        location: { type: 'Point', coordinates: [dto.longitude, dto.latitude] },
      }),
    );
  }

  async nearby(latitude: number, longitude: number, radius = 5000, onlyVerified = false) {
    const statusClause = onlyVerified ? `AND status = 'VERIFIED'` : '';
    return this.repository.query(
      `SELECT id, type, severity, status, description, emergency_id, created_at,
        ST_X(location) AS longitude, ST_Y(location) AS latitude,
        ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters
       FROM incidents
       WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
       ${statusClause}
       ORDER BY created_at DESC`,
      [longitude, latitude, radius],
    );
  }

  async setStatus(id: string, status: IncidentStatus) {
    const incident = await this.repository.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incidente no encontrado.');
    incident.status = status;
    incident.verifiedAt = status === IncidentStatus.VERIFIED ? new Date() : undefined;
    return this.repository.save(incident);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentSeverity, IncidentStatus } from '../common/enums';
import { MlReliabilityService } from '../ml/ml-reliability.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { Incident } from './entities/incident.entity';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident) private readonly repository: Repository<Incident>,
    private readonly mlReliability: MlReliabilityService,
  ) {}

  async create(userId: string, dto: CreateIncidentDto) {
    const features = {
      alpha: 1,
      beta: 1,
      reportes_cercanos: 0,
      usuarios_distintos: 1,
      min_desde_primer_reporte: 0,
      antiguedad_min: 0,
      reputacion_usuario: 0.5,
      usuario_nuevo: 1,
      tiene_foto: 0,
      severidad: this.mapSeverity(dto.severity),
      dist_zona_amenaza_m: 0,
      precision_gps_m: 10,
      hora: new Date().getHours(),
      tipo_incidente: this.mapIncidentType(dto.type),
      tipo_emergencia: 'NINGUNA',
    };
    const prediction = await this.mlReliability.predecir(features);
    const status = this.toIncidentStatus(prediction?.estado_sugerido);

    return this.repository.save(
      this.repository.create({
        type: dto.type,
        severity: dto.severity,
        status,
        description: dto.description,
        emergencyId: dto.emergencyId,
        reportedById: userId,
        location: { type: 'Point', coordinates: [dto.longitude, dto.latitude] },
      }),
    );
  }

  private mapSeverity(severity: IncidentSeverity): number {
    return {
      [IncidentSeverity.LOW]: 1,
      [IncidentSeverity.MEDIUM]: 2,
      [IncidentSeverity.HIGH]: 3,
      [IncidentSeverity.CRITICAL]: 3,
    }[severity];
  }

  private mapIncidentType(type: string): string {
    return type === 'ESCOMBROS' ? 'DERRUMBE' : type === 'PELIGRO_GENERAL' ? 'OTRO' : type;
  }

  private toIncidentStatus(status?: string): IncidentStatus {
    return Object.values(IncidentStatus).includes(status as IncidentStatus)
      ? (status as IncidentStatus)
      : IncidentStatus.PENDING;
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

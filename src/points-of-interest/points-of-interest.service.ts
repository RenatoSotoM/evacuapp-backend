import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PointOfInterest } from './entities/point-of-interest.entity';
import { PointOfInterestType } from '../common/enums';

@Injectable()
export class PointsOfInterestService implements OnModuleInit {
  constructor(
    @InjectRepository(PointOfInterest)
    private readonly repository: Repository<PointOfInterest>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      // 1. Asegurar que el enum acepta todos los tipos posibles que envía la app móvil
      await this.dataSource.query(
        `ALTER TYPE points_of_interest_type_enum ADD VALUE IF NOT EXISTS 'HEALTH_CENTER';`
      );
      await this.dataSource.query(
        `ALTER TYPE points_of_interest_type_enum ADD VALUE IF NOT EXISTS 'SAFE_ZONE';`
      );
      await this.dataSource.query(
        `ALTER TYPE points_of_interest_type_enum ADD VALUE IF NOT EXISTS 'FIRE_STATION';`
      );
      await this.dataSource.query(
        `ALTER TYPE points_of_interest_type_enum ADD VALUE IF NOT EXISTS 'POLICE_STATION';`
      );
      await this.dataSource.query(
        `ALTER TYPE points_of_interest_type_enum ADD VALUE IF NOT EXISTS 'POLICE';`
      );
    } catch (error: unknown) {
      // Ignorar si ya existen en el enum
    }

    // 2. Garantizar individualmente que existan puntos clave para los filtros (Bomberos, Salud, Policía)
    try {
      // Insertar Bomberos si no existe ninguno
      await this.dataSource.query(`
        INSERT INTO points_of_interest (name, type, address, active, latitude, longitude, location) 
        SELECT '1ra Compañía de Bomberos San Bernardo', 'FIRE_STATION', 'San Bernardo, Región Metropolitana', true, -33.593120, -70.701230, ST_SetSRID(ST_MakePoint(-70.701230, -33.593120), 4326)
        WHERE NOT EXISTS (SELECT 1 FROM points_of_interest WHERE type = 'FIRE_STATION');
      `);

      // Insertar Policía si no existe ninguna
      await this.dataSource.query(`
        INSERT INTO points_of_interest (name, type, address, active, latitude, longitude, location) 
        SELECT '14ª Comisaría de Carabineros San Bernardo', 'POLICE', 'San Bernardo, Región Metropolitana', true, -33.589120, -70.704230, ST_SetSRID(ST_MakePoint(-70.704230, -33.589120), 4326)
        WHERE NOT EXISTS (SELECT 1 FROM points_of_interest WHERE type = 'POLICE' OR type = 'POLICE_STATION');
      `);

      // Insertar un CESFAM/Centro de Salud si no existe ninguno
      await this.dataSource.query(`
        INSERT INTO points_of_interest (name, type, address, active, latitude, longitude, location) 
        SELECT 'Hospital El Pino', 'HEALTH_CENTER', 'San Bernardo, Región Metropolitana', true, -33.584536, -70.676724, ST_SetSRID(ST_MakePoint(-70.676724, -33.584536), 4326)
        WHERE NOT EXISTS (SELECT 1 FROM points_of_interest WHERE type = 'HEALTH_CENTER');
      `);

      console.log('✅ Verificación de puntos clave (Bomberos, Policía, Salud) completada.');
    } catch (err: unknown) {
      const errorMsg = (err as Error).message;
      console.log('ℹ️ Nota en la verificación de puntos de interés:', errorMsg);
    }
  }

  async findAll(type?: PointOfInterestType): Promise<PointOfInterest[]> {
    return this.repository.find({ 
      where: { active: true, ...(type ? { type } : {}) } 
    });
  }

  async findNearby(lat: number, lng: number, radius: number = 30000, type?: string) {
    console.log(`🔍 Buscando cercanos -> Lat: ${lat}, Lng: ${lng}, Radio: ${radius}, Tipo recibido: ${type}`);

    const query = this.repository
      .createQueryBuilder('poi')
      .addSelect(
        `ST_DistanceSphere(poi.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))`,
        'distance_meters',
      )
      .where('poi.active = :active', { active: true })
      .andWhere(
        `ST_DWithin(poi.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
      )
      .setParameters({ lat, lng, radius });

    if (type) {
      const normalizedType = type.toString().toUpperCase();
      
      // Flexibilidad para tipos equivalentes
      if (normalizedType === 'POLICE' || normalizedType === 'POLICE_STATION') {
        query.andWhere('(poi.type = :type1 OR poi.type = :type2)', { 
          type1: 'POLICE', 
          type2: 'POLICE_STATION' 
        });
      } else {
        query.andWhere('poi.type = :type', { type: normalizedType });
      }
    }

    const results = await query.orderBy('distance_meters', 'ASC').getMany();
    console.log(`📦 Resultados encontrados: ${results.length}`);
    return results;
  }
}
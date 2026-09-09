import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ReliabilityFeatures {
  alpha: number;
  beta: number;
  reportes_cercanos: number;
  usuarios_distintos: number;
  min_desde_primer_reporte: number;
  antiguedad_min: number;
  reputacion_usuario: number;
  usuario_nuevo: number;
  tiene_foto: number;
  severidad: number;
  dist_zona_amenaza_m: number;
  precision_gps_m: number;
  hora: number;
  tipo_incidente: string;
  tipo_emergencia: string;
}

export interface ReliabilityPrediction {
  estado_sugerido?: string;
  [key: string]: unknown;
}

@Injectable()
export class MlReliabilityService {
  private readonly logger = new Logger(MlReliabilityService.name);
  private readonly serviceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.serviceUrl = configService.get<string>('ML_SERVICE_URL', 'http://localhost:8001').replace(/\/$/, '');
  }

  async predecir(features: ReliabilityFeatures): Promise<ReliabilityPrediction | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ReliabilityPrediction>(`${this.serviceUrl}/predict`, features, {
          timeout: 5000,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.warn(`ML service unavailable: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
}

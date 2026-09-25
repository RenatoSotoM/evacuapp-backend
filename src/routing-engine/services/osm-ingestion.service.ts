import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { access } from 'node:fs/promises';

@Injectable()
export class OsmIngestionService {
  async ingestChilePbf(filePath: string): Promise<void> {
    try {
      await access(filePath);
    } catch {
      throw new ServiceUnavailableException(`No se encontró el archivo PBF: ${filePath}`);
    }

    throw new ServiceUnavailableException(
      'La ingesta PBF requiere la herramienta de importación PostGIS configurada en el entorno.',
    );
  }
}

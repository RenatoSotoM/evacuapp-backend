import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyStatus } from '../common/enums';
import { CreateEmergencyDto } from './dto/create-emergency.dto';
import { Emergency } from './entities/emergency.entity';

@Injectable()
export class EmergenciesService {
  constructor(@InjectRepository(Emergency) private readonly repository: Repository<Emergency>) {}

  findAll() {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async findActive() {
    const emergency = await this.repository.findOne({ where: { status: EmergencyStatus.ACTIVE } });
    return emergency ?? { active: false, message: 'No existe una emergencia activa.' };
  }

  create(dto: CreateEmergencyDto) {
    return this.repository.save(
      this.repository.create({
        ...dto,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
      }),
    );
  }

  async setStatus(id: string, status: EmergencyStatus) {
    const emergency = await this.repository.findOne({ where: { id } });
    if (!emergency) throw new NotFoundException('Emergencia no encontrada.');
    emergency.status = status;
    if (status === EmergencyStatus.ACTIVE && !emergency.startedAt) emergency.startedAt = new Date();
    return this.repository.save(emergency);
  }
}

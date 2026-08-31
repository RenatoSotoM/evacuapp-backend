import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { MobilityProfile } from './entities/mobility-profile.entity';
import { UpdateMobilityProfileDto } from './dto/update-mobility-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(MobilityProfile) private readonly profilesRepository: Repository<MobilityProfile>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  findById(id: string) {
    return this.usersRepository.findOne({ where: { id }, relations: { mobilityProfile: true } });
  }

  async getMe(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }

  async updateMobilityProfile(userId: string, dto: UpdateMobilityProfileDto) {
    let profile = await this.profilesRepository.findOne({ where: { userId } });
    if (!profile) profile = this.profilesRepository.create({ userId });
    Object.assign(profile, dto);
    return this.profilesRepository.save(profile);
  }
}

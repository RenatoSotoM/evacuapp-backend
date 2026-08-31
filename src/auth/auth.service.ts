import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { MobilityProfile } from '../users/entities/mobility-profile.entity';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(MobilityProfile) private readonly profilesRepository: Repository<MobilityProfile>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.usersRepository.findOne({ where: { email } });
    if (exists) throw new ConflictException('El correo ya esta registrado.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersRepository.save(
      this.usersRepository.create({
        name: dto.name.trim(),
        email,
        phone: dto.phone?.trim(),
        passwordHash,
        role: UserRole.USER,
      }),
    );

    await this.profilesRepository.save(this.profilesRepository.create({ userId: user.id }));
    return this.createSession(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();

    if (!user || !user.active || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Correo o contrasena incorrectos.');
    }

    return this.createSession(user);
  }

  private createSession(user: User) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') ?? '7d';
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: expiresIn as never,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { EmergenciesModule } from './emergencies/emergencies.module';
import { IncidentsModule } from './incidents/incidents.module';
import { PointsOfInterestModule } from './points-of-interest/points-of-interest.module';
import { SafeZonesModule } from './safe-zones/safe-zones.module';
import { UsersModule } from './users/users.module';
import { MlModule } from './ml/ml.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false, // 👈 Cámbiaro a false para evitar que TypeORM altere las tablas/enums al iniciar
      }),
    }),
    AuthModule,
    UsersModule,
    EmergenciesModule,
    SafeZonesModule,
    PointsOfInterestModule,
    IncidentsModule,
    MlModule,
  ],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergenciesController } from './emergencies.controller';
import { EmergenciesService } from './emergencies.service';
import { Emergency } from './entities/emergency.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Emergency]), PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [EmergenciesController],
  providers: [EmergenciesService],
})
export class EmergenciesModule {}

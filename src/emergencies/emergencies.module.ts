import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergenciesController } from './emergencies.controller';
import { EmergenciesService } from './emergencies.service';
import { Emergency } from './entities/emergency.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Emergency])],
  controllers: [EmergenciesController],
  providers: [EmergenciesService],
})
export class EmergenciesModule {}

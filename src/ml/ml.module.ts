import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MlReliabilityService } from './ml-reliability.service';

@Module({
  imports: [HttpModule],
  providers: [MlReliabilityService],
  exports: [MlReliabilityService],
})
export class MlModule {}

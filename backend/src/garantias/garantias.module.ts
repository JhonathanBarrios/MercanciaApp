import { Module } from '@nestjs/common';
import { GarantiasService } from './garantias.service';
import { GarantiasController } from './garantias.controller';

@Module({
  controllers: [GarantiasController],
  providers: [GarantiasService],
})
export class GarantiasModule {}

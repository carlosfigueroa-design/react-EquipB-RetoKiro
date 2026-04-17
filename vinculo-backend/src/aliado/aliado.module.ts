import { Module } from '@nestjs/common';
import { AliadoController } from './aliado.controller';
import { AliadoService } from './aliado.service';

@Module({
  controllers: [AliadoController],
  providers: [AliadoService],
  exports: [AliadoService],
})
export class AliadoModule {}

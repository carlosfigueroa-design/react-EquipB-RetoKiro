import { Module } from '@nestjs/common';
import { InsuranceController } from './insurance.controller';
import { MockEngineService } from './mock-engine.service';

@Module({
  controllers: [InsuranceController],
  providers: [MockEngineService],
  exports: [MockEngineService],
})
export class InsuranceModule {}

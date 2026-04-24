import { Module } from '@nestjs/common';
import { SandboxController } from './sandbox.controller';
import { SandboxService } from './sandbox.service';
import { MockEngineService } from './mock-engine.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SandboxController],
  providers: [SandboxService, MockEngineService],
  exports: [SandboxService, MockEngineService],
})
export class SandboxModule {}

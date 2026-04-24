import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiMockEngineService } from './ai-mock-engine.service';
import { AuthModule } from '../auth/auth.module';
import { SandboxModule } from '../sandbox/sandbox.module';
import { SnippetGeneratorService } from '../apis/snippet-generator.service';

@Module({
  imports: [AuthModule, SandboxModule],
  controllers: [AiController],
  providers: [AiService, AiMockEngineService, SnippetGeneratorService],
  exports: [AiService, AiMockEngineService],
})
export class AiModule {}

import { Module } from '@nestjs/common';
import { ApisController } from './apis.controller';
import { ApisService } from './apis.service';
import { OpenApiParserService } from './openapi-parser.service';
import { SnippetGeneratorService } from './snippet-generator.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ApisController],
  providers: [ApisService, OpenApiParserService, SnippetGeneratorService],
  exports: [ApisService, OpenApiParserService, SnippetGeneratorService],
})
export class ApisModule {}

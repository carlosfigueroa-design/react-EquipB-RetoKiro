import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Core modules (global)
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { MailerModule } from './mailer/mailer.module';

// Feature modules — will be imported as they are implemented
import { AuthModule } from './auth/auth.module';
import { ApisModule } from './apis/apis.module';
import { SandboxModule } from './sandbox/sandbox.module';
import { AiModule } from './ai/ai.module';
import { SearchModule } from './search/search.module';
import { ObservabilityModule } from './observability/observability.module';
import { GovernanceModule } from './governance/governance.module';
import { AuditModule } from './audit/audit.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Core modules (global)
    PrismaModule,
    RedisModule,
    MailerModule,
    // Feature modules — uncomment as implemented
    AuthModule,
    ApisModule,
    SandboxModule,
    AiModule,
    SearchModule,
    ObservabilityModule,
    GovernanceModule,
    AuditModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

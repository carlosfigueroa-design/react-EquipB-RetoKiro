import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AliadoModule } from './aliado/aliado.module';
import { AppsModule } from './apps/apps.module';
import { InsuranceModule } from './insurance/insurance.module';
import { SandboxModule } from './sandbox/sandbox.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CatalogModule } from './catalog/catalog.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AliadoModule,
    AppsModule,
    InsuranceModule,
    SandboxModule,
    AnalyticsModule,
    CatalogModule,
    HealthModule,
  ],
})
export class AppModule {}

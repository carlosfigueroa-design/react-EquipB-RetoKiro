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
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GovernanceModule } from './governance/governance.module';

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
    AdminModule,         // RU-07: Gestión centralizada de aliados
    AuditModule,         // RU-08: Auditoría y cumplimiento
    NotificationsModule, // RU-06: Notificaciones de ciclo de vida
    GovernanceModule,    // RU-09: Gobierno de versiones
  ],
})
export class AppModule {}

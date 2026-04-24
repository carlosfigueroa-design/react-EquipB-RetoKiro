import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './audit.interceptor';
import { AuthModule } from '../auth/auth.module';

/**
 * AuditModule — Immutable audit logging for administrative actions.
 *
 * Provides:
 * - AuditService: Core logging and query service
 * - AuditController: REST endpoints for querying logs and compliance reports
 * - AuditInterceptor: Automatic logging of administrative actions
 *
 * Requirements: 6.6, 8.4, 11.3, 13.3, 14.1, 14.2, 14.3, 14.4
 */
@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}

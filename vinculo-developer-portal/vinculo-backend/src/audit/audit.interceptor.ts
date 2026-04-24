import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { AuditActionDto } from './dto/create-audit-log.dto';

/**
 * Map of route patterns to audit actions.
 * Each entry maps a combination of HTTP method + route pattern to an AuditAction.
 */
const AUDITABLE_ROUTES: Array<{
  method: string;
  pattern: RegExp;
  action: AuditActionDto;
  resource: string;
  extractResourceId?: (url: string) => string | undefined;
}> = [
  {
    method: 'POST',
    pattern: /^\/governance\/apis\/([^/]+)\/publish$/,
    action: AuditActionDto.API_PUBLISHED,
    resource: 'Api',
    extractResourceId: (url) => url.match(/\/apis\/([^/]+)\/publish/)?.[1],
  },
  {
    method: 'POST',
    pattern: /^\/governance\/apis\/([^/]+)\/deprecate$/,
    action: AuditActionDto.API_DEPRECATED,
    resource: 'Api',
    extractResourceId: (url) => url.match(/\/apis\/([^/]+)\/deprecate/)?.[1],
  },
  {
    method: 'POST',
    pattern: /^\/governance\/apis\/([^/]+)\/sunset$/,
    action: AuditActionDto.API_SUNSET,
    resource: 'Api',
    extractResourceId: (url) => url.match(/\/apis\/([^/]+)\/sunset/)?.[1],
  },
  {
    method: 'POST',
    pattern: /^\/governance\/apis\/([^/]+)\/reactivate$/,
    action: AuditActionDto.API_REACTIVATED,
    resource: 'Api',
    extractResourceId: (url) => url.match(/\/apis\/([^/]+)\/reactivate/)?.[1],
  },
  {
    method: 'PATCH',
    pattern: /^\/users\/([^/]+)\/role$/,
    action: AuditActionDto.USER_ROLE_CHANGED,
    resource: 'User',
    extractResourceId: (url) => url.match(/\/users\/([^/]+)\/role/)?.[1],
  },
  {
    method: 'PATCH',
    pattern: /^\/users\/([^/]+)\/status$/,
    action: AuditActionDto.USER_STATUS_CHANGED,
    resource: 'User',
    extractResourceId: (url) => url.match(/\/users\/([^/]+)\/status/)?.[1],
  },
  {
    method: 'POST',
    pattern: /^\/apis\/([^/]+)\/upload-spec$/,
    action: AuditActionDto.API_SPEC_UPLOADED,
    resource: 'Api',
    extractResourceId: (url) => url.match(/\/apis\/([^/]+)\/upload-spec/)?.[1],
  },
  {
    method: 'POST',
    pattern: /^\/apis\/([^/]+)\/generate-docs$/,
    action: AuditActionDto.API_DOCS_GENERATED,
    resource: 'Api',
    extractResourceId: (url) =>
      url.match(/\/apis\/([^/]+)\/generate-docs/)?.[1],
  },
];

/**
 * NestJS interceptor that automatically logs administrative actions to the audit log.
 *
 * Intercepts requests matching auditable route patterns (publish, deprecate, sunset,
 * role change, spec upload, etc.) and invokes AuditService.log() after the handler
 * completes successfully.
 *
 * Extracts userId, ipAddress, and userAgent from the request context.
 *
 * Requirements: 6.6, 8.4, 11.3, 13.3, 14.1
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl, body } = request;

    // Find matching auditable route
    const match = AUDITABLE_ROUTES.find(
      (route) => route.method === method && route.pattern.test(originalUrl),
    );

    if (!match) {
      // Not an auditable route — pass through
      return next.handle();
    }

    // Extract user info from request (set by JwtAuthGuard)
    const user = (request as any).user as
      | { id: string; email: string; role: string }
      | undefined;

    const ipAddress =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      request.ip ??
      'unknown';

    const userAgent =
      (request.headers['user-agent'] as string) ?? undefined;

    return next.handle().pipe(
      tap({
        next: () => {
          // Log the action after successful completion
          const resourceId = match.extractResourceId?.(originalUrl);

          this.auditService
            .log({
              userId: user?.id ?? 'anonymous',
              action: match.action,
              resource: match.resource,
              resourceId,
              metadata: body && Object.keys(body).length > 0 ? body : undefined,
              ipAddress,
              userAgent,
            })
            .catch((err) => {
              // Don't fail the request if audit logging fails
              this.logger.error(
                `Failed to log audit entry for ${match.action}: ${err.message}`,
              );
            });
        },
      }),
    );
  }
}

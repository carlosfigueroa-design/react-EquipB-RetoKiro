import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by JwtAuthGuard to skip authentication on public endpoints.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator that marks an endpoint as public (no authentication required).
 *
 * Usage: @Public()
 *
 * When applied to a controller method, the JwtAuthGuard will skip JWT
 * validation and allow unauthenticated access.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

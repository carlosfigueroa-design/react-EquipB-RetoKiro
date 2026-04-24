import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by RolesGuard to read the allowed roles for an endpoint.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator that restricts endpoint access to specific user roles.
 *
 * Usage: @Roles('ADMIN', 'LIDER_TECNICO')
 *
 * When applied to a controller method, the RolesGuard will check that the
 * authenticated user's role is included in the provided list. If no @Roles()
 * decorator is present, the endpoint is accessible to any authenticated user.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

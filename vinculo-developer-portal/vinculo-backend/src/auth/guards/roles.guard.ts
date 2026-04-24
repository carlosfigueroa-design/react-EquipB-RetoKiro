import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Role hierarchy — higher roles inherit access from lower ones.
 *
 * PUBLICO  → only public endpoints
 * EXTERNO  → public + EXTERNO endpoints
 * LIDER_TECNICO → public + EXTERNO + LIDER_TECNICO endpoints
 * ADMIN    → all endpoints
 */
const ROLE_HIERARCHY: Record<string, number> = {
  PUBLICO: 0,
  EXTERNO: 1,
  LIDER_TECNICO: 2,
  ADMIN: 3,
};

/**
 * Guard that validates the authenticated user's role against the endpoint's
 * required roles (set via the @Roles() decorator).
 *
 * Behaviour:
 * 1. If the endpoint is decorated with @Public(), access is granted immediately.
 * 2. If no @Roles() decorator is present, any authenticated user is allowed.
 * 3. Uses role hierarchy: a user with a higher-level role can access endpoints
 *    that require a lower-level role.
 *
 * Must be used AFTER JwtAuthGuard so that `request.user` is populated.
 *
 * Validates: Requirements 11.1, 11.4, 11.5
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    // Skip role check for @Public() endpoints
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Read required roles from @Roles() metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // No @Roles() decorator → any authenticated user is allowed
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException('Acceso denegado: usuario no autenticado');
    }

    const userLevel = ROLE_HIERARCHY[user.role] ?? -1;

    // Grant access if the user's role level is >= any of the required roles
    const hasAccess = requiredRoles.some((role) => {
      const requiredLevel = ROLE_HIERARCHY[role] ?? Infinity;
      return userLevel >= requiredLevel;
    });

    if (!hasAccess) {
      throw new ForbiddenException(
        `Acceso denegado: se requiere uno de los roles [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}

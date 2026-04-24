import * as fc from 'fast-check';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Property-Based Test: Matriz de Autorización RBAC
 *
 * **Validates: Requirements 11.1, 11.4, 11.5**
 *
 * Propiedad 3: Para todo par (rol de usuario, roles requeridos del endpoint),
 * el acceso se concede si y solo si el nivel del rol del usuario es >= el nivel
 * mínimo requerido por el endpoint.
 *
 * Jerarquía de roles (desde RolesGuard):
 *   PUBLICO: nivel 0
 *   EXTERNO: nivel 1
 *   LIDER_TECNICO: nivel 2
 *   ADMIN: nivel 3
 */

const ALL_ROLES = ['PUBLICO', 'EXTERNO', 'LIDER_TECNICO', 'ADMIN'] as const;
type Role = (typeof ALL_ROLES)[number];

const ROLE_HIERARCHY: Record<Role, number> = {
  PUBLICO: 0,
  EXTERNO: 1,
  LIDER_TECNICO: 2,
  ADMIN: 3,
};

/**
 * Creates a mock ExecutionContext with the given user role and endpoint metadata.
 */
function createMockContext(
  userRole: Role | null,
  requiredRoles: Role[] | undefined,
  isPublic: boolean,
): { context: ExecutionContext; reflector: Reflector } {
  const request = userRole
    ? { user: { id: 'test-user-id', email: 'test@example.com', role: userRole } }
    : { user: undefined };

  const handler = () => {};
  const classRef = class {};

  const context: ExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => handler,
    getClass: () => classRef,
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({} as any),
    switchToWs: () => ({} as any),
    getType: () => 'http',
  } as unknown as ExecutionContext;

  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(((key: unknown) => {
    if (key === IS_PUBLIC_KEY) return isPublic;
    if (key === ROLES_KEY) return requiredRoles;
    return undefined;
  }) as any);

  return { context, reflector };
}

describe('Property 3: Matriz de Autorización RBAC', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('acceso se concede si y solo si el nivel del rol del usuario >= nivel mínimo requerido', () => {
    /**
     * **Validates: Requirements 11.1, 11.4, 11.5**
     *
     * For all pairs of (user role, required endpoint roles):
     * 1. If the user's role level >= the minimum required role level → access GRANTED
     * 2. If the user's role level < the minimum required role level → access DENIED
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ROLES),
        fc.array(fc.constantFrom(...ALL_ROLES), { minLength: 1, maxLength: 4 }),
        (userRole: Role, requiredRoles: Role[]) => {
          const { context, reflector } = createMockContext(userRole, requiredRoles, false);
          const guard = new RolesGuard(reflector);

          const userLevel = ROLE_HIERARCHY[userRole];
          // The guard grants access if the user's level >= ANY of the required role levels
          const minRequiredLevel = Math.min(
            ...requiredRoles.map((r) => ROLE_HIERARCHY[r]),
          );
          const expectedAccess = userLevel >= minRequiredLevel;

          if (expectedAccess) {
            // Access should be granted — canActivate returns true
            const result = guard.canActivate(context);
            expect(result).toBe(true);
          } else {
            // Access should be denied — canActivate throws ForbiddenException
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('endpoints @Public() siempre conceden acceso sin importar el rol', () => {
    /**
     * **Validates: Requirements 11.1, 11.5**
     *
     * For all roles (including unauthenticated), @Public() endpoints always grant access.
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ROLES),
        fc.array(fc.constantFrom(...ALL_ROLES), { minLength: 0, maxLength: 4 }),
        (userRole: Role, requiredRoles: Role[]) => {
          const roles = requiredRoles.length > 0 ? requiredRoles : undefined;
          const { context, reflector } = createMockContext(userRole, roles, true);
          const guard = new RolesGuard(reflector);

          const result = guard.canActivate(context);
          expect(result).toBe(true);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('endpoints sin @Roles() conceden acceso a cualquier usuario autenticado', () => {
    /**
     * **Validates: Requirements 11.1, 11.4**
     *
     * When no @Roles() decorator is present, any authenticated user is allowed.
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ROLES),
        (userRole: Role) => {
          const { context, reflector } = createMockContext(userRole, undefined, false);
          const guard = new RolesGuard(reflector);

          const result = guard.canActivate(context);
          expect(result).toBe(true);
        },
      ),
      { numRuns: 200 },
    );
  });
});

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: { id: string; email: string; role: string }): ExecutionContext {
    const request: any = { user };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as any;
  }

  // ─── @Public() bypass ────────────────────────────────────

  it('should allow access when endpoint is decorated with @Public()', () => {
    // First call: IS_PUBLIC_KEY → true, second call: ROLES_KEY → not reached
    reflector.getAllAndOverride.mockReturnValueOnce(true);
    const ctx = createMockContext();

    expect(guard.canActivate(ctx)).toBe(true);
  });

  // ─── No @Roles() decorator ──────────────────────────────

  it('should allow any authenticated user when no @Roles() is set', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false); // IS_PUBLIC_KEY
    reflector.getAllAndOverride.mockReturnValueOnce(undefined); // ROLES_KEY
    const ctx = createMockContext({ id: '1', email: 'a@b.com', role: 'EXTERNO' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when @Roles() has empty array', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    reflector.getAllAndOverride.mockReturnValueOnce([]);
    const ctx = createMockContext({ id: '1', email: 'a@b.com', role: 'PUBLICO' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  // ─── Role hierarchy ──────────────────────────────────────

  describe('role hierarchy', () => {
    function setupRoles(requiredRoles: string[]) {
      reflector.getAllAndOverride.mockReturnValueOnce(false); // IS_PUBLIC_KEY
      reflector.getAllAndOverride.mockReturnValueOnce(requiredRoles); // ROLES_KEY
    }

    // ADMIN can access everything
    it('should allow ADMIN to access ADMIN-only endpoints', () => {
      setupRoles(['ADMIN']);
      const ctx = createMockContext({ id: '1', email: 'admin@sb.com', role: 'ADMIN' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow ADMIN to access LIDER_TECNICO endpoints', () => {
      setupRoles(['LIDER_TECNICO']);
      const ctx = createMockContext({ id: '1', email: 'admin@sb.com', role: 'ADMIN' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow ADMIN to access EXTERNO endpoints', () => {
      setupRoles(['EXTERNO']);
      const ctx = createMockContext({ id: '1', email: 'admin@sb.com', role: 'ADMIN' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    // LIDER_TECNICO can access LIDER_TECNICO and below
    it('should allow LIDER_TECNICO to access LIDER_TECNICO endpoints', () => {
      setupRoles(['LIDER_TECNICO']);
      const ctx = createMockContext({ id: '2', email: 'lt@sb.com', role: 'LIDER_TECNICO' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow LIDER_TECNICO to access EXTERNO endpoints', () => {
      setupRoles(['EXTERNO']);
      const ctx = createMockContext({ id: '2', email: 'lt@sb.com', role: 'LIDER_TECNICO' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny LIDER_TECNICO from ADMIN-only endpoints', () => {
      setupRoles(['ADMIN']);
      const ctx = createMockContext({ id: '2', email: 'lt@sb.com', role: 'LIDER_TECNICO' });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    // EXTERNO can access EXTERNO and below
    it('should allow EXTERNO to access EXTERNO endpoints', () => {
      setupRoles(['EXTERNO']);
      const ctx = createMockContext({ id: '3', email: 'ext@empresa.com', role: 'EXTERNO' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny EXTERNO from LIDER_TECNICO endpoints', () => {
      setupRoles(['LIDER_TECNICO']);
      const ctx = createMockContext({ id: '3', email: 'ext@empresa.com', role: 'EXTERNO' });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should deny EXTERNO from ADMIN endpoints', () => {
      setupRoles(['ADMIN']);
      const ctx = createMockContext({ id: '3', email: 'ext@empresa.com', role: 'EXTERNO' });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    // PUBLICO can only access PUBLICO endpoints
    it('should allow PUBLICO to access PUBLICO endpoints', () => {
      setupRoles(['PUBLICO']);
      const ctx = createMockContext({ id: '4', email: 'pub@test.com', role: 'PUBLICO' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny PUBLICO from EXTERNO endpoints', () => {
      setupRoles(['EXTERNO']);
      const ctx = createMockContext({ id: '4', email: 'pub@test.com', role: 'PUBLICO' });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should deny PUBLICO from ADMIN endpoints', () => {
      setupRoles(['ADMIN']);
      const ctx = createMockContext({ id: '4', email: 'pub@test.com', role: 'PUBLICO' });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  // ─── Multiple roles ──────────────────────────────────────

  describe('multiple required roles', () => {
    it('should allow access when user matches any of the required roles', () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(['ADMIN', 'LIDER_TECNICO']);
      const ctx = createMockContext({ id: '2', email: 'lt@sb.com', role: 'LIDER_TECNICO' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny when user role is below all required roles', () => {
      reflector.getAllAndOverride.mockReturnValueOnce(false);
      reflector.getAllAndOverride.mockReturnValueOnce(['ADMIN', 'LIDER_TECNICO']);
      const ctx = createMockContext({ id: '3', email: 'ext@empresa.com', role: 'EXTERNO' });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  // ─── Missing user ────────────────────────────────────────

  it('should throw ForbiddenException when user is not on request', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    reflector.getAllAndOverride.mockReturnValueOnce(['EXTERNO']);
    const ctx = createMockContext(undefined);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should include descriptive message when user is missing', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    reflector.getAllAndOverride.mockReturnValueOnce(['EXTERNO']);
    const ctx = createMockContext(undefined);

    expect(() => guard.canActivate(ctx)).toThrow('Acceso denegado: usuario no autenticado');
  });

  // ─── Error message ───────────────────────────────────────

  it('should include required roles in the error message', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    reflector.getAllAndOverride.mockReturnValueOnce(['ADMIN']);
    const ctx = createMockContext({ id: '3', email: 'ext@empresa.com', role: 'EXTERNO' });

    expect(() => guard.canActivate(ctx)).toThrow(
      'Acceso denegado: se requiere uno de los roles [ADMIN]',
    );
  });
});

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '../jwt.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    jwtService = {
      verifyToken: jest.fn(),
    } as any;

    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    guard = new JwtAuthGuard(jwtService, reflector);
  });

  function createMockContext(authHeader?: string): ExecutionContext {
    const request: any = {
      headers: {
        authorization: authHeader,
      },
    };
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
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = createMockContext();

    expect(guard.canActivate(ctx)).toBe(true);
    expect(jwtService.verifyToken).not.toHaveBeenCalled();
  });

  it('should require auth when endpoint is NOT @Public()', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = createMockContext();

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  // ─── Missing / malformed Authorization header ────────────

  it('should throw UnauthorizedException when Authorization header is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = createMockContext(undefined);

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(ctx)).toThrow('Token de autenticación requerido');
  });

  it('should throw UnauthorizedException when Authorization header does not start with Bearer', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = createMockContext('Basic abc123');

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(ctx)).toThrow('Token de autenticación requerido');
  });

  // ─── Valid token ─────────────────────────────────────────

  it('should allow access and inject user into request for a valid token', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyToken.mockReturnValue({
      sub: 'user-123',
      email: 'aliado@empresa.com',
      role: 'EXTERNO',
      iat: 1700000000,
      exp: 1700028800,
      iss: 'vinculo-developer-portal',
    });

    const ctx = createMockContext('Bearer valid-token');
    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(jwtService.verifyToken).toHaveBeenCalledWith('valid-token');

    const request = ctx.switchToHttp().getRequest();
    expect(request.user).toEqual({
      id: 'user-123',
      email: 'aliado@empresa.com',
      role: 'EXTERNO',
    });
  });

  it('should inject ADMIN user for admin tokens', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyToken.mockReturnValue({
      sub: 'admin-1',
      email: 'admin@segurosbolivar.com',
      role: 'ADMIN',
      iat: 1700000000,
      exp: 1700028800,
      iss: 'vinculo-developer-portal',
    });

    const ctx = createMockContext('Bearer admin-token');
    guard.canActivate(ctx);

    const request = ctx.switchToHttp().getRequest();
    expect(request.user).toEqual({
      id: 'admin-1',
      email: 'admin@segurosbolivar.com',
      role: 'ADMIN',
    });
  });

  // ─── Invalid / expired token ─────────────────────────────

  it('should throw UnauthorizedException when token is invalid', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyToken.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    const ctx = createMockContext('Bearer invalid-token');

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(ctx)).toThrow('Token inválido o expirado');
  });

  it('should throw UnauthorizedException when token is expired', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const ctx = createMockContext('Bearer expired-token');

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(ctx)).toThrow('Token inválido o expirado');
  });
});

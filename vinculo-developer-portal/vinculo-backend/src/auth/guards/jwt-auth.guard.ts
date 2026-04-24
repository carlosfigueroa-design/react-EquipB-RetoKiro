import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtService } from '../jwt.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Guard that validates JWT RS256 tokens on each protected request.
 *
 * Behaviour:
 * 1. If the endpoint is decorated with @Public(), access is granted immediately.
 * 2. Extracts the token from the `Authorization: Bearer <token>` header.
 * 3. Verifies the RS256 signature and validates expiration via JwtService.
 * 4. Injects the authenticated user into `request.user`.
 *
 * Validates: Requirements 11.1, 11.4, 11.5
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    // Skip authentication for @Public() endpoints
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticación requerido');
    }

    const token = authHeader.slice(7);

    try {
      const decoded = this.jwtService.verifyToken(token);
      (request as any).user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      } satisfies AuthenticatedUser;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}

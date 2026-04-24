import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      requestOtp: jest.fn(),
      verifyOtp: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
    };

    const mockJwtService = {
      verifyToken: jest.fn(),
      signToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      hashToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
        Reflector,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── POST /auth/request-otp ──────────────────────────────

  describe('requestOtp', () => {
    it('should call authService.requestOtp with the email and return result', async () => {
      const dto = { email: 'aliado@empresa.com' };
      const expected = { message: 'OTP enviado al email proporcionado' };
      authService.requestOtp.mockResolvedValue(expected);

      const result = await controller.requestOtp(dto);

      expect(authService.requestOtp).toHaveBeenCalledWith('aliado@empresa.com');
      expect(result).toEqual(expected);
    });

    it('should propagate 429 error when account is blocked', async () => {
      const dto = { email: 'blocked@empresa.com' };
      authService.requestOtp.mockRejectedValue(
        new HttpException(
          'Cuenta bloqueada por múltiples intentos fallidos. Intente de nuevo en 15 minutos.',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      await expect(controller.requestOtp(dto)).rejects.toThrow(HttpException);
    });
  });

  // ─── POST /auth/verify-otp ───────────────────────────────

  describe('verifyOtp', () => {
    it('should call authService.verifyOtp with email and otp and return tokens', async () => {
      const dto = { email: 'aliado@empresa.com', otp: '123456' };
      const expected = {
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-id',
          email: 'aliado@empresa.com',
          role: 'EXTERNO',
          name: null,
          company: null,
        },
      };
      authService.verifyOtp.mockResolvedValue(expected);

      const result = await controller.verifyOtp(dto);

      expect(authService.verifyOtp).toHaveBeenCalledWith('aliado@empresa.com', '123456');
      expect(result).toEqual(expected);
    });

    it('should propagate 401 error for invalid OTP', async () => {
      const dto = { email: 'aliado@empresa.com', otp: '000000' };
      authService.verifyOtp.mockRejectedValue(
        new UnauthorizedException('OTP inválido. Intente de nuevo.'),
      );

      await expect(controller.verifyOtp(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should propagate 429 error when max attempts exceeded', async () => {
      const dto = { email: 'aliado@empresa.com', otp: '999999' };
      authService.verifyOtp.mockRejectedValue(
        new HttpException(
          'Cuenta bloqueada por múltiples intentos fallidos.',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      await expect(controller.verifyOtp(dto)).rejects.toThrow(HttpException);
    });

    it('should propagate 401 error when OTP is expired', async () => {
      const dto = { email: 'aliado@empresa.com', otp: '123456' };
      authService.verifyOtp.mockRejectedValue(
        new UnauthorizedException('OTP expirado o no encontrado. Solicite un nuevo código.'),
      );

      await expect(controller.verifyOtp(dto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.verifyOtp(dto)).rejects.toMatchObject({
        message: 'OTP expirado o no encontrado. Solicite un nuevo código.',
      });
    });
  });

  // ─── POST /auth/refresh ──────────────────────────────────

  describe('refresh', () => {
    it('should call authService.refreshToken and return new token pair', async () => {
      const dto = { refreshToken: 'old-refresh-token' };
      const expected = {
        accessToken: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
      };
      authService.refreshToken.mockResolvedValue(expected);

      const result = await controller.refresh(dto);

      expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(result).toEqual(expected);
    });

    it('should propagate 401 error for invalid refresh token', async () => {
      const dto = { refreshToken: 'invalid-token' };
      authService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Refresh token inválido.'),
      );

      await expect(controller.refresh(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should propagate 401 error for expired refresh token', async () => {
      const dto = { refreshToken: 'expired-token' };
      authService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Refresh token expirado.'),
      );

      await expect(controller.refresh(dto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.refresh(dto)).rejects.toMatchObject({
        message: 'Refresh token expirado.',
      });
    });
  });

  // ─── POST /auth/logout ───────────────────────────────────

  describe('logout', () => {
    it('should call authService.logout with the user id', async () => {
      const user = { id: 'user-123', email: 'aliado@empresa.com', role: 'EXTERNO' };
      const expected = { message: 'Sesión cerrada exitosamente' };
      authService.logout.mockResolvedValue(expected);

      const result = await controller.logout(user);

      expect(authService.logout).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(expected);
    });
  });

  // ─── GET /auth/me ────────────────────────────────────────

  describe('getMe', () => {
    it('should return the authenticated user profile', () => {
      const user = { id: 'user-123', email: 'aliado@empresa.com', role: 'EXTERNO' };

      const result = controller.getMe(user);

      expect(result).toEqual({
        id: 'user-123',
        email: 'aliado@empresa.com',
        role: 'EXTERNO',
      });
    });

    it('should return ADMIN profile for admin users', () => {
      const user = { id: 'admin-1', email: 'admin@segurosbolivar.com', role: 'ADMIN' };

      const result = controller.getMe(user);

      expect(result).toEqual({
        id: 'admin-1',
        email: 'admin@segurosbolivar.com',
        role: 'ADMIN',
      });
    });
  });
});

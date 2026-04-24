import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { MailerService } from '@/mailer/mailer.service';

// ─── Mock factories ────────────────────────────────────────

function createMockPrisma() {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
}

function createMockRedis() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
  };
}

function createMockJwtService() {
  return {
    signToken: jest.fn().mockReturnValue('mock-access-token'),
    verifyToken: jest.fn(),
    generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
    hashToken: jest.fn().mockReturnValue('mock-token-hash'),
    getPublicKey: jest.fn().mockReturnValue('mock-public-key'),
  };
}

function createMockMailerService() {
  return {
    sendOtpEmail: jest.fn().mockResolvedValue(undefined),
    sendNotificationEmail: jest.fn().mockResolvedValue(undefined),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let redis: ReturnType<typeof createMockRedis>;
  let jwtSvc: ReturnType<typeof createMockJwtService>;
  let mailerSvc: ReturnType<typeof createMockMailerService>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    redis = createMockRedis();
    jwtSvc = createMockJwtService();
    mailerSvc = createMockMailerService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: JwtService, useValue: jwtSvc },
        { provide: MailerService, useValue: mailerSvc },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─── generateOtp ───────────────────────────────────────

  describe('generateOtp', () => {
    it('should return a string of exactly 6 digits', () => {
      const otp = service.generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
      expect(otp.length).toBe(6);
    });
  });

  // ─── requestOtp ────────────────────────────────────────

  describe('requestOtp', () => {
    const email = 'aliado@empresa.com';

    it('should throw 429 if the email is blocked', async () => {
      redis.get.mockResolvedValue('1'); // blocked key exists

      await expect(service.requestOtp(email)).rejects.toThrow(HttpException);
      await expect(service.requestOtp(email)).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    });

    it('should auto-register a new user with role EXTERNO if not found', async () => {
      redis.get.mockResolvedValue(null); // not blocked
      prisma.user.findUnique.mockResolvedValue(null); // user doesn't exist
      prisma.user.create.mockResolvedValue({
        id: 'new-uuid',
        email,
        role: 'EXTERNO',
        status: 'ACTIVE',
      });

      const result = await service.requestOtp(email);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email, role: 'EXTERNO', status: 'ACTIVE' },
      });
      expect(result).toEqual({ message: 'OTP enviado al email proporcionado' });
    });

    it('should store OTP in Redis with TTL and send email for existing user', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-uuid',
        email,
        role: 'EXTERNO',
      });

      const result = await service.requestOtp(email);

      expect(redis.set).toHaveBeenCalledWith(
        `otp:${email}`,
        expect.stringContaining('"code"'),
        'EX',
        300,
      );
      expect(result).toEqual({ message: 'OTP enviado al email proporcionado' });
    });

    it('should store OTP data with attempts initialized to 0', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: 'uuid', email });

      await service.requestOtp(email);

      const storedData = JSON.parse(redis.set.mock.calls[0][1] as string);
      expect(storedData.attempts).toBe(0);
      expect(storedData.code).toMatch(/^\d{6}$/);
    });

    it('should succeed even if email sending fails (graceful degradation)', async () => {
      redis.get.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: 'uuid', email });
      mailerSvc.sendOtpEmail.mockRejectedValue(new Error('SMTP connection failed'));

      const result = await service.requestOtp(email);

      // OTP is still stored in Redis even if email fails
      expect(redis.set).toHaveBeenCalled();
      expect(result).toEqual({ message: 'OTP enviado al email proporcionado' });
    });
  });

  // ─── verifyOtp ─────────────────────────────────────────

  describe('verifyOtp', () => {
    const email = 'aliado@empresa.com';
    const validOtp = '123456';
    const user = {
      id: 'user-uuid',
      email,
      role: 'EXTERNO',
      name: 'Test User',
      company: 'Test Corp',
      status: 'ACTIVE',
    };

    it('should throw 429 if the email is blocked', async () => {
      redis.get.mockImplementation((key: string) => {
        if (key === `otp:blocked:${email}`) return Promise.resolve('1');
        return Promise.resolve(null);
      });

      await expect(service.verifyOtp(email, validOtp)).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw UnauthorizedException if OTP is expired/not found', async () => {
      redis.get.mockResolvedValue(null); // no blocked key, no otp key

      await expect(service.verifyOtp(email, validOtp)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return accessToken, refreshToken and user data on valid OTP', async () => {
      const otpData = JSON.stringify({ code: validOtp, attempts: 0 });
      redis.get.mockImplementation((key: string) => {
        if (key === `otp:blocked:${email}`) return Promise.resolve(null);
        if (key === `otp:${email}`) return Promise.resolve(otpData);
        return Promise.resolve(null);
      });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.verifyOtp(email, validOtp);

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        company: user.company,
      });
    });

    it('should issue JWT with correct payload on valid OTP', async () => {
      const otpData = JSON.stringify({ code: validOtp, attempts: 0 });
      redis.get.mockImplementation((key: string) => {
        if (key === `otp:blocked:${email}`) return Promise.resolve(null);
        if (key === `otp:${email}`) return Promise.resolve(otpData);
        return Promise.resolve(null);
      });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);
      prisma.refreshToken.create.mockResolvedValue({});

      await service.verifyOtp(email, validOtp);

      expect(jwtSvc.signToken).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
    });

    it('should store hashed refresh token in database on valid OTP', async () => {
      const otpData = JSON.stringify({ code: validOtp, attempts: 0 });
      redis.get.mockImplementation((key: string) => {
        if (key === `otp:blocked:${email}`) return Promise.resolve(null);
        if (key === `otp:${email}`) return Promise.resolve(otpData);
        return Promise.resolve(null);
      });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);
      prisma.refreshToken.create.mockResolvedValue({});

      await service.verifyOtp(email, validOtp);

      expect(jwtSvc.hashToken).toHaveBeenCalledWith('mock-refresh-token');
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          tokenHash: 'mock-token-hash',
          userId: user.id,
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should delete OTP from Redis after successful verification (single-use)', async () => {
      const otpData = JSON.stringify({ code: validOtp, attempts: 0 });
      redis.get.mockImplementation((key: string) => {
        if (key === `otp:blocked:${email}`) return Promise.resolve(null);
        if (key === `otp:${email}`) return Promise.resolve(otpData);
        return Promise.resolve(null);
      });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);
      prisma.refreshToken.create.mockResolvedValue({});

      await service.verifyOtp(email, validOtp);

      expect(redis.del).toHaveBeenCalledWith(`otp:${email}`);
    });

    it('should increment attempts on invalid OTP', async () => {
      const otpData = JSON.stringify({ code: validOtp, attempts: 0 });
      redis.get.mockImplementation((key: string) => {
        if (key === `otp:blocked:${email}`) return Promise.resolve(null);
        if (key === `otp:${email}`) return Promise.resolve(otpData);
        return Promise.resolve(null);
      });
      redis.ttl.mockResolvedValue(250);

      await expect(service.verifyOtp(email, '000000')).rejects.toThrow(
        UnauthorizedException,
      );

      // Should update Redis with incremented attempts
      const updatedData = JSON.parse(redis.set.mock.calls[0][1] as string);
      expect(updatedData.attempts).toBe(1);
    });

    it('should block email after 3 failed attempts', async () => {
      const otpData = JSON.stringify({ code: validOtp, attempts: 2 });
      redis.get.mockImplementation((key: string) => {
        if (key === `otp:blocked:${email}`) return Promise.resolve(null);
        if (key === `otp:${email}`) return Promise.resolve(otpData);
        return Promise.resolve(null);
      });

      await expect(service.verifyOtp(email, '000000')).rejects.toThrow(
        HttpException,
      );

      // Should set blocked key with 900s TTL
      expect(redis.set).toHaveBeenCalledWith(
        `otp:blocked:${email}`,
        '1',
        'EX',
        900,
      );
      // Should delete the OTP key
      expect(redis.del).toHaveBeenCalledWith(`otp:${email}`);
    });

    it('should update lastLoginAt on successful verification', async () => {
      const otpData = JSON.stringify({ code: validOtp, attempts: 0 });
      redis.get.mockImplementation((key: string) => {
        if (key === `otp:blocked:${email}`) return Promise.resolve(null);
        if (key === `otp:${email}`) return Promise.resolve(otpData);
        return Promise.resolve(null);
      });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);
      prisma.refreshToken.create.mockResolvedValue({});

      await service.verifyOtp(email, validOtp);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException if user not found after valid OTP', async () => {
      const otpData = JSON.stringify({ code: validOtp, attempts: 0 });
      redis.get.mockImplementation((key: string) => {
        if (key === `otp:blocked:${email}`) return Promise.resolve(null);
        if (key === `otp:${email}`) return Promise.resolve(otpData);
        return Promise.resolve(null);
      });
      prisma.user.findUnique.mockResolvedValue(null); // user deleted between requestOtp and verifyOtp

      await expect(service.verifyOtp(email, validOtp)).rejects.toThrow(
        UnauthorizedException,
      );
      // OTP should still be deleted (single-use)
      expect(redis.del).toHaveBeenCalledWith(`otp:${email}`);
    });
  });

  // ─── refreshToken ──────────────────────────────────────

  describe('refreshToken', () => {
    const rawToken = 'valid-refresh-token';
    const user = {
      id: 'user-uuid',
      email: 'aliado@empresa.com',
      role: 'EXTERNO',
      name: 'Test User',
      company: 'Test Corp',
      status: 'ACTIVE',
    };

    it('should throw UnauthorizedException if refresh token not found', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-id',
        tokenHash: 'mock-token-hash',
        userId: user.id,
        expiresAt: new Date(Date.now() - 1000), // expired
        createdAt: new Date(),
        user,
      });
      prisma.refreshToken.delete.mockResolvedValue({});

      await expect(service.refreshToken(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should rotate refresh token: delete old, create new, return new pair', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-id',
        tokenHash: 'mock-token-hash',
        userId: user.id,
        expiresAt: futureDate,
        createdAt: new Date(),
        user,
      });
      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshToken(rawToken);

      // Old token deleted
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'rt-id' },
      });
      // New token created
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      // Returns new pair
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('should issue JWT with correct user payload on refresh', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-id',
        tokenHash: 'mock-token-hash',
        userId: user.id,
        expiresAt: futureDate,
        createdAt: new Date(),
        user,
      });
      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      await service.refreshToken(rawToken);

      expect(jwtSvc.signToken).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
    });
  });

  // ─── logout ────────────────────────────────────────────

  describe('logout', () => {
    it('should delete all refresh tokens for the user', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.logout('user-uuid');

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid' },
      });
      expect(result).toEqual({ message: 'Sesión cerrada exitosamente' });
    });

    it('should succeed even if user has no refresh tokens', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.logout('user-uuid');

      expect(result).toEqual({ message: 'Sesión cerrada exitosamente' });
    });
  });
});

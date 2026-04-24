import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { JwtService } from '../jwt.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { MailerService } from '@/mailer/mailer.service';

/**
 * Property-Based Test: Ciclo de Vida del OTP
 *
 * **Validates: Requirements 2.3, 2.8**
 *
 * Propiedad 5: Para todo OTP generado,
 * (a) después de una verificación exitosa, cualquier intento posterior de verificar
 *     el mismo OTP SHALL fallar (uso único — el OTP se elimina de Redis tras uso exitoso).
 * (b) después de transcurridos 5 minutos (TTL expirado), la verificación SHALL fallar
 *     con error de expiración.
 */

// ─── Generators ────────────────────────────────────────────

const emailArb = fc.emailAddress();

const otpCodeArb = fc.stringOf(
  fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
  { minLength: 6, maxLength: 6 },
);

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

// ─── Tests ─────────────────────────────────────────────────

describe('Property 5: Ciclo de Vida del OTP', () => {
  let service: AuthService;
  let redis: Record<string, jest.Mock>;
  let prisma: ReturnType<typeof createMockPrisma>;
  let jwtSvc: ReturnType<typeof createMockJwtService>;
  let mailerSvc: ReturnType<typeof createMockMailerService>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      ttl: jest.fn(),
    };
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

  it('después de una verificación exitosa, un segundo intento con el mismo OTP falla (uso único)', async () => {
    /**
     * **Validates: Requirements 2.3, 2.8**
     *
     * For all valid emails and OTP codes:
     * 1. First verification succeeds (Redis returns valid OTP data).
     * 2. After success, the OTP is deleted from Redis (single-use).
     * 3. A second verification attempt fails because Redis returns null
     *    (OTP no longer exists).
     */
    await fc.assert(
      fc.asyncProperty(emailArb, otpCodeArb, async (email, otpCode) => {
        // Reset mocks for each property run
        jest.clearAllMocks();

        const mockUser = {
          id: 'user-uuid',
          email,
          role: 'EXTERNO',
          name: null,
          company: null,
          status: 'ACTIVE',
        };

        // Simulate Redis behavior: first call returns valid OTP, second returns null (deleted)
        let otpDeleted = false;

        redis.get.mockImplementation((key: string) => {
          if (key === `otp:blocked:${email}`) return Promise.resolve(null);
          if (key === `otp:${email}`) {
            if (otpDeleted) return Promise.resolve(null);
            return Promise.resolve(
              JSON.stringify({ code: otpCode, attempts: 0 }),
            );
          }
          return Promise.resolve(null);
        });

        redis.del.mockImplementation((key: string) => {
          if (key === `otp:${email}`) {
            otpDeleted = true;
          }
          return Promise.resolve(1);
        });

        redis.set.mockResolvedValue('OK');
        redis.ttl.mockResolvedValue(250);

        prisma.user.findUnique.mockResolvedValue(mockUser);
        prisma.user.update.mockResolvedValue(mockUser);
        prisma.refreshToken.create.mockResolvedValue({});

        // 1. First verification should succeed
        const result = await service.verifyOtp(email, otpCode);
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();

        // 2. Second verification should fail (OTP was deleted — single-use)
        await expect(service.verifyOtp(email, otpCode)).rejects.toThrow(
          UnauthorizedException,
        );
      }),
      { numRuns: 50 },
    );
  });

  it('después de expirar el TTL (5 minutos), la verificación falla con error de expiración', async () => {
    /**
     * **Validates: Requirements 2.3, 2.8**
     *
     * For all valid emails and OTP codes:
     * When the OTP has expired (Redis returns null for the OTP key),
     * verification SHALL fail with an expiration/not-found error.
     */
    await fc.assert(
      fc.asyncProperty(emailArb, otpCodeArb, async (email, otpCode) => {
        // Reset mocks for each property run
        jest.clearAllMocks();

        // Simulate expired OTP: Redis returns null for the OTP key
        redis.get.mockImplementation((key: string) => {
          if (key === `otp:blocked:${email}`) return Promise.resolve(null);
          if (key === `otp:${email}`) return Promise.resolve(null); // expired
          return Promise.resolve(null);
        });

        // Verification should fail with UnauthorizedException (expired OTP)
        await expect(service.verifyOtp(email, otpCode)).rejects.toThrow(
          UnauthorizedException,
        );
      }),
      { numRuns: 50 },
    );
  });
});

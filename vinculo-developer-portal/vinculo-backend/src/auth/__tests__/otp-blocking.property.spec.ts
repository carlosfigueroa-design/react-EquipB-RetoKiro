import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { JwtService } from '../jwt.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { MailerService } from '@/mailer/mailer.service';
import { OTP_CONFIG } from '@/common/constants';

/**
 * Property-Based Test: Bloqueo por Intentos Fallidos de OTP
 *
 * **Validates: Requirements 2.4**
 *
 * Propiedad 6: Para todo email y para toda secuencia de 3 OTPs incorrectos
 * consecutivos, el Sistema_Auth SHALL bloquear la cuenta durante 15 minutos,
 * rechazando cualquier intento de verificación adicional durante ese período.
 */

// ─── Generators ────────────────────────────────────────────

const emailArb = fc.emailAddress();

/** Generate a valid 6-digit OTP code */
const otpCodeArb = fc.stringOf(
  fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
  { minLength: 6, maxLength: 6 },
);

/**
 * Generate a wrong OTP that is guaranteed to differ from the stored one.
 * We generate a 6-digit code and, if it matches the stored code, flip the last digit.
 */
function wrongOtpArb(storedOtp: string): fc.Arbitrary<string> {
  return otpCodeArb.map((candidate) => {
    if (candidate === storedOtp) {
      const lastDigit = parseInt(candidate[5], 10);
      const flipped = (lastDigit + 1) % 10;
      return candidate.slice(0, 5) + flipped.toString();
    }
    return candidate;
  });
}

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

describe('Property 6: Bloqueo por Intentos Fallidos de OTP', () => {
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

  it('después de 3 OTPs incorrectos consecutivos, la cuenta se bloquea con 429 Too Many Requests', async () => {
    /**
     * **Validates: Requirements 2.4**
     *
     * For all valid emails and OTP codes:
     * 1. After 3 consecutive incorrect OTP attempts, the account is blocked
     *    (throws 429 Too Many Requests).
     * 2. The block key is set in Redis with TTL 900s (15 minutes).
     * 3. Any subsequent verification attempt during the block period also throws 429.
     */
    await fc.assert(
      fc.asyncProperty(emailArb, otpCodeArb, async (email, storedOtp) => {
        // Reset mocks for each property run
        jest.clearAllMocks();

        // ── Simulate Redis state ──
        // Track attempts counter and blocked state in-memory
        let currentAttempts = 0;
        let isBlocked = false;
        let blockTtl = -1;

        redis.get.mockImplementation((key: string) => {
          if (key === `otp:blocked:${email}`) {
            return Promise.resolve(isBlocked ? '1' : null);
          }
          if (key === `otp:${email}`) {
            if (isBlocked) return Promise.resolve(null);
            return Promise.resolve(
              JSON.stringify({ code: storedOtp, attempts: currentAttempts }),
            );
          }
          return Promise.resolve(null);
        });

        redis.set.mockImplementation(
          (key: string, value: string, _ex?: string, ttl?: number) => {
            if (key === `otp:blocked:${email}`) {
              isBlocked = true;
              blockTtl = ttl ?? -1;
            }
            if (key === `otp:${email}`) {
              // Update attempts counter from the stored JSON
              const parsed = JSON.parse(value);
              currentAttempts = parsed.attempts;
            }
            return Promise.resolve('OK');
          },
        );

        redis.del.mockImplementation((key: string) => {
          if (key === `otp:${email}`) {
            currentAttempts = 0;
          }
          return Promise.resolve(1);
        });

        redis.ttl.mockResolvedValue(250);

        // ── Generate a wrong OTP guaranteed to differ from storedOtp ──
        const wrongOtp = fc.sample(wrongOtpArb(storedOtp), 1)[0];

        // ── Submit 3 incorrect OTP attempts ──
        // The first 2 should throw UnauthorizedException (401),
        // the 3rd should trigger the block and throw 429.
        for (let attempt = 1; attempt <= OTP_CONFIG.MAX_ATTEMPTS; attempt++) {
          try {
            await service.verifyOtp(email, wrongOtp);
            // Should never succeed with a wrong OTP
            fail(`Attempt ${attempt} should have thrown, but succeeded`);
          } catch (error) {
            if (attempt < OTP_CONFIG.MAX_ATTEMPTS) {
              // First (MAX_ATTEMPTS - 1) failures: 401 Unauthorized
              expect(error).toBeInstanceOf(Error);
            } else {
              // The MAX_ATTEMPTS-th failure: triggers block → 429
              expect(error).toBeInstanceOf(HttpException);
              expect((error as HttpException).getStatus()).toBe(
                HttpStatus.TOO_MANY_REQUESTS,
              );
            }
          }
        }

        // ── Verify block key was set in Redis with correct TTL ──
        expect(isBlocked).toBe(true);
        expect(blockTtl).toBe(OTP_CONFIG.BLOCK_DURATION_SECONDS);

        // ── Any subsequent attempt during the block period also throws 429 ──
        try {
          await service.verifyOtp(email, storedOtp);
          fail('Should have thrown 429 during block period');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect((error as HttpException).getStatus()).toBe(
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }),
      { numRuns: 50 },
    );
  });
});

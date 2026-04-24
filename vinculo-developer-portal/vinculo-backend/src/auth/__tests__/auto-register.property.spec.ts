import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '../jwt.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { MailerService } from '@/mailer/mailer.service';

/**
 * Property-Based Test: Auto-Registro con Rol por Defecto
 *
 * **Validates: Requirements 2.7**
 *
 * Propiedad 8: Para todo email válido que no corresponda a un usuario existente
 * en el sistema, al solicitar un OTP, el Sistema_Auth SHALL crear un nuevo usuario
 * con rol EXTERNO y estado ACTIVE.
 */

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

describe('Property 8: Auto-Registro con Rol por Defecto', () => {
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

  it('para todo email nuevo, requestOtp crea un usuario con rol EXTERNO y estado ACTIVE', async () => {
    /**
     * **Validates: Requirements 2.7**
     *
     * For all valid email addresses that don't correspond to existing users:
     * 1. When requestOtp(email) is called, a new user is created in the database
     * 2. The new user has role EXTERNO
     * 3. The new user has status ACTIVE
     */
    await fc.assert(
      fc.asyncProperty(fc.emailAddress(), async (email) => {
        // Reset mocks for each property run
        jest.clearAllMocks();

        // User does not exist in the database
        prisma.user.findUnique.mockResolvedValue(null);

        // Capture the data passed to prisma.user.create
        const createdUser = {
          id: 'new-user-uuid',
          email,
          role: 'EXTERNO',
          status: 'ACTIVE',
          name: null,
          company: null,
        };
        prisma.user.create.mockResolvedValue(createdUser);

        // Email is not blocked
        redis.get.mockResolvedValue(null);
        redis.set.mockResolvedValue('OK');

        // Call requestOtp
        const result = await service.requestOtp(email);

        // 1. Verify requestOtp returns success message
        expect(result).toEqual({
          message: 'OTP enviado al email proporcionado',
        });

        // 2. Verify prisma.user.findUnique was called with the email
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { email },
        });

        // 3. Verify prisma.user.create was called (user didn't exist)
        expect(prisma.user.create).toHaveBeenCalledTimes(1);

        // 4. Verify the create call includes role EXTERNO and status ACTIVE
        const createCall = prisma.user.create.mock.calls[0][0];
        expect(createCall.data.role).toBe('EXTERNO');
        expect(createCall.data.status).toBe('ACTIVE');
        expect(createCall.data.email).toBe(email);

        // 5. Verify OTP email was sent
        expect(mailerSvc.sendOtpEmail).toHaveBeenCalledWith(
          email,
          expect.stringMatching(/^[0-9]{6}$/),
        );
      }),
      { numRuns: 100 },
    );
  });
});

import * as fc from 'fast-check';
import * as jwt from 'jsonwebtoken';
import { JwtService, JwtPayload } from '../jwt.service';
import { JWT_CONFIG } from '@/common/constants';

/**
 * Property-Based Test: Propiedades del Token JWT
 *
 * **Validates: Requirements 2.5**
 *
 * Propiedad 7: Para toda autenticación exitosa, el JWT emitido SHALL estar
 * firmado con algoritmo RS256, tener un claim `exp` configurado a exactamente
 * 8 horas desde el momento de emisión, un claim `iss` de 'vinculo-developer-portal',
 * poder ser verificado con la clave pública, y cada refresh token generado
 * SHALL ser único.
 */

// ─── Generators ────────────────────────────────────────────

const roleArb = fc.constantFrom('PUBLICO', 'EXTERNO', 'LIDER_TECNICO', 'ADMIN');

const payloadArb = fc.record({
  sub: fc.uuid(),
  email: fc.emailAddress(),
  role: roleArb,
});

// ─── Tests ─────────────────────────────────────────────────

describe('Property 7: Propiedades del Token JWT', () => {
  let jwtService: JwtService;

  beforeAll(() => {
    jwtService = new JwtService();
    // Trigger key generation (normally done by NestJS lifecycle)
    jwtService.onModuleInit();
  });

  it('el JWT está firmado con algoritmo RS256 (header.alg === "RS256")', () => {
    /**
     * **Validates: Requirements 2.5**
     *
     * For all valid user payloads, the signed JWT header must declare RS256.
     */
    fc.assert(
      fc.property(payloadArb, (payload: JwtPayload) => {
        const token = jwtService.signToken(payload);

        // Decode without verification to inspect the header
        const decoded = jwt.decode(token, { complete: true });
        expect(decoded).not.toBeNull();
        expect(decoded!.header.alg).toBe('RS256');
      }),
      { numRuns: 100 },
    );
  });

  it('el JWT tiene claim `exp` configurado a exactamente 8 horas (28800s) desde `iat`', () => {
    /**
     * **Validates: Requirements 2.5**
     *
     * For all valid user payloads, exp - iat === 28800 (8 hours in seconds).
     */
    fc.assert(
      fc.property(payloadArb, (payload: JwtPayload) => {
        const token = jwtService.signToken(payload);

        const decoded = jwt.decode(token) as { iat: number; exp: number };
        expect(decoded).not.toBeNull();
        expect(typeof decoded.iat).toBe('number');
        expect(typeof decoded.exp).toBe('number');

        const diffSeconds = decoded.exp - decoded.iat;
        expect(diffSeconds).toBe(28800); // 8h = 8 * 3600 = 28800s
      }),
      { numRuns: 100 },
    );
  });

  it('el JWT tiene claim `iss` igual a "vinculo-developer-portal"', () => {
    /**
     * **Validates: Requirements 2.5**
     *
     * For all valid user payloads, the issuer claim must match the configured issuer.
     */
    fc.assert(
      fc.property(payloadArb, (payload: JwtPayload) => {
        const token = jwtService.signToken(payload);

        const decoded = jwt.decode(token) as { iss: string };
        expect(decoded).not.toBeNull();
        expect(decoded.iss).toBe(JWT_CONFIG.ISSUER);
      }),
      { numRuns: 100 },
    );
  });

  it('el JWT puede ser verificado con la clave pública', () => {
    /**
     * **Validates: Requirements 2.5**
     *
     * For all valid user payloads, the token signed by JwtService can be
     * verified using the public key, and the decoded claims match the input.
     */
    fc.assert(
      fc.property(payloadArb, (payload: JwtPayload) => {
        const token = jwtService.signToken(payload);

        // Verify using the service's own verify method
        const verified = jwtService.verifyToken(token);
        expect(verified.sub).toBe(payload.sub);
        expect(verified.email).toBe(payload.email);
        expect(verified.role).toBe(payload.role);

        // Also verify directly with jsonwebtoken + public key
        const publicKey = jwtService.getPublicKey();
        const directVerified = jwt.verify(token, publicKey, {
          algorithms: ['RS256'],
        }) as Record<string, unknown>;
        expect(directVerified.sub).toBe(payload.sub);
        expect(directVerified.email).toBe(payload.email);
        expect(directVerified.role).toBe(payload.role);
      }),
      { numRuns: 100 },
    );
  });

  it('cada llamada a generateRefreshToken() produce un token único', () => {
    /**
     * **Validates: Requirements 2.5**
     *
     * Generate N refresh tokens and verify all are unique.
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 200 }),
        (count: number) => {
          const tokens = new Set<string>();

          for (let i = 0; i < count; i++) {
            tokens.add(jwtService.generateRefreshToken());
          }

          // All tokens must be unique — set size equals count
          expect(tokens.size).toBe(count);
        },
      ),
      { numRuns: 50 },
    );
  });
});

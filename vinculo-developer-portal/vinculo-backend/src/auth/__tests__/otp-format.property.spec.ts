import * as fc from 'fast-check';
import { AuthService } from '../auth.service';

/**
 * Property-Based Test: Formato de OTP
 *
 * **Validates: Requirements 2.2**
 *
 * Propiedad 4: Para todo OTP generado por AuthService.generateOtp(),
 * el código SHALL ser una cadena de exactamente 6 dígitos numéricos
 * (rango 000000–999999).
 */
describe('Property 4: Formato de OTP', () => {
  let authService: AuthService;

  beforeEach(() => {
    // generateOtp() is a pure method that doesn't use any injected dependencies,
    // so we can safely instantiate AuthService with null deps for this test.
    authService = new AuthService(
      null as any,
      null as any,
      null as any,
      null as any,
    );
  });

  it('todo OTP generado es una cadena de exactamente 6 dígitos numéricos (000000–999999)', () => {
    /**
     * **Validates: Requirements 2.2**
     *
     * We use fc.integer() as a seed/counter to drive multiple invocations
     * of generateOtp(). The integer itself is not used — it simply causes
     * fast-check to run the property many times with different random seeds.
     */
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 9999 }), () => {
        const otp = authService.generateOtp();

        // 1. The result is a string
        expect(typeof otp).toBe('string');

        // 2. The string has exactly 6 characters
        expect(otp).toHaveLength(6);

        // 3. All characters are digits (0-9)
        expect(otp).toMatch(/^[0-9]{6}$/);

        // 4. The numeric value is in range [0, 999999]
        const numericValue = parseInt(otp, 10);
        expect(numericValue).toBeGreaterThanOrEqual(0);
        expect(numericValue).toBeLessThanOrEqual(999999);
      }),
      { numRuns: 1000 },
    );
  });
});

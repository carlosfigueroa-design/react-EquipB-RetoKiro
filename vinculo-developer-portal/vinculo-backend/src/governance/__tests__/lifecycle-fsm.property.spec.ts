import * as fc from 'fast-check';
import { BadRequestException } from '@nestjs/common';
import { GovernanceService } from '../governance.service';

/**
 * Property-Based Test: Máquina de Estados del Ciclo de Vida de APIs
 *
 * **Validates: Requirements 13.1**
 *
 * Propiedad 12: Para todo par (estado actual, estado objetivo),
 * el Sistema_Gobernanza SHALL aceptar únicamente transiciones válidas
 * según la máquina de estados definida (DRAFT→ACTIVE, ACTIVE→DEPRECATED,
 * DEPRECATED→SUNSET, DEPRECATED→ACTIVE) y SHALL rechazar cualquier otra
 * transición con un error descriptivo.
 */
describe('Property 12: Máquina de Estados del Ciclo de Vida', () => {
  let service: GovernanceService;

  const ALL_STATES = ['DRAFT', 'ACTIVE', 'DEPRECATED', 'SUNSET'] as const;

  const VALID_TRANSITIONS: Array<[string, string]> = [
    ['DRAFT', 'ACTIVE'],
    ['ACTIVE', 'DEPRECATED'],
    ['DEPRECATED', 'SUNSET'],
    ['DEPRECATED', 'ACTIVE'],
  ];

  beforeEach(() => {
    // validateTransition is a pure method that doesn't use PrismaService,
    // so we can safely instantiate with null deps.
    service = new GovernanceService(null as any);
  });

  it('acepta todas las transiciones válidas y rechaza todas las inválidas para todo par (estado, objetivo)', () => {
    /**
     * **Validates: Requirements 13.1**
     *
     * Generate all possible (currentState, targetState) pairs and verify:
     * - Valid transitions do NOT throw
     * - Invalid transitions throw BadRequestException with descriptive message
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_STATES),
        fc.constantFrom(...ALL_STATES),
        (currentState, targetState) => {
          const isValid = VALID_TRANSITIONS.some(
            ([from, to]) => from === currentState && to === targetState,
          );

          if (isValid) {
            // Valid transition: should NOT throw
            expect(() =>
              service.validateTransition(currentState, targetState),
            ).not.toThrow();
          } else {
            // Invalid transition: should throw BadRequestException
            expect(() =>
              service.validateTransition(currentState, targetState),
            ).toThrow(BadRequestException);

            // Verify the error message is descriptive
            try {
              service.validateTransition(currentState, targetState);
            } catch (error) {
              expect(error).toBeInstanceOf(BadRequestException);
              const message = (error as BadRequestException).message;
              expect(message).toContain(currentState);
              expect(message).toContain(targetState);
              expect(message).toContain('Transición inválida');
            }
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});

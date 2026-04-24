import * as fc from 'fast-check';
import { ObservabilityService } from '../observability.service';

/**
 * Property-Based Test: Alerta de Umbral de Cuota
 *
 * **Validates: Requirements 10.3**
 *
 * Propiedad 21: Para todo aliado con cuota Q y consumo actual C,
 * cuando C ≥ 0.8 × Q, el sistema SHALL generar una alerta de tipo QUOTA_WARNING.
 * Cuando C < 0.8 × Q, no SHALL generarse alerta.
 */
describe('Property 21: Alerta de Umbral de Cuota', () => {
  it('genera QUOTA_WARNING cuando consumo >= 80% de cuota, y no genera cuando < 80%', () => {
    /**
     * **Validates: Requirements 10.3**
     *
     * Generate random (quota, callCount) pairs and verify:
     * - When callCount >= 0.8 * quota → alert is generated with type QUOTA_WARNING
     * - When callCount < 0.8 * quota → no alert is generated (null)
     */
    fc.assert(
      fc.property(
        fc.nat({ max: 100000 }).filter((q) => q > 0), // quota Q > 0
        fc.nat({ max: 100000 }), // consumption C
        fc.uuid(), // userId
        fc.uuid(), // apiId
        (quota, callCount, userId, apiId) => {
          const alert = ObservabilityService.evaluateQuotaAlert(
            userId,
            apiId,
            callCount,
            quota,
          );

          const threshold = 0.8 * quota;

          if (callCount >= threshold) {
            // Should generate QUOTA_WARNING
            expect(alert).not.toBeNull();
            expect(alert!.type).toBe('QUOTA_WARNING');
            expect(alert!.userId).toBe(userId);
            expect(alert!.apiId).toBe(apiId);
            expect(alert!.callCount).toBe(callCount);
            expect(alert!.quota).toBe(quota);
            expect(alert!.usagePercent).toBeGreaterThanOrEqual(0.8);
          } else {
            // Should NOT generate alert
            expect(alert).toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

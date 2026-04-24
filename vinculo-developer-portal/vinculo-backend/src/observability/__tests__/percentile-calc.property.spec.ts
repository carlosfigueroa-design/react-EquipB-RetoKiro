import * as fc from 'fast-check';
import { ObservabilityService } from '../observability.service';

/**
 * Property-Based Test: Cálculo de Percentiles de Latencia
 *
 * **Validates: Requirements 10.2**
 *
 * Propiedad 22: Para todo conjunto de valores de latencia de un API,
 * los percentiles p50, p95 y p99 SHALL ser calculados correctamente
 * según la fórmula estándar de percentiles (nearest-rank method),
 * donde p50 es la mediana, p95 es el valor por debajo del cual cae
 * el 95% de las observaciones, y p99 es el valor por debajo del cual
 * cae el 99% de las observaciones.
 */
describe('Property 22: Cálculo de Percentiles de Latencia', () => {
  /**
   * Reference implementation of nearest-rank percentile for verification.
   * index = ceil(percentile / 100 * N) - 1, clamped to [0, N-1]
   */
  function referencePercentile(sorted: number[], p: number): number {
    const n = sorted.length;
    if (n === 0) return 0;
    const rank = Math.ceil((p / 100) * n) - 1;
    const index = Math.max(0, Math.min(rank, n - 1));
    return sorted[index];
  }

  it('calcula p50, p95 y p99 correctamente según fórmula estándar de percentiles', () => {
    /**
     * **Validates: Requirements 10.2**
     *
     * Generate arrays of latency values (min 10 elements) and verify
     * that calculatePercentiles returns the correct p50, p95, p99
     * according to the nearest-rank method.
     */
    fc.assert(
      fc.property(
        fc.array(fc.nat({ max: 10000 }), { minLength: 10, maxLength: 500 }),
        (latencies) => {
          const result = ObservabilityService.calculatePercentiles(latencies);

          const sorted = [...latencies].sort((a, b) => a - b);

          const expectedP50 = referencePercentile(sorted, 50);
          const expectedP95 = referencePercentile(sorted, 95);
          const expectedP99 = referencePercentile(sorted, 99);

          expect(result.p50).toBe(expectedP50);
          expect(result.p95).toBe(expectedP95);
          expect(result.p99).toBe(expectedP99);

          // Ordering invariant: p50 <= p95 <= p99
          expect(result.p50).toBeLessThanOrEqual(result.p95);
          expect(result.p95).toBeLessThanOrEqual(result.p99);

          // All percentiles should be within the range of the data
          const min = sorted[0];
          const max = sorted[sorted.length - 1];
          expect(result.p50).toBeGreaterThanOrEqual(min);
          expect(result.p50).toBeLessThanOrEqual(max);
          expect(result.p99).toBeGreaterThanOrEqual(min);
          expect(result.p99).toBeLessThanOrEqual(max);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('retorna ceros para un array vacío', () => {
    const result = ObservabilityService.calculatePercentiles([]);
    expect(result.p50).toBe(0);
    expect(result.p95).toBe(0);
    expect(result.p99).toBe(0);
  });
});

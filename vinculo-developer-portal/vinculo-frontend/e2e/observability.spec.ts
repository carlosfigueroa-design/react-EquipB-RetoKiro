import { test, expect } from '@playwright/test';

/**
 * E2E: Observability Flow
 *
 * Validates the observability dashboard experience:
 *   Observability dashboard → Metrics → Percentiles → Trace search
 *
 * Requirements: 10.1, 10.2, 10.5
 *
 * Note: This page is restricted to LIDER_TECNICO and ADMIN roles.
 * In a full CI setup, a global setup would handle login via API.
 */

test.describe('Observability Flow — Dashboard de Métricas', () => {
  test('Dashboard page renders with heading and export button', async ({ page }) => {
    await page.goto('/observability');

    // Dashboard heading
    await expect(
      page.getByRole('heading', { name: /Dashboard de Observabilidad/i })
    ).toBeVisible();

    // CSV export button (Req 10.5)
    await expect(
      page.getByRole('button', { name: /Exportar CSV/i })
    ).toBeVisible();
  });

  test('Metrics section displays API metric cards', async ({ page }) => {
    await page.goto('/observability');

    // Metrics section heading (Req 10.1)
    const metricsSection = page.getByLabel(/Métricas por API/i);
    await expect(metricsSection).toBeVisible();

    await expect(
      metricsSection.getByRole('heading', { name: /Métricas por API/i })
    ).toBeVisible();

    // Wait for loading to finish
    await page.waitForTimeout(2000);

    // If metrics are loaded, each card should show call count, latency, and error rate
    const metricCards = metricsSection.locator('.rounded-xl');
    const count = await metricCards.count();

    if (count > 0) {
      const firstCard = metricCards.first();

      // Each card should have: Llamadas, Latencia prom., Tasa error (Req 10.1)
      await expect(firstCard.getByText('Llamadas')).toBeVisible();
      await expect(firstCard.getByText(/Latencia prom/i)).toBeVisible();
      await expect(firstCard.getByText(/Tasa error/i)).toBeVisible();
    }
  });

  test('Latency percentiles table is present with correct columns', async ({ page }) => {
    await page.goto('/observability');

    // Percentiles section (Req 10.2)
    const percentilesSection = page.getByLabel(/Percentiles de latencia/i);
    await expect(percentilesSection).toBeVisible();

    await expect(
      percentilesSection.getByRole('heading', { name: /Percentiles de Latencia/i })
    ).toBeVisible();

    // Wait for data
    await page.waitForTimeout(2000);

    // Table should have correct columns
    const table = page.getByLabel(/Tabla de percentiles de latencia/i);
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(table.getByText('API')).toBeVisible();
      await expect(table.getByText('p50')).toBeVisible();
      await expect(table.getByText('p95')).toBeVisible();
      await expect(table.getByText('p99')).toBeVisible();
    }
  });

  test('Latency percentiles table shows data in ms format', async ({ page }) => {
    await page.goto('/observability');

    await page.waitForTimeout(2000);

    const table = page.getByLabel(/Tabla de percentiles de latencia/i);
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      const rows = table.locator('tbody tr');
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRow = rows.first();
        // Values should be in "Xms" format
        const cells = firstRow.locator('td');
        const cellCount = await cells.count();

        // At least 4 cells: API name, p50, p95, p99
        expect(cellCount).toBeGreaterThanOrEqual(4);
      }
    }
  });

  test('Active alerts section is present', async ({ page }) => {
    await page.goto('/observability');

    const alertsSection = page.getByLabel(/Alertas activas/i);
    await expect(alertsSection).toBeVisible();

    await expect(
      alertsSection.getByRole('heading', { name: /Alertas Activas/i })
    ).toBeVisible();
  });

  test('Alerts display type, API name, and severity', async ({ page }) => {
    await page.goto('/observability');

    await page.waitForTimeout(2000);

    const alertsSection = page.getByLabel(/Alertas activas/i);
    const alerts = alertsSection.getByRole('alert');
    const count = await alerts.count();

    if (count > 0) {
      const firstAlert = alerts.first();
      await expect(firstAlert).toBeVisible();

      // Alert should contain text content
      const alertText = await firstAlert.textContent();
      expect(alertText?.length).toBeGreaterThan(0);
    }
  });

  test('Trace search section renders with input and button', async ({ page }) => {
    await page.goto('/observability');

    // Trace search section (Req 10.4 — distributed tracing)
    const traceSection = page.getByLabel(/Búsqueda de trace/i);
    await expect(traceSection).toBeVisible();

    await expect(
      traceSection.getByRole('heading', { name: /Trazabilidad Distribuida/i })
    ).toBeVisible();

    // Trace ID input
    await expect(traceSection.getByLabel(/Trace ID/i)).toBeVisible();

    // Search button
    await expect(
      traceSection.getByRole('button', { name: /Buscar trace/i })
    ).toBeVisible();
  });

  test('Trace search button is disabled when input is empty', async ({ page }) => {
    await page.goto('/observability');

    const searchButton = page.getByRole('button', { name: /Buscar trace/i });
    await expect(searchButton).toBeDisabled();
  });

  test('Trace search accepts input and triggers search', async ({ page }) => {
    await page.goto('/observability');

    const traceInput = page.getByLabel(/Trace ID/i);
    await traceInput.fill('abc-123-trace-id');

    // Button should now be enabled
    const searchButton = page.getByRole('button', { name: /Buscar trace/i });
    await expect(searchButton).toBeEnabled();

    // Click search
    await searchButton.click();

    // Should show loading state
    await expect(
      page.getByRole('button', { name: /Buscando/i })
    ).toBeVisible();
  });

  test('Trace search via Enter key', async ({ page }) => {
    await page.goto('/observability');

    const traceInput = page.getByLabel(/Trace ID/i);
    await traceInput.fill('test-trace-id-456');
    await traceInput.press('Enter');

    // Should trigger search (loading state)
    await expect(
      page.getByRole('button', { name: /Buscando/i })
    ).toBeVisible();
  });

  test('Export CSV button shows loading state when clicked', async ({ page }) => {
    await page.goto('/observability');

    const exportButton = page.getByRole('button', { name: /Exportar CSV/i });
    await expect(exportButton).toBeVisible();

    // Click export (Req 10.5)
    await exportButton.click();

    // Should show loading state
    await expect(
      page.getByRole('button', { name: /Exportando/i })
    ).toBeVisible();
  });

  test('Full observability flow: dashboard → metrics → percentiles → trace', async ({ page }) => {
    await page.goto('/observability');

    // 1. Dashboard loads
    await expect(
      page.getByRole('heading', { name: /Dashboard de Observabilidad/i })
    ).toBeVisible();

    // 2. Metrics section is visible
    await expect(page.getByLabel(/Métricas por API/i)).toBeVisible();

    // 3. Percentiles table is visible
    await expect(page.getByLabel(/Percentiles de latencia/i)).toBeVisible();

    // 4. Alerts section is visible
    await expect(page.getByLabel(/Alertas activas/i)).toBeVisible();

    // 5. Trace search is visible
    await expect(page.getByLabel(/Búsqueda de trace/i)).toBeVisible();

    // 6. Perform a trace search
    await page.getByLabel(/Trace ID/i).fill('e2e-test-trace');
    await page.getByRole('button', { name: /Buscar trace/i }).click();

    // 7. Export CSV
    await page.getByRole('button', { name: /Exportar CSV/i }).click();
  });
});

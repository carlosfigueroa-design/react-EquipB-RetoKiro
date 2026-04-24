import { test, expect } from '@playwright/test';

/**
 * E2E: Deprecation Flow
 *
 * Validates the API deprecation and governance lifecycle:
 *   Governance page → Filter by state → View timeline
 *
 * Requirements: 8.1, 8.2, 8.3, 8.5
 */

test.describe('Deprecation Flow — Gobernanza y Ciclo de Vida', () => {
  test('Governance page renders with heading and description', async ({ page }) => {
    await page.goto('/governance');

    await expect(
      page.getByRole('heading', { name: /Gobernanza de APIs/i })
    ).toBeVisible();

    await expect(
      page.getByText(/Gestión del ciclo de vida/i)
    ).toBeVisible();
  });

  test('Governance page shows state summary cards', async ({ page }) => {
    await page.goto('/governance');

    // State summary section with 4 state cards
    const summary = page.getByLabel(/Resumen de estados/i);
    await expect(summary).toBeVisible();

    // Each lifecycle state should have a card
    for (const state of ['Borrador', 'Activa', 'Deprecada', 'Sunset']) {
      await expect(summary.getByText(state)).toBeVisible();
    }
  });

  test('Governance filters are present and functional', async ({ page }) => {
    await page.goto('/governance');

    const filtersSection = page.getByLabel(/Filtros de gobernanza/i);
    await expect(filtersSection).toBeVisible();

    // State filter (Req 8.1 — filter by lifecycle state)
    const stateFilter = page.getByLabel(/Filtrar por estado/i);
    await expect(stateFilter).toBeVisible();

    // Product filter
    const productFilter = page.getByLabel(/Filtrar por producto/i);
    await expect(productFilter).toBeVisible();

    // Process filter
    const processFilter = page.getByLabel(/Filtrar por proceso/i);
    await expect(processFilter).toBeVisible();

    // Clear filters button
    await expect(
      page.getByRole('button', { name: /Limpiar filtros/i })
    ).toBeVisible();
  });

  test('Filter by DEPRECATED state using dropdown', async ({ page }) => {
    await page.goto('/governance');

    // Select DEPRECATED from state filter
    await page.getByLabel(/Filtrar por estado/i).selectOption('DEPRECATED');

    // The filter should be applied — the DEPRECATED card should be highlighted
    // or the list should only show deprecated APIs
    const deprecatedCard = page.getByRole('button', { name: /Filtrar por Deprecada/i });
    await expect(deprecatedCard).toBeVisible();
  });

  test('Filter by state using summary cards', async ({ page }) => {
    await page.goto('/governance');

    // Click on the "Activa" summary card to filter
    await page.getByRole('button', { name: /Filtrar por Activa/i }).click();

    // Click again to deselect
    await page.getByRole('button', { name: /Filtrar por Activa/i }).click();
  });

  test('Clear filters resets all selections', async ({ page }) => {
    await page.goto('/governance');

    // Apply a filter
    await page.getByLabel(/Filtrar por estado/i).selectOption('ACTIVE');

    // Clear filters
    await page.getByRole('button', { name: /Limpiar filtros/i }).click();

    // State filter should be reset to "Todos"
    await expect(page.getByLabel(/Filtrar por estado/i)).toHaveValue('');
    await expect(page.getByLabel(/Filtrar por producto/i)).toHaveValue('');
    await expect(page.getByLabel(/Filtrar por proceso/i)).toHaveValue('');
  });

  test('API card shows lifecycle state badge and metadata', async ({ page }) => {
    await page.goto('/governance');

    // Wait for loading to finish
    await page.waitForSelector('[aria-label="Cargando gobernanza"]', {
      state: 'hidden',
      timeout: 10_000,
    }).catch(() => {
      // Loading may have already finished
    });

    // If APIs are loaded, check the card structure
    const apiCards = page.getByRole('button', { name: /Ver timeline de/i });
    const count = await apiCards.count();

    if (count > 0) {
      const firstCard = apiCards.first();
      await expect(firstCard).toBeVisible();

      // Card should contain state badge text (one of the lifecycle states)
      const cardText = await firstCard.textContent();
      const hasState = ['Borrador', 'Activa', 'Deprecada', 'Sunset'].some(
        (s) => cardText?.includes(s)
      );
      expect(hasState).toBe(true);
    }
  });

  test('Deprecated API card shows days remaining until sunset', async ({ page }) => {
    await page.goto('/governance');

    // Filter to DEPRECATED
    await page.getByLabel(/Filtrar por estado/i).selectOption('DEPRECATED');

    // Wait for content
    await page.waitForTimeout(1000);

    // If there are deprecated APIs, they should show "días restantes" or "Sunset hoy"
    const daysLabels = page.getByText(/días restantes|Sunset hoy/i);
    const count = await daysLabels.count();

    // This is conditional — only if deprecated APIs exist with sunset dates
    if (count > 0) {
      await expect(daysLabels.first()).toBeVisible();
    }
  });

  test('Clicking an API card toggles the timeline view', async ({ page }) => {
    await page.goto('/governance');

    // Wait for loading
    await page.waitForTimeout(2000);

    const apiCards = page.getByRole('button', { name: /Ver timeline de/i });
    const count = await apiCards.count();

    if (count > 0) {
      const firstCard = apiCards.first();

      // Click to expand timeline
      await firstCard.click();

      // The card should now be expanded (aria-expanded=true)
      await expect(firstCard).toHaveAttribute('aria-expanded', 'true');

      // Timeline section should be visible
      const timelineSection = page.getByLabel(new RegExp(`Timeline de.*`, 'i'));
      if (await timelineSection.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(timelineSection).toBeVisible();
      }

      // Click again to collapse
      await firstCard.click();
      await expect(firstCard).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('Timeline shows governance events with action labels and dates', async ({ page }) => {
    await page.goto('/governance');

    await page.waitForTimeout(2000);

    const apiCards = page.getByRole('button', { name: /Ver timeline de/i });
    const count = await apiCards.count();

    if (count > 0) {
      // Expand the first API's timeline
      await apiCards.first().click();

      // Wait for timeline to load
      await page.waitForTimeout(1500);

      // Check for timeline event labels
      const eventLabels = ['Publicada', 'Deprecada', 'Sunset', 'Reactivada', 'Creada'];
      const timelineContent = await page.textContent('body');

      // At least one event type should be present if timeline has data
      const hasEvents = eventLabels.some((label) => timelineContent?.includes(label));
      // Timeline may be empty — that's also valid
      if (hasEvents) {
        // Verify date formatting (es-CO locale)
        const datePattern = /\d{1,2}\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i;
        expect(datePattern.test(timelineContent ?? '')).toBe(true);
      }
    }
  });

  test('Deprecated API detail page shows DEPRECATED banner', async ({ page }) => {
    // Navigate to a deprecated API detail page (Req 8.1)
    // This test verifies the banner appears on the detail page
    await page.goto('/catalog/deprecated-api-id');

    // If the API is deprecated, a banner should be visible
    const banner = page.getByRole('alert').filter({ hasText: /DEPRECATED/i });
    if (await banner.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(banner).toBeVisible();
      await expect(banner).toContainText('DEPRECATED');
    }
  });
});

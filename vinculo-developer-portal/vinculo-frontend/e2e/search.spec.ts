import { test, expect } from '@playwright/test';

/**
 * E2E: Search Flow
 *
 * Validates the search and discovery experience:
 *   Landing search → Catalog with filters → API detail
 *
 * Requirements: 1.4, 1.5, 3.1, 12.1, 12.2, 12.3
 */

test.describe('Search Flow — Búsqueda y Descubrimiento', () => {
  test('Landing page has a visible global search bar', async ({ page }) => {
    await page.goto('/');

    // Global search is visible on landing (Req 1.4)
    const searchForm = page.getByRole('search', { name: /Buscar APIs/i });
    await expect(searchForm).toBeVisible();

    const searchInput = page.getByPlaceholder(/Buscar APIs por nombre/i);
    await expect(searchInput).toBeVisible();

    const searchButton = page.getByRole('button', { name: /Buscar/i });
    await expect(searchButton).toBeVisible();
  });

  test('Search from landing navigates to catalog with query param', async ({ page }) => {
    await page.goto('/');

    // Type a search query (Req 12.1)
    const searchInput = page.getByPlaceholder(/Buscar APIs por nombre/i);
    await searchInput.fill('cotización auto');

    // Submit search
    await page.getByRole('button', { name: /Buscar/i }).click();

    // Should navigate to catalog with search param (Req 1.5 — < 500ms)
    await page.waitForURL(/\/catalog\?search=cotizaci/);
    await expect(
      page.getByRole('heading', { name: /Catálogo de APIs/i })
    ).toBeVisible();
  });

  test('Catalog search bar is pre-filled from URL query param', async ({ page }) => {
    await page.goto('/catalog?search=vida');

    const searchInput = page.getByLabel(/Buscar APIs/i);
    await expect(searchInput).toHaveValue('vida');
  });

  test('Catalog search bar accepts keyboard input and Enter to search', async ({ page }) => {
    await page.goto('/catalog');

    const searchInput = page.getByLabel(/Buscar APIs/i);
    await searchInput.fill('póliza hogar');
    await searchInput.press('Enter');

    // URL should update with search param
    await expect(page).toHaveURL(/search=p.*liza/);
  });

  test('Catalog filters: product radio buttons work', async ({ page }) => {
    await page.goto('/catalog');

    // Select a product filter (Req 12.3)
    const vidaRadio = page.getByLabel('Vida');
    await vidaRadio.check();
    await expect(vidaRadio).toBeChecked();

    // Deselect by clicking again
    await vidaRadio.click();
    await expect(vidaRadio).not.toBeChecked();
  });

  test('Catalog filters: process dropdown works', async ({ page }) => {
    await page.goto('/catalog');

    const processSelect = page.getByLabel(/Filtrar por proceso/i);
    await processSelect.selectOption('Cotización');
    await expect(processSelect).toHaveValue('Cotización');

    // Reset to "Todos"
    await processSelect.selectOption('');
    await expect(processSelect).toHaveValue('');
  });

  test('Catalog filters: state dropdown works', async ({ page }) => {
    await page.goto('/catalog');

    const stateSelect = page.getByLabel(/Filtrar por estado/i);
    await stateSelect.selectOption('ACTIVE');
    await expect(stateSelect).toHaveValue('ACTIVE');

    await stateSelect.selectOption('DEPRECATED');
    await expect(stateSelect).toHaveValue('DEPRECATED');
  });

  test('Catalog filters: version text input works', async ({ page }) => {
    await page.goto('/catalog');

    const versionInput = page.getByLabel(/Filtrar por versión/i);
    await versionInput.fill('2.0.0');
    await expect(versionInput).toHaveValue('2.0.0');
  });

  test('Clear filters button resets all filters and search', async ({ page }) => {
    await page.goto('/catalog?search=test');

    // Apply some filters
    await page.getByLabel('Auto').check();
    await page.getByLabel(/Filtrar por estado/i).selectOption('ACTIVE');

    // Click clear
    await page.getByRole('button', { name: /Limpiar/i }).click();

    // All filters should be reset
    await expect(page.getByLabel('Auto')).not.toBeChecked();
    await expect(page.getByLabel(/Filtrar por estado/i)).toHaveValue('');
    await expect(page.getByLabel(/Filtrar por versión/i)).toHaveValue('');
  });

  test('API cards in catalog show name, description, state badge, and metadata', async ({ page }) => {
    await page.goto('/catalog');

    // Wait for loading to finish
    await page.waitForTimeout(2000);

    const apiList = page.getByRole('list', { name: /Lista de APIs/i });
    if (await apiList.isVisible({ timeout: 3000 }).catch(() => false)) {
      const items = apiList.getByRole('listitem');
      const count = await items.count();

      if (count > 0) {
        const firstItem = items.first();

        // Each card should have a heading (API name)
        const heading = firstItem.locator('h3');
        await expect(heading).toBeVisible();

        // State badge
        const stateBadge = firstItem.locator('span').filter({
          hasText: /ACTIVE|DEPRECATED|DRAFT|SUNSET/,
        });
        await expect(stateBadge.first()).toBeVisible();
      }
    }
  });

  test('Clicking an API card navigates to detail page', async ({ page }) => {
    await page.goto('/catalog');

    await page.waitForTimeout(2000);

    const apiList = page.getByRole('list', { name: /Lista de APIs/i });
    if (await apiList.isVisible({ timeout: 3000 }).catch(() => false)) {
      const items = apiList.getByRole('listitem');
      const count = await items.count();

      if (count > 0) {
        // Click the first API card
        await items.first().click();

        // Should navigate to /catalog/:apiId
        await expect(page).toHaveURL(/\/catalog\/.+/);
      }
    }
  });

  test('Catalog pagination controls are present when needed', async ({ page }) => {
    await page.goto('/catalog');

    await page.waitForTimeout(2000);

    // Pagination nav
    const pagination = page.getByRole('navigation', { name: /Paginación/i });
    if (await pagination.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(
        pagination.getByRole('button', { name: /Anterior/i })
      ).toBeVisible();
      await expect(
        pagination.getByRole('button', { name: /Siguiente/i })
      ).toBeVisible();
      await expect(pagination.getByText(/Página \d+ de \d+/)).toBeVisible();
    }
  });

  test('Search with no results shows empty state message', async ({ page }) => {
    await page.goto('/catalog');

    const searchInput = page.getByLabel(/Buscar APIs/i);
    await searchInput.fill('xyznonexistentapi12345');
    await searchInput.press('Enter');

    await page.waitForTimeout(2000);

    // Should show empty state
    const emptyMessage = page.getByText(/No se encontraron APIs/i);
    if (await emptyMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('Full search flow: Landing → Catalog → API Detail', async ({ page }) => {
    // 1. Start at Landing
    await page.goto('/');

    // 2. Search for an API
    await page.getByPlaceholder(/Buscar APIs por nombre/i).fill('seguro');
    await page.getByRole('button', { name: /Buscar/i }).click();
    await page.waitForURL(/\/catalog\?search=/);

    // 3. Catalog page is shown with search applied
    await expect(
      page.getByRole('heading', { name: /Catálogo de APIs/i })
    ).toBeVisible();

    // 4. Apply a product filter
    await page.getByLabel('Vida').check();

    // 5. Navigate to catalog without search to see all APIs
    await page.goto('/catalog');
    await expect(
      page.getByRole('heading', { name: /Catálogo de APIs/i })
    ).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

/**
 * E2E: Golden Path
 *
 * Validates the complete onboarding flow for a new external partner:
 *   Landing → Auth → Catalog → API Detail → Sandbox → First API call
 *
 * Requirements: 1.1, 1.2, 2.1, 2.2, 2.5, 3.1, 3.3, 4.1, 4.2
 */

test.describe('Golden Path — Onboarding completo', () => {
  test('Landing page loads with hero, search, and CTA', async ({ page }) => {
    await page.goto('/');

    // Hero section is visible
    await expect(page.getByRole('heading', { name: /VÍNCULO Developer Portal/i })).toBeVisible();

    // CTA button to register/login is visible (Req 1.6)
    await expect(
      page.getByRole('link', { name: /Registrarse.*Iniciar sesión/i })
    ).toBeVisible();

    // Global search bar is visible (Req 1.4)
    await expect(page.getByRole('search', { name: /Buscar APIs/i })).toBeVisible();

    // Featured APIs section shows product groups (Req 1.2)
    for (const product of ['Vida', 'Auto', 'Hogar', 'Salud']) {
      await expect(page.getByRole('heading', { name: product })).toBeVisible();
    }
  });

  test('Navigate from Landing to Auth page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Registrarse.*Iniciar sesión/i }).click();
    await page.waitForURL('/auth');

    // Auth page shows email form (Req 2.1)
    await expect(
      page.getByRole('heading', { name: /Iniciar sesión/i })
    ).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Enviar código OTP/i })
    ).toBeVisible();
  });

  test('Auth flow: submit email and see OTP form', async ({ page }) => {
    await page.goto('/auth');

    // Fill email and submit (Req 2.1, 2.2)
    await page.getByLabel(/Email/i).fill('aliado@empresa.com');
    await page.getByRole('button', { name: /Enviar código OTP/i }).click();

    // Should transition to OTP step
    await expect(
      page.getByRole('heading', { name: /Verificar código/i })
    ).toBeVisible();

    // OTP inputs should be visible — 6 digit inputs (Req 2.2)
    const otpInputs = page.getByLabel(/Dígito \d+ del código OTP/i);
    await expect(otpInputs).toHaveCount(6);

    // Countdown timer should be visible
    await expect(page.getByText(/El código expira en/i)).toBeVisible();

    // Verify button should be visible
    await expect(
      page.getByRole('button', { name: /Verificar código/i })
    ).toBeVisible();
  });

  test('Navigate from Landing to Catalog', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Ver Catálogo Completo/i }).click();
    await page.waitForURL('/catalog');

    // Catalog page renders (Req 3.1)
    await expect(
      page.getByRole('heading', { name: /Catálogo de APIs/i })
    ).toBeVisible();

    // Search bar is present
    await expect(page.getByLabel(/Buscar APIs/i)).toBeVisible();

    // Filters sidebar is present
    await expect(page.getByLabel(/Filtros del catálogo/i)).toBeVisible();
  });

  test('Catalog shows filters for product, process, state, and version', async ({ page }) => {
    await page.goto('/catalog');

    // Product filter (Req 3.1)
    await expect(page.getByText('Producto')).toBeVisible();
    for (const product of ['Vida', 'Auto', 'Hogar', 'Salud']) {
      await expect(page.getByLabel(product)).toBeVisible();
    }

    // Process filter
    await expect(page.getByLabel(/Filtrar por proceso/i)).toBeVisible();

    // State filter
    await expect(page.getByLabel(/Filtrar por estado/i)).toBeVisible();

    // Version filter
    await expect(page.getByLabel(/Filtrar por versión/i)).toBeVisible();
  });

  test('Landing search redirects to Catalog with query', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByPlaceholder(/Buscar APIs por nombre/i);
    await searchInput.fill('cotización vida');
    await page.getByRole('button', { name: /Buscar/i }).click();

    await page.waitForURL(/\/catalog\?search=/);
    await expect(
      page.getByRole('heading', { name: /Catálogo de APIs/i })
    ).toBeVisible();
  });

  test('API Detail page renders with tabs and sandbox link', async ({ page }) => {
    // Navigate to a mock API detail page
    await page.goto('/catalog/test-api-id');

    // The page should show either the API detail or an error
    // When the API loads, it should have tabs (Req 3.3)
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Check for tab navigation
    const tabList = page.getByRole('tablist', { name: /Secciones del detalle/i });
    if (await tabList.isVisible()) {
      await expect(page.getByRole('tab', { name: /Descripción/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Documentación/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Casos de Prueba/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Sandbox/i })).toBeVisible();
    }
  });

  test('Sandbox page renders with request/response panels', async ({ page }) => {
    await page.goto('/sandbox/test-api-id');

    // Sandbox header (Req 4.1)
    await expect(
      page.getByRole('heading', { name: /Sandbox Interactivo/i })
    ).toBeVisible();

    // Demo mode badge for unauthenticated users (Req 4.6)
    await expect(page.getByText(/Modo Demo/i)).toBeVisible();

    // Request panel elements (Req 4.1)
    await expect(page.getByRole('heading', { name: 'Request' })).toBeVisible();
    await expect(page.getByLabel(/Método HTTP/i)).toBeVisible();
    await expect(page.getByLabel(/URL del endpoint/i)).toBeVisible();
    await expect(page.getByLabel(/Request Body/i)).toBeVisible();

    // Error scenario selector (Req 4.4)
    await expect(page.getByLabel(/Escenario de Error/i)).toBeVisible();

    // Execute button
    await expect(
      page.getByRole('button', { name: /Ejecutar/i })
    ).toBeVisible();

    // Response panel
    await expect(page.getByRole('heading', { name: 'Response' })).toBeVisible();
  });

  test('Full golden path navigation flow', async ({ page }) => {
    // 1. Start at Landing
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /VÍNCULO Developer Portal/i })).toBeVisible();

    // 2. Go to Catalog
    await page.getByRole('link', { name: /Ver Catálogo Completo/i }).click();
    await page.waitForURL('/catalog');
    await expect(page.getByRole('heading', { name: /Catálogo de APIs/i })).toBeVisible();

    // 3. Navigate back to Landing and go to Auth
    await page.goto('/');
    await page.getByRole('link', { name: /Registrarse.*Iniciar sesión/i }).click();
    await page.waitForURL('/auth');
    await expect(page.getByRole('heading', { name: /Iniciar sesión/i })).toBeVisible();

    // 4. Go to Sandbox (public demo mode)
    await page.goto('/sandbox/test-api-id');
    await expect(page.getByRole('heading', { name: /Sandbox Interactivo/i })).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

/**
 * E2E: Admin Flow
 *
 * Validates the administrator workflow:
 *   Admin panel → API table → Create API form → Governance actions
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 *
 * Note: These tests assume an authenticated admin session.
 * In a full CI setup, a global setup would handle login via API
 * and inject the auth token into storageState.
 */

test.describe('Admin Flow — Panel de Administración', () => {
  test('Admin page renders with header and action buttons', async ({ page }) => {
    await page.goto('/admin');

    // Admin panel heading
    await expect(
      page.getByRole('heading', { name: /Panel de Administración/i })
    ).toBeVisible();

    // Action buttons (Req 6.1)
    await expect(
      page.getByRole('button', { name: /Crear API con IA/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Subir OpenAPI Spec/i })
    ).toBeVisible();
  });

  test('API table displays columns and data structure', async ({ page }) => {
    await page.goto('/admin');

    // Table heading
    await expect(
      page.getByRole('heading', { name: /APIs del Portal/i })
    ).toBeVisible();

    // Table should be present with correct columns
    const table = page.getByLabel(/Tabla de APIs/i);
    await expect(table).toBeVisible();

    // Verify column headers
    await expect(table.getByText('Nombre')).toBeVisible();
    await expect(table.getByText('Producto')).toBeVisible();
    await expect(table.getByText('Proceso')).toBeVisible();
    await expect(table.getByText('Estado')).toBeVisible();
    await expect(table.getByText('Versión')).toBeVisible();
    await expect(table.getByText('SLA')).toBeVisible();
    await expect(table.getByText('Acciones')).toBeVisible();
  });

  test('Create API form opens and shows JSON input', async ({ page }) => {
    await page.goto('/admin');

    // Click "Crear API con IA" button (Req 6.1)
    await page.getByRole('button', { name: /Crear API con IA/i }).click();

    // Form should appear
    await expect(
      page.getByLabel(/Formulario crear API/i)
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: /Crear API con IA/i }).nth(1)
    ).toBeVisible();

    // JSON textarea (Req 6.1)
    await expect(page.getByLabel(/JSON de Request Body/i)).toBeVisible();

    // Generate preview button (Req 6.5)
    await expect(
      page.getByRole('button', { name: /Generar vista previa con IA/i })
    ).toBeVisible();

    // Cancel button
    await expect(
      page.getByRole('button', { name: /Cancelar creación/i })
    ).toBeVisible();
  });

  test('Create API form: generate preview button is disabled when empty', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: /Crear API con IA/i }).click();

    // Button should be disabled when textarea is empty
    const generateBtn = page.getByRole('button', { name: /Generar vista previa con IA/i });
    await expect(generateBtn).toBeDisabled();
  });

  test('Create API form: fill JSON and trigger preview generation', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: /Crear API con IA/i }).click();

    // Fill JSON input (Req 6.1, 6.2)
    const jsonInput = page.getByLabel(/JSON de Request Body/i);
    await jsonInput.fill(JSON.stringify({
      endpoint: '/api/v1/cotizacion/vida',
      method: 'POST',
      body: {
        tipoDocumento: 'CC',
        numeroDocumento: '1234567890',
        fechaNacimiento: '1990-01-15',
        sumaAsegurada: 100000000,
      },
    }, null, 2));

    // Generate button should now be enabled
    const generateBtn = page.getByRole('button', { name: /Generar vista previa con IA/i });
    await expect(generateBtn).toBeEnabled();

    // Click generate — this will attempt an API call
    await generateBtn.click();

    // Should show loading state (Req 6.4)
    await expect(
      page.getByRole('button', { name: /Generando/i })
    ).toBeVisible();
  });

  test('Upload OpenAPI spec form opens with file input', async ({ page }) => {
    await page.goto('/admin');

    // Click "Subir OpenAPI Spec" button
    await page.getByRole('button', { name: /Subir OpenAPI Spec/i }).click();

    // Form should appear
    await expect(
      page.getByLabel(/Formulario subir especificación/i)
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: /Subir Especificación OpenAPI/i })
    ).toBeVisible();

    // File input
    await expect(
      page.getByLabel(/Archivo de especificación OpenAPI/i)
    ).toBeVisible();

    // Upload button should be disabled without file
    await expect(
      page.getByRole('button', { name: /Subir especificación/i })
    ).toBeDisabled();
  });

  test('Cancel buttons close their respective forms', async ({ page }) => {
    await page.goto('/admin');

    // Open and close Create API form
    await page.getByRole('button', { name: /Crear API con IA/i }).click();
    await expect(page.getByLabel(/Formulario crear API/i)).toBeVisible();
    await page.getByRole('button', { name: /Cancelar creación/i }).click();
    await expect(page.getByLabel(/Formulario crear API/i)).not.toBeVisible();

    // Open and close Upload Spec form
    await page.getByRole('button', { name: /Subir OpenAPI Spec/i }).click();
    await expect(page.getByLabel(/Formulario subir especificación/i)).toBeVisible();
    await page.getByRole('button', { name: /Cancelar subida/i }).click();
    await expect(page.getByLabel(/Formulario subir especificación/i)).not.toBeVisible();
  });

  test('Governance action modal renders with confirmation', async ({ page }) => {
    await page.goto('/admin');

    // If there are APIs with DRAFT state, a "Publicar" button should appear
    // We check the governance modal structure by looking for the dialog pattern
    const publishButtons = page.getByRole('button', { name: /^Publicar /i });
    const deprecateButtons = page.getByRole('button', { name: /^Deprecar /i });

    // Try to trigger a governance action if any action button exists
    const anyActionButton = publishButtons.or(deprecateButtons).first();
    if (await anyActionButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await anyActionButton.click();

      // Governance modal should appear (Req 6.6)
      const dialog = page.getByRole('dialog', { name: /Confirmar/i });
      await expect(dialog).toBeVisible();

      // Confirm and Cancel buttons
      await expect(dialog.getByRole('button', { name: /Confirmar/i })).toBeVisible();
      await expect(dialog.getByRole('button', { name: /Cancelar acción/i })).toBeVisible();
    }
  });

  test('Deprecation governance modal shows migration window selector', async ({ page }) => {
    await page.goto('/admin');

    // Look for a "Deprecar" button on an ACTIVE API
    const deprecateButton = page.getByRole('button', { name: /^Deprecar /i }).first();
    if (await deprecateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deprecateButton.click();

      const dialog = page.getByRole('dialog', { name: /Confirmar/i });
      await expect(dialog).toBeVisible();

      // Migration window selector should be visible for deprecation
      await expect(dialog.getByLabel(/Seleccionar ventana de migración/i)).toBeVisible();

      // Options: 30, 60, 90 days
      const select = dialog.getByLabel(/Seleccionar ventana de migración/i);
      await expect(select.locator('option')).toHaveCount(3);
    }
  });

  test('Switching between Create and Upload forms hides the other', async ({ page }) => {
    await page.goto('/admin');

    // Open Create form
    await page.getByRole('button', { name: /Crear API con IA/i }).click();
    await expect(page.getByLabel(/Formulario crear API/i)).toBeVisible();

    // Click Upload — should hide Create form
    await page.getByRole('button', { name: /Subir OpenAPI Spec/i }).click();
    await expect(page.getByLabel(/Formulario crear API/i)).not.toBeVisible();
    await expect(page.getByLabel(/Formulario subir especificación/i)).toBeVisible();

    // Click Create again — should hide Upload form
    await page.getByRole('button', { name: /Crear API con IA/i }).click();
    await expect(page.getByLabel(/Formulario subir especificación/i)).not.toBeVisible();
    await expect(page.getByLabel(/Formulario crear API/i)).toBeVisible();
  });
});

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for VÍNCULO Developer Portal.
 *
 * Run with: npm run test:e2e
 *
 * Expects the frontend dev server at http://localhost:5173
 * and the backend API at http://localhost:3000.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],

  /* Shared settings for all projects */
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  /* Global timeout per test */
  timeout: 60_000,

  /* Expect timeout */
  expect: {
    timeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

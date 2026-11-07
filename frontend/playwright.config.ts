import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_URL || 'http://127.0.0.1:5177',
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.E2E_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:5177',
        reuseExistingServer: !process.env.CI,
      },
});

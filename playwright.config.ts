import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['html', { outputFolder: 'tests/report', open: 'never' }]],
  globalSetup: './tests/e2e/global-setup.ts',

  use: {
    baseURL: 'http://localhost:4201',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    storageState: 'tests/e2e/.auth/state.json',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'npx ng serve --port 4201',
    url: 'http://localhost:4201',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

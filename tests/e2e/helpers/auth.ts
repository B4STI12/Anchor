import { Page } from '@playwright/test';

export const TEST_EMAIL    = process.env['TEST_EMAIL']    ?? '';
export const TEST_PASSWORD = process.env['TEST_PASSWORD'] ?? '';

export function hasTestCredentials(): boolean {
  return !!TEST_EMAIL && !!TEST_PASSWORD;
}

/** Navigate to login and sign in with test credentials. Throws if env vars missing. */
export async function loginAsTestUser(page: Page): Promise<void> {
  if (!hasTestCredentials()) {
    throw new Error(
      'Set TEST_EMAIL and TEST_PASSWORD env vars to run authenticated tests.\n' +
      'Example: TEST_EMAIL=you@example.com TEST_PASSWORD=secret npm test'
    );
  }
  await page.goto('/#/login');
  await page.locator('input[name="email"]').fill(TEST_EMAIL);
  await page.locator('input[name="password"]').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  // Wait for navigation away from login
  await page.waitForURL(/\/#\/app/, { timeout: 10_000 });
}

/** Skip a test if TEST_EMAIL / TEST_PASSWORD are not configured. */
export function skipIfNoCredentials(testFn: () => void): void {
  if (!hasTestCredentials()) {
    console.log('  ↳ skipped (no TEST_EMAIL / TEST_PASSWORD)');
    return;
  }
  testFn();
}

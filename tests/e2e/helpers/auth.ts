import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const TEST_EMAIL    = process.env['TEST_EMAIL']    ?? '';
export const TEST_PASSWORD = process.env['TEST_PASSWORD'] ?? '';

const AUTH_STATE_PATH = path.join(__dirname, '../.auth/state.json');

export function hasTestCredentials(): boolean {
  return !!TEST_EMAIL && !!TEST_PASSWORD;
}

/**
 * Fast path: injects the saved storageState session into the page context
 * via addInitScript (runs before Angular boots), then navigates to the app.
 *
 * Falls back to full UI login if the state file doesn't exist yet.
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  if (!hasTestCredentials()) {
    throw new Error(
      'Set TEST_EMAIL and TEST_PASSWORD env vars to run authenticated tests.\n' +
      'Example: TEST_EMAIL=you@example.com TEST_PASSWORD=secret npm test'
    );
  }

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  if (fs.existsSync(AUTH_STATE_PATH)) {
    const state = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8')) as {
      cookies: Array<Record<string, unknown>>;
      origins: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>;
    };

    // Inject cookies into the context
    if (state.cookies?.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.context().addCookies(state.cookies as any[]);
    }

    // Inject localStorage before Angular initialises (addInitScript runs before any page scripts)
    const localStorageItems = state.origins?.flatMap(o => o.localStorage ?? []) ?? [];
    if (localStorageItems.length) {
      await page.addInitScript((items: Array<{ name: string; value: string }>) => {
        for (const { name, value } of items) {
          window.localStorage.setItem(name, value);
        }
      }, localStorageItems);
    }

    await page.goto('/#/app');
    await page.waitForURL(/\/#\/app/, { timeout: 15_000 });
    return;
  }

  // Fallback: full UI login (only hit if globalSetup hasn't run yet)
  await page.goto('/#/login');
  await page.locator('input[name="email"]').fill(TEST_EMAIL);
  await page.locator('input[name="password"]').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/#\/app/, { timeout: 60_000 });
}

/** Skip a test if TEST_EMAIL / TEST_PASSWORD are not configured. */
export function skipIfNoCredentials(testFn: () => void): void {
  if (!hasTestCredentials()) {
    console.log('  ↳ skipped (no TEST_EMAIL / TEST_PASSWORD)');
    return;
  }
  testFn();
}

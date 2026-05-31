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
 * Navigate to the app as an authenticated user.
 *
 * The app uses Supabase with persistSession:false, so sessions live in memory
 * only and cannot be saved to a storageState file. Each call performs a full
 * UI login. globalSetup warms the Angular dev server so the login is fast.
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  if (!hasTestCredentials()) {
    throw new Error(
      'Set TEST_EMAIL and TEST_PASSWORD env vars to run authenticated tests.\n' +
      'Example: TEST_EMAIL=you@example.com TEST_PASSWORD=secret npm test'
    );
  }

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  // Check if the saved state has a real session (cookies or localStorage entries).
  // Since Supabase is configured with persistSession:false the state file will
  // always be empty — detect this and skip straight to UI login.
  let hasPersistedSession = false;
  if (fs.existsSync(AUTH_STATE_PATH)) {
    try {
      const state = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8')) as {
        cookies?: Array<unknown>;
        origins?: Array<{ localStorage?: Array<unknown> }>;
      };
      hasPersistedSession =
        (state.cookies?.length ?? 0) > 0 ||
        (state.origins?.flatMap(o => o.localStorage ?? []).length ?? 0) > 0;
    } catch { /* malformed state file — fall through to UI login */ }
  }

  if (hasPersistedSession) {
    const state = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8')) as {
      cookies: Array<Record<string, unknown>>;
      origins: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>;
    };

    if (state.cookies?.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.context().addCookies(state.cookies as any[]);
    }

    const localStorageItems = state.origins?.flatMap(o => o.localStorage ?? []) ?? [];
    if (localStorageItems.length) {
      await page.addInitScript((items: Array<{ name: string; value: string }>) => {
        for (const { name, value } of items) window.localStorage.setItem(name, value);
      }, localStorageItems);
    }

    await page.goto('/#/app');
    await page.waitForURL(/\/#\/app/, { timeout: 15_000 });
    return;
  }

  // Full UI login (standard path for this app since sessions aren't persisted)
  await page.goto('/#/login');
  await page.locator('input[name="email"]').fill(TEST_EMAIL);
  await page.locator('input[name="password"]').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/#\/app/, { timeout: 60_000 });
  // Wait for the initial Supabase fetches (profile load, bundle list) to settle.
  // ShellComponent.ngOnInit() calls profile.load() async — without this wait,
  // profileService.active().id is still '' (falsy) and create() calls silently fail.
  await page.waitForLoadState('networkidle', { timeout: 20_000 });
}

/** Skip a test if TEST_EMAIL / TEST_PASSWORD are not configured. */
export function skipIfNoCredentials(testFn: () => void): void {
  if (!hasTestCredentials()) {
    console.log('  ↳ skipped (no TEST_EMAIL / TEST_PASSWORD)');
    return;
  }
  testFn();
}

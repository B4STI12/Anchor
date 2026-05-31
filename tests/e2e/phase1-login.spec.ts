/**
 * Phase 1 — Login screen
 * Tests the unauthenticated login page: layout, validation, error handling, auth flow.
 *
 * Uses a shared browser page across all tests (created once in beforeAll) with
 * page.reload() in beforeEach. This avoids the per-test context-creation overhead
 * that caused tests 4+ to exceed the 60 s timeout. page.reload() triggers a full
 * navigation cycle which clears Angular/Supabase in-memory state (persistSession:false),
 * so each test starts unauthenticated just as a fresh context would.
 */
import { test, expect, Page } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD, hasTestCredentials } from './helpers/auth';

test.describe('Phase 1 · Login page', () => {
  // Override storageState at describe level so the shared page context is created
  // without any persisted session (same effect as per-test override).
  test.use({ storageState: { cookies: [], origins: [] } });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Allow extra time for the initial cold-navigation — dev server is warm from
    // globalSetup but the first real page creation still needs the JS bundle.
    test.setTimeout(120_000);
    page = await browser.newPage();
    await page.goto('/#/login');
    await page.locator('.login-title').waitFor({ state: 'visible', timeout: 90_000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  // page.reload() re-runs the full Angular bootstrap + auth guard on the current
  // URL. Because persistSession:false the Supabase session is gone after each
  // reload, so the auth guard always starts unauthenticated.
  test.beforeEach(async () => {
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.login-title').waitFor({ state: 'visible', timeout: 30_000 });
  });

  // ── Layout ──────────────────────────────────────────────────────────────

  test('renders Anchor logo and name', async () => {
    await expect(page.locator('.logo-icon svg')).toBeVisible();
    await expect(page.locator('.logo-name')).toHaveText('Anchor');
  });

  test('renders heading and subtitle', async () => {
    await expect(page.locator('.login-title')).toHaveText('Sign in to your workspace');
    await expect(page.locator('.login-sub')).toContainText('credentials');
  });

  test('renders email and password inputs', async () => {
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('renders sign-in button', async () => {
    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Sign in');
  });

  test('login card has dark background (design system applied)', async () => {
    const bg = await page.locator('.login-card').evaluate(el =>
      getComputedStyle(el).backgroundColor
    );
    // --panel = #151926
    expect(bg).toBe('rgb(21, 25, 38)');
  });

  test('page background uses the dark gradient', async () => {
    const bg = await page.locator('.login-wrap').evaluate(el =>
      getComputedStyle(el).background
    );
    expect(bg).toContain('radial-gradient');
  });

  // ── Validation ───────────────────────────────────────────────────────────

  test('submit with empty fields does nothing', async () => {
    await page.locator('button[type="submit"]').click();
    // Should stay on login, no error shown (guard bails before Supabase call)
    await expect(page.locator('.error')).not.toBeVisible();
    await expect(page).toHaveURL(/\/#\/login/);
  });

  // ── Auth flow ────────────────────────────────────────────────────────────

  test('wrong credentials shows inline error', async () => {
    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    await page.locator('button[type="submit"]').click();

    const error = page.locator('.error');
    await expect(error).toBeVisible({ timeout: 10_000 });
    await expect(error).not.toBeEmpty();
  });

  test('button shows "Signing in…" while request is in flight', async () => {
    await page.locator('input[name="email"]').fill('any@example.com');
    await page.locator('input[name="password"]').fill('anypassword');
    const click = page.locator('button[type="submit"]').click();
    await expect(page.locator('button[type="submit"]')).toContainText('Signing in', { timeout: 3_000 });
    await click;
  });

  test('correct credentials navigate to /app', async () => {
    test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD to run this test');
    await page.locator('input[name="email"]').fill(TEST_EMAIL);
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/#\/app/, { timeout: 30_000 });
    expect(page.url()).toContain('#/app');
    // After this test the page is at /#/app. The next beforeEach will reload it —
    // since persistSession:false the session is cleared and auth guard redirects
    // back to /#/login, so subsequent tests remain unauthenticated.
  });

  // ── Redirect guard ───────────────────────────────────────────────────────

  test('visiting / redirects to /login when not authenticated', async () => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/#\/login/);
  });

  test('visiting /app directly redirects to /login when not authenticated', async () => {
    await page.goto('/#/app/bundles');
    await expect(page).toHaveURL(/\/#\/login/);
  });
});

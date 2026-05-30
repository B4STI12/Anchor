/**
 * Phase 1 — Login screen
 * Tests the unauthenticated login page: layout, validation, error handling, auth flow.
 */
import { test, expect } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD, hasTestCredentials } from './helpers/auth';

test.describe('Phase 1 · Login page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/#/login');
  });

  // ── Layout ──────────────────────────────────────────────────────────────

  test('renders Anchor logo and name', async ({ page }) => {
    await expect(page.locator('.logo-icon svg')).toBeVisible();
    await expect(page.locator('.logo-name')).toHaveText('Anchor');
  });

  test('renders heading and subtitle', async ({ page }) => {
    await expect(page.locator('.login-title')).toHaveText('Sign in to your workspace');
    await expect(page.locator('.login-sub')).toContainText('credentials');
  });

  test('renders email and password inputs', async ({ page }) => {
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('renders sign-in button', async ({ page }) => {
    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Sign in');
  });

  test('login card has dark background (design system applied)', async ({ page }) => {
    const bg = await page.locator('.login-card').evaluate(el =>
      getComputedStyle(el).backgroundColor
    );
    // --panel = #151926
    expect(bg).toBe('rgb(21, 25, 38)');
  });

  test('page background uses the dark gradient', async ({ page }) => {
    const bg = await page.locator('.login-wrap').evaluate(el =>
      getComputedStyle(el).background
    );
    expect(bg).toContain('radial-gradient');
  });

  // ── Validation ───────────────────────────────────────────────────────────

  test('submit with empty fields does nothing', async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    // Should stay on login, no error shown (guard bails before Supabase call)
    await expect(page.locator('.error')).not.toBeVisible();
    await expect(page).toHaveURL(/\/#\/login/);
  });

  // ── Auth flow ────────────────────────────────────────────────────────────

  test('wrong credentials shows inline error', async ({ page }) => {
    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    await page.locator('button[type="submit"]').click();

    const error = page.locator('.error');
    await expect(error).toBeVisible({ timeout: 10_000 });
    // Supabase returns a message; just check something is shown
    await expect(error).not.toBeEmpty();
  });

  test('button shows "Signing in…" while request is in flight', async ({ page }) => {
    await page.locator('input[name="email"]').fill('any@example.com');
    await page.locator('input[name="password"]').fill('anypassword');
    // Don't await — check the loading state immediately
    const click = page.locator('button[type="submit"]').click();
    await expect(page.locator('button[type="submit"]')).toContainText('Signing in', { timeout: 3_000 });
    await click;
  });

  test('correct credentials navigate to /app', async ({ page }) => {
    test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD to run this test');
    await page.locator('input[name="email"]').fill(TEST_EMAIL);
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/#\/app/, { timeout: 12_000 });
    expect(page.url()).toContain('#/app');
  });

  // ── Redirect guard ───────────────────────────────────────────────────────

  test('visiting / redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/#\/login/);
  });

  test('visiting /app directly redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/#/app/bundles');
    await expect(page).toHaveURL(/\/#\/login/);
  });

});

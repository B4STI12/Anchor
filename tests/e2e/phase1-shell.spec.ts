/**
 * Phase 1 — Shell layout (titlebar + sidebar)
 * Requires valid TEST_EMAIL + TEST_PASSWORD to get past the auth guard.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, hasTestCredentials } from './helpers/auth';

test.describe('Phase 1 · Shell layout', () => {

  test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD to run shell tests');

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsTestUser(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Titlebar ─────────────────────────────────────────────────────────────

  test('titlebar renders three traffic-light buttons', async () => {
    await expect(page.locator('.tl.red')).toBeVisible();
    await expect(page.locator('.tl.yellow')).toBeVisible();
    await expect(page.locator('.tl.green')).toBeVisible();
  });

  test('titlebar shows app name "Anchor"', async () => {
    await expect(page.locator('.app-name')).toHaveText('Anchor');
  });

  test('titlebar shows screen breadcrumb', async () => {
    await expect(page.locator('.breadcrumb')).toBeVisible();
    // Default screen is bundles → "Bundles"
    await expect(page.locator('.breadcrumb')).toHaveText('Bundles');
  });

  test('titlebar search button is visible and contains ⌘K hint', async () => {
    const btn = page.locator('.search-bar');
    await expect(btn).toBeVisible();
    await expect(btn.locator('.kbd')).toContainText('⌘K');
  });

  test('titlebar shows active profile indicator', async () => {
    await expect(page.locator('.profile-indicator .profile-name')).toBeVisible();
    await expect(page.locator('.profile-indicator .profile-dot-sm')).toBeVisible();
  });

  // ── Sidebar structure ────────────────────────────────────────────────────

  test('sidebar is present with rail background', async () => {
    const sidebar = page.locator('app-sidebar .sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('sidebar profile button shows initial of active profile', async () => {
    await expect(page.locator('.profile-btn')).toBeVisible();
  });

  test('sidebar has Bundles nav button', async () => {
    await expect(page.locator('button[title="Bundles"]')).toBeVisible();
  });

  test('sidebar has Notes nav button', async () => {
    await expect(page.locator('button[title="Notes"]')).toBeVisible();
  });

  test('sidebar has Snippets nav button', async () => {
    await expect(page.locator('button[title="Snippets"]')).toBeVisible();
  });

  test('sidebar has Calculator nav button', async () => {
    await expect(page.locator('button[title="Calculator"]')).toBeVisible();
  });

  test('sidebar Email button is disabled (coming soon)', async () => {
    const btn = page.locator('button[title="Email"]');
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveClass(/disabled/);
  });

  test('sidebar Email Triad button is disabled (coming soon)', async () => {
    const btn = page.locator('button[title="Email Triad"]');
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveClass(/disabled/);
  });

  test('sidebar Settings button is present', async () => {
    await expect(page.locator('button[title="Settings"]')).toBeVisible();
  });

  // ── Design system ────────────────────────────────────────────────────────

  test('sidebar uses --rail background color', async () => {
    const bg = await page.locator('app-sidebar .sidebar').evaluate(el =>
      getComputedStyle(el).backgroundColor
    );
    // --rail = #0b0e15
    expect(bg).toBe('rgb(11, 14, 21)');
  });

  test('--accent CSS variable is applied (#2563eb)', async () => {
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    );
    expect(accent).toBe('#2563eb');
  });

  test('Inter font is loaded', async () => {
    const font = await page.locator('.app-name').evaluate(el =>
      getComputedStyle(el).fontFamily
    );
    expect(font.toLowerCase()).toContain('inter');
  });

});

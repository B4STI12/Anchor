/**
 * Phase 5 — Settings screen (complete version)
 * The Phase 1 stub covers basic rendering; this file tests full settings features.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, hasTestCredentials } from './helpers/auth';

const PHASE5_IMPLEMENTED = false;

test.describe('Phase 5 · Settings (full)', () => {

  test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD');

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsTestUser(page);
    await page.locator('button[title="Settings"]').click();
    await page.waitForTimeout(300);
  });

  test.afterAll(async () => page.close());

  // ── Phase 1 stub (always runs) ────────────────────────────────────────────

  test('settings page renders heading', async () => {
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
  });

  test('settings page has sign-out button', async () => {
    await expect(page.locator('button.btn-danger')).toBeVisible();
  });

  // ── Phase 5: full settings ────────────────────────────────────────────────

  test('Password section has current + new + confirm inputs', async () => {
    test.fixme(!PHASE5_IMPLEMENTED);
    await expect(page.locator('[placeholder*="Current password"]')).toBeVisible();
    await expect(page.locator('[placeholder*="New password"]')).toBeVisible();
    await expect(page.locator('[placeholder*="Confirm"]')).toBeVisible();
  });

  test('Profiles section lists all profiles with color dots', async () => {
    test.fixme(!PHASE5_IMPLEMENTED);
    await expect(page.locator('.settings-profile-row')).toHaveCount({ minimum: 2 });
  });

  test('DeepL API key section has masked input and Test button', async () => {
    test.fixme(!PHASE5_IMPLEMENTED);
    await expect(page.locator('[type="password"][placeholder*="DeepL"]')).toBeVisible();
    await expect(page.locator('button:has-text("Test")')).toBeVisible();
  });

  test('Export button downloads anchor-export JSON', async () => {
    test.fixme(!PHASE5_IMPLEMENTED);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("Export all data")').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/anchor-export.*\.json/);
  });

  test('Supabase connection indicator is green (connected)', async () => {
    test.fixme(!PHASE5_IMPLEMENTED);
    await expect(page.locator('.supabase-status.connected')).toBeVisible();
  });

  test('App lock timeout dropdown shows Never, 5 min, 15 min, 30 min, 1 hour', async () => {
    test.fixme(!PHASE5_IMPLEMENTED);
    const options = page.locator('.lock-timeout-select option');
    await expect(options).toContainText(['Never', '5 min', '15 min', '30 min', '1 hour']);
  });

  test('keyboard shortcuts cheat-sheet is rendered', async () => {
    test.fixme(!PHASE5_IMPLEMENTED);
    await expect(page.locator('.shortcuts-table')).toBeVisible();
    await expect(page.locator('.shortcuts-table')).toContainText('⌘K');
  });

});

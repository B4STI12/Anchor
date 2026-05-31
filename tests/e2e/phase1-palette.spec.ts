/**
 * Phase 1 — Command palette (⌘K / Ctrl+K stub).
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, hasTestCredentials } from './helpers/auth';

test.describe('Phase 1 · Command palette', () => {

  test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD to run palette tests');

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
    page = await browser.newPage();
    await loginAsTestUser(page);
  });

  test.afterAll(async () => page.close());

  async function openPalette() {
    await page.keyboard.press('Control+k');
    await expect(page.locator('.palette-modal')).toBeVisible();
  }

  // ── Open / close ──────────────────────────────────────────────────────────

  test('Ctrl+K opens the command palette', async () => {
    await openPalette();
  });

  test('palette has a search input', async () => {
    await openPalette();
    await expect(page.locator('.palette-input')).toBeVisible();
  });

  test('palette shows search icon', async () => {
    await openPalette();
    await expect(page.locator('.palette-search-row svg')).toBeVisible();
  });

  test('palette shows Esc hint', async () => {
    await openPalette();
    await expect(page.locator('.palette-kbd')).toContainText('Esc');
  });

  test('Escape closes the command palette', async () => {
    await openPalette();
    await page.keyboard.press('Escape');
    await expect(page.locator('.palette-modal')).not.toBeVisible();
  });

  test('clicking the backdrop closes the palette', async () => {
    await openPalette();
    await page.locator('.palette-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('.palette-modal')).not.toBeVisible();
  });

  test('clicking inside the modal does not close it', async () => {
    await openPalette();
    await page.locator('.palette-modal').click();
    await expect(page.locator('.palette-modal')).toBeVisible();
  });

  test('clicking titlebar search bar also opens palette', async () => {
    // Close first if open
    if (await page.locator('.palette-modal').isVisible()) {
      await page.keyboard.press('Escape');
    }
    await page.locator('.search-bar').click();
    await expect(page.locator('.palette-modal')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('Ctrl+K toggles the palette closed when already open', async () => {
    await openPalette();
    await page.keyboard.press('Control+k');
    await expect(page.locator('.palette-modal')).not.toBeVisible();
  });

});

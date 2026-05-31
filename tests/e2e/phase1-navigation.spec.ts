/**
 * Phase 1 — Navigation: sidebar clicks, keyboard shortcuts, breadcrumb updates.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, hasTestCredentials } from './helpers/auth';

test.describe('Phase 1 · Navigation', () => {

  test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD to run navigation tests');

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);
    page = await browser.newPage();
    await loginAsTestUser(page);
  });

  test.afterAll(async () => page.close());

  async function clickNav(title: string) {
    await page.locator(`button[title="${title}"]`).click();
    await page.waitForTimeout(200);
  }

  // ── Sidebar click navigation ──────────────────────────────────────────────

  test('clicking Notes navigates to /app/notes', async () => {
    await clickNav('Notes');
    expect(page.url()).toContain('#/app/notes');
    await expect(page.locator('.breadcrumb')).toHaveText('Notes');
  });

  test('clicking Snippets navigates to /app/snippets', async () => {
    await clickNav('Snippets');
    expect(page.url()).toContain('#/app/snippets');
    await expect(page.locator('.breadcrumb')).toHaveText('Snippets');
  });

  test('clicking Settings navigates to /app/settings', async () => {
    await clickNav('Settings');
    expect(page.url()).toContain('#/app/settings');
    await expect(page.locator('.breadcrumb')).toHaveText('Settings');
  });

  test('clicking Bundles navigates back to /app/bundles', async () => {
    await clickNav('Bundles');
    expect(page.url()).toContain('#/app/bundles');
    await expect(page.locator('.breadcrumb')).toHaveText('Bundles');
  });

  test('active nav button has .active class', async () => {
    await clickNav('Notes');
    const notesBtn = page.locator('button[title="Notes"]');
    await expect(notesBtn).toHaveClass(/active/);
    // Bundles should NOT be active
    const bundlesBtn = page.locator('button[title="Bundles"]');
    await expect(bundlesBtn).not.toHaveClass(/active/);
  });

  test('breadcrumb updates on every screen switch', async () => {
    const checks: Array<[string, string]> = [
      ['Bundles',  'Bundles'],
      ['Notes',    'Notes'],
      ['Snippets', 'Snippets'],
      ['Settings', 'Settings'],
    ];
    for (const [title, label] of checks) {
      await clickNav(title);
      await expect(page.locator('.breadcrumb')).toHaveText(label);
    }
  });

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  test('Ctrl+1 navigates to Bundles', async () => {
    await clickNav('Settings'); // start elsewhere
    await page.keyboard.press('Control+1');
    await page.waitForTimeout(200);
    expect(page.url()).toContain('#/app/bundles');
  });

  test('Ctrl+2 navigates to Notes', async () => {
    await page.keyboard.press('Control+2');
    await page.waitForTimeout(200);
    expect(page.url()).toContain('#/app/notes');
  });

  test('Ctrl+3 navigates to Snippets', async () => {
    await page.keyboard.press('Control+3');
    await page.waitForTimeout(200);
    expect(page.url()).toContain('#/app/snippets');
  });

  test('Ctrl+, navigates to Settings', async () => {
    await page.keyboard.press('Control+,');
    await page.waitForTimeout(200);
    expect(page.url()).toContain('#/app/settings');
  });

  // ── Tooltips ─────────────────────────────────────────────────────────────

  test('hovering a nav button shows tooltip', async () => {
    await clickNav('Bundles'); // reset
    await page.locator('button[title="Notes"]').hover();
    // Tooltip is rendered in .tooltip via CSS display:block on hover — check content
    const tooltip = page.locator('.nav-item-wrap:has(button[title="Notes"]) .tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Notes');
  });

  test('disabled nav items show "coming soon" badge in tooltip', async () => {
    await page.locator('button[title="Email"]').hover();
    const tooltip = page.locator('.nav-item-wrap:has(button[title="Email"]) .tooltip');
    await expect(tooltip).toContainText('coming soon');
  });

});

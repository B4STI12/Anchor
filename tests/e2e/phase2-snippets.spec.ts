/**
 * Phase 2 — Snippets module
 * Remove test.fixme() calls as each feature ships.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, hasTestCredentials } from './helpers/auth';

const PHASE2_IMPLEMENTED = true;

test.describe('Phase 2 · Snippets', () => {

  test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD');

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90_000);
    page = await browser.newPage();
    await loginAsTestUser(page);
    await page.locator('button[title="Snippets"]').click();
    // Wait for Snippets screen to be fully ready before seeding
    await page.locator('button:has-text("New Snippet")').waitFor({ state: 'visible', timeout: 15_000 });

    // Seed: create an address snippet so address-card tests have data
    await page.locator('button:has-text("New Snippet")').click();
    await page.locator('.modal [placeholder*="label"]').fill('Seed Address');
    await page.locator('.modal [placeholder="Value"]').first().fill('Test Name');
    await page.locator('.modal button:has-text("Save")').click();
    await expect(page.locator('.modal')).toBeHidden();

    // Seed: create a custom snippet so custom-card tests have data
    await page.locator('button:has-text("New Snippet")').click();
    await page.locator('.modal button[value="custom"]').click();
    await page.locator('.modal [placeholder*="label"]').fill('Seed Custom');
    await page.locator('.modal [placeholder*="content"]').fill('seed-token-12345');
    await page.locator('.modal button:has-text("Save")').click();
    await expect(page.locator('.modal')).toBeHidden();
  });

  test.afterAll(async () => page.close());

  // ── Layout ────────────────────────────────────────────────────────────────

  test('header shows "Snippets" title and count', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await expect(page.locator('h1:has-text("Snippets")')).toBeVisible();
    await expect(page.locator('.snippets-count')).toBeVisible();
  });

  test('header has search input', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await expect(page.locator('[placeholder*="Search snippets"]')).toBeVisible();
  });

  test('header has "New Snippet" button', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await expect(page.locator('button:has-text("New Snippet")')).toBeVisible();
  });

  test('Addresses section is present with section label', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await expect(page.locator('.section-label:has-text("Addresses")')).toBeVisible();
  });

  test('Custom Fields section is present', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await expect(page.locator('.section-label:has-text("Custom")')).toBeVisible();
  });

  // ── Address card ──────────────────────────────────────────────────────────

  test('address card shows label and "N uses" subtitle', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    const card = page.locator('.snippet-card[data-type="address"]').first();
    await expect(card.locator('.snippet-label')).not.toBeEmpty();
    await expect(card.locator('.snippet-uses')).toContainText('uses');
  });

  test('address card shows per-field rows (Name, Street, City)', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    const card = page.locator('.snippet-card[data-type="address"]').first();
    const count = await card.locator('.field-row').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('clicking a field row copies its value and shows checkmark', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    const row = page.locator('.snippet-card[data-type="address"] .field-row').first();
    await row.click();
    await expect(row.locator('.copy-icon svg')).toBeVisible();
  });

  test('Copy All button on address card triggers clipboard + shows checkmark', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    const card = page.locator('.snippet-card[data-type="address"]').first();
    await card.locator('.copy-all-btn').click();
    await expect(card.locator('.copy-all-btn')).toContainText('Copied');
  });

  // ── Custom card ───────────────────────────────────────────────────────────

  test('custom card shows label and monospace content block', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    const card = page.locator('.snippet-card[data-type="custom"]').first();
    await expect(card.locator('.snippet-label')).not.toBeEmpty();
    await expect(card.locator('.snippet-content')).toBeVisible();
  });

  test('custom card copy button shows "Copied" after click', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    const card = page.locator('.snippet-card[data-type="custom"]').first();
    await card.locator('.copy-btn').click();
    await expect(card.locator('.copy-btn')).toContainText('Copied');
  });

  // ── Usage counter ─────────────────────────────────────────────────────────

  test('copying a snippet increments its uses counter', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    const card = page.locator('.snippet-card').first();
    const beforeText = await card.locator('.snippet-uses').textContent() ?? '0 uses';
    const before = parseInt(beforeText.split(' ')[0], 10);
    await card.locator('.copy-btn, .copy-all-btn').first().click();
    // Wait for the counter to update rather than using a fixed timeout
    await expect(card.locator('.snippet-uses')).toContainText(`${before + 1} use`, { timeout: 5_000 });
  });

  // ── Search ────────────────────────────────────────────────────────────────

  test('search filters cards by label', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    const total = await page.locator('.snippet-card').count();
    await page.locator('[placeholder*="Search snippets"]').fill('zzz_no_match_xyz');
    await page.waitForTimeout(200);
    await expect(page.locator('.snippet-card')).toHaveCount(0);
    await page.locator('[placeholder*="Search snippets"]').clear();
    await page.waitForTimeout(200);
    await expect(page.locator('.snippet-card')).toHaveCount(total);
  });

  // ── New snippet modal ─────────────────────────────────────────────────────

  test('New Snippet button opens a modal', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await page.locator('button:has-text("New Snippet")').click();
    await expect(page.locator('.modal')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('modal lets you choose Address or Custom type', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await page.locator('button:has-text("New Snippet")').click();
    await expect(page.locator('.modal button[value="address"]')).toBeVisible();
    await expect(page.locator('.modal button[value="custom"]')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('creating a custom snippet adds it to the grid', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    const label = `Test token ${Date.now()}`;
    await page.locator('button:has-text("New Snippet")').click();
    await page.locator('.modal [value="custom"]').click();
    await page.locator('.modal [placeholder*="label"]').fill(label);
    await page.locator('.modal [placeholder*="content"]').fill('abc123');
    await page.locator('.modal button:has-text("Save")').click();
    // Wait for the new card to appear by its unique label
    await expect(page.locator(`.snippet-card:has-text("${label}")`)).toBeVisible({ timeout: 8_000 });
  });

});

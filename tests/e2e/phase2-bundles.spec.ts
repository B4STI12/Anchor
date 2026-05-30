/**
 * Phase 2 — Bundles module
 *
 * Tests are written against the final expected UI. They run as-is once
 * Phase 2 is implemented. Until then each test is marked fixme so the
 * suite stays green and the failures are clearly labelled.
 *
 * Remove individual test.fixme() calls as each feature ships.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, hasTestCredentials } from './helpers/auth';

const PHASE2_IMPLEMENTED = true;

test.describe('Phase 2 · Bundles', () => {

  test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD');

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsTestUser(page);
    await page.locator('button[title="Bundles"]').click();
    await page.waitForTimeout(300);
  });

  test.afterAll(async () => page.close());

  // ── Layout ────────────────────────────────────────────────────────────────

  test('shows left bundle-list panel', async () => {
    test.fixme(!PHASE2_IMPLEMENTED, 'Phase 2 not yet implemented');
    await expect(page.locator('.bundle-list')).toBeVisible();
  });

  test('bundle-list panel has "Bundles" heading and + button', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await expect(page.locator('.bundle-list-header')).toContainText('Bundles');
    await expect(page.locator('[title="New bundle"]')).toBeVisible();
  });

  test('main area shows bundle name, link count, Open All and + buttons', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await expect(page.locator('.bundle-main-header')).toBeVisible();
    await expect(page.locator('button:has-text("Open All")')).toBeVisible();
    await expect(page.locator('[title="Add link"]')).toBeVisible();
  });

  test('link cards render in an auto-fill grid', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await expect(page.locator('.link-card').first()).toBeVisible();
  });

  test('link card shows favicon, label, and URL', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    const card = page.locator('.link-card').first();
    await expect(card.locator('.link-favicon')).toBeVisible();
    await expect(card.locator('.link-label')).not.toBeEmpty();
    await expect(card.locator('.link-url')).not.toBeEmpty();
  });

  // ── Bundle CRUD ───────────────────────────────────────────────────────────

  test('clicking + creates a new bundle and selects it', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    const before = await page.locator('.bundle-list-item').count();
    await page.locator('[title="New bundle"]').click();
    // Expect modal or inline input
    await page.locator('[placeholder*="bundle name"]').fill('Test Bundle');
    await page.keyboard.press('Enter');
    await expect(page.locator('.bundle-list-item')).toHaveCount(before + 1);
    await expect(page.locator('.bundle-main-header')).toContainText('Test Bundle');
  });

  test('right-clicking a bundle shows Edit and Delete options', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await page.locator('.bundle-list-item').first().click({ button: 'right' });
    await expect(page.locator('.context-menu')).toBeVisible();
    await expect(page.locator('.context-menu')).toContainText('Edit');
    await expect(page.locator('.context-menu')).toContainText('Delete');
    await page.keyboard.press('Escape');
  });

  // ── Link CRUD ─────────────────────────────────────────────────────────────

  test('clicking + add link opens a form for URL + label', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await page.locator('[title="Add link"]').click();
    await expect(page.locator('[placeholder*="https://"]')).toBeVisible();
    await expect(page.locator('[placeholder*="label"]')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('adding a link appends a card to the grid', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    const before = await page.locator('.link-card').count();
    await page.locator('[title="Add link"]').click();
    await page.locator('[placeholder*="https://"]').fill('https://example.com');
    await page.locator('[placeholder*="label"]').fill('Example');
    await page.locator('button:has-text("Add")').click();
    await expect(page.locator('.link-card')).toHaveCount(before + 1);
  });

  test('right-clicking a link card shows Edit and Delete', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await page.locator('.link-card').first().click({ button: 'right' });
    await expect(page.locator('.context-menu')).toContainText('Edit');
    await expect(page.locator('.context-menu')).toContainText('Delete');
    await page.keyboard.press('Escape');
  });

  test('drag handle appears on card hover', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await page.locator('.link-card').first().hover();
    await expect(page.locator('.link-card .drag-handle').first()).toBeVisible();
  });

  // ── Reachability dot ──────────────────────────────────────────────────────

  test('each link card has a reachability dot (green or red)', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await expect(page.locator('.link-card .reach-dot').first()).toBeVisible();
  });

  // ── Favicon ───────────────────────────────────────────────────────────────

  test('favicon is fetched via Google S2 service', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    const src = await page.locator('.link-favicon img').first().getAttribute('src');
    expect(src).toContain('google.com/s2/favicons');
  });

  // ── Open All ──────────────────────────────────────────────────────────────

  test('Open All navigates to embedded browser', async () => {
    test.fixme(!PHASE2_IMPLEMENTED);
    await page.locator('button:has-text("Open All")').click();
    await expect(page.locator('.webview-toolbar')).toBeVisible();
  });

  // ── Embedded browser ──────────────────────────────────────────────────────

  test.describe('Embedded browser', () => {

    test.beforeEach(async () => {
      // Open first link to enter browser view
      test.fixme(!PHASE2_IMPLEMENTED);
      await page.locator('.link-card').first().click();
    });

    test('toolbar shows back, forward, reload, URL bar, copy, external buttons', async () => {
      test.fixme(!PHASE2_IMPLEMENTED);
      await expect(page.locator('[title="Back"]')).toBeVisible();
      await expect(page.locator('[title="Forward"]')).toBeVisible();
      await expect(page.locator('[title="Reload"]')).toBeVisible();
      await expect(page.locator('.url-bar')).toBeVisible();
      await expect(page.locator('[title="Copy URL"]')).toBeVisible();
      await expect(page.locator('[title="Open in external browser"]')).toBeVisible();
    });

    test('URL bar shows the current URL', async () => {
      test.fixme(!PHASE2_IMPLEMENTED);
      await expect(page.locator('.url-bar')).not.toBeEmpty();
    });

    test('loading bar animation is present', async () => {
      test.fixme(!PHASE2_IMPLEMENTED);
      await expect(page.locator('.an-webloader')).toBeVisible();
    });

    test('Escape returns to Bundles screen', async () => {
      test.fixme(!PHASE2_IMPLEMENTED);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      expect(page.url()).toContain('#/app/bundles');
    });

    test('copy URL button shows toast', async () => {
      test.fixme(!PHASE2_IMPLEMENTED);
      await page.locator('[title="Copy URL"]').click();
      await expect(page.locator('.toast')).toContainText('copied', { timeout: 3_000 });
    });

  });

});

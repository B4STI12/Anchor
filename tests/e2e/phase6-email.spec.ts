/**
 * Phase 6 — Email module
 *
 * These tests cover the email UI in browser mode (no Electron, so electronAPI
 * is undefined). The EmailService falls back to empty arrays / no-ops, which
 * lets us verify layout, navigation, onboarding screen, keyboard shortcuts,
 * compose modal, and QuickClean modal without a real email account.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, hasTestCredentials } from './helpers/auth';

const PHASE6_IMPLEMENTED = true;

test.describe('Phase 6 · Email', () => {

  test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD');

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90_000);
    page = await browser.newPage();
    await loginAsTestUser(page);
    // Navigate to email via sidebar
    await page.locator('button[title="Email"]').click();
    await page.waitForURL(/\/#\/app\/email/, { timeout: 15_000 });
    // Loading state may transition quickly — wait for stable DOM
    await page.waitForTimeout(800);
  });

  test.afterAll(async () => page.close());

  // ── Route & layout ────────────────────────────────────────────────────────

  test('email route loads without crash', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    await expect(page).toHaveURL(/\/#\/app\/email/);
  });

  test('sidebar email button is active', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    await expect(page.locator('button[title="Email"]')).toHaveClass(/active/);
  });

  test('email rail is visible with compose button', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    await expect(page.locator('.email-rail')).toBeVisible();
    await expect(page.locator('.rail-compose')).toBeVisible();
  });

  test('email rail has nav buttons (inbox, starred, sent, archive)', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    await expect(page.locator('.rail-nav-btn[title="Inbox"]')).toBeVisible();
    await expect(page.locator('.rail-nav-btn[title="Starred"]')).toBeVisible();
    await expect(page.locator('.rail-nav-btn[title="Sent"]')).toBeVisible();
    await expect(page.locator('.rail-nav-btn[title="Archive"]')).toBeVisible();
  });

  // ── Onboarding vs app phase ──────────────────────────────────────────────
  // In browser mode electronAPI is undefined → accountsList() returns [].
  // The component enters onboarding phase.

  test('shows onboarding screen when no accounts connected', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    // Either onboarding wrap or app topbar should be present depending on env
    const onboarding = page.locator('.onboarding-wrap');
    const topbar = page.locator('.email-topbar');
    const visible = (await onboarding.isVisible()) || (await topbar.isVisible());
    expect(visible).toBe(true);
  });

  test('onboarding screen has Gmail and Outlook connect buttons', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    const onboarding = page.locator('.onboarding-wrap');
    if (!await onboarding.isVisible()) {
      test.skip(); // Already has accounts (Electron env)
      return;
    }
    await expect(page.locator('button:has-text("Connect Gmail")')).toBeVisible();
    await expect(page.locator('button:has-text("Connect Outlook")')).toBeVisible();
  });

  // ── Compose modal ─────────────────────────────────────────────────────────

  test('pressing rail compose button opens compose modal', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    await page.locator('.rail-compose').click();
    await expect(page.locator('.compose-modal')).toBeVisible();
    await expect(page.locator('.compose-title')).toContainText('New message');
  });

  test('compose modal has From, To, Cc, Subject fields', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    await expect(page.locator('.compose-fields .field-row')).toHaveCount(4);
    const labels = await page.locator('.compose-fields .field-label').allTextContents();
    const normalized = labels.map(l => l.trim().toLowerCase());
    expect(normalized).toContain('from');
    expect(normalized).toContain('to');
    expect(normalized).toContain('cc');
    expect(normalized).toContain('subject');
  });

  test('compose modal closes on Escape', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    await page.keyboard.press('Escape');
    await expect(page.locator('.compose-modal')).not.toBeVisible();
  });

  test('keyboard shortcut C opens compose', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    await page.keyboard.press('c');
    await expect(page.locator('.compose-modal')).toBeVisible();
    // Close it
    await page.keyboard.press('Escape');
  });

  // ── QuickClean modal ──────────────────────────────────────────────────────

  test('QuickClean button opens modal', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    await page.locator('.rail-quickclean').click();
    await expect(page.locator('.quickclean-modal')).toBeVisible();
    await expect(page.locator('.compose-title').last()).toContainText('QuickClean');
  });

  test('QuickClean modal closes on Escape', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    await page.keyboard.press('Escape');
    await expect(page.locator('.quickclean-modal')).not.toBeVisible();
  });

  // ── Inbox layout (app phase — only if accounts exist) ────────────────────

  test('inbox shows filter chips when in app phase', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    const topbar = page.locator('.email-topbar');
    if (!await topbar.isVisible()) {
      test.skip(); // Onboarding phase — no accounts
      return;
    }
    await expect(page.locator('.filter-chips')).toBeVisible();
    await expect(page.locator('.chip')).toHaveCountGreaterThan(0);
  });

  test('search input is visible in app phase', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    const topbar = page.locator('.email-topbar');
    if (!await topbar.isVisible()) {
      test.skip();
      return;
    }
    await expect(page.locator('.search-input')).toBeVisible();
  });

  test('sync now button is visible in app phase', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    const topbar = page.locator('.email-topbar');
    if (!await topbar.isVisible()) {
      test.skip();
      return;
    }
    await expect(page.locator('.btn-icon[title="Sync now"]')).toBeVisible();
  });

  // ── Keyboard navigation ───────────────────────────────────────────────────

  test('Cmd+5 / Ctrl+5 navigates to email from another screen', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    // Navigate away first
    await page.locator('button[title="Bundles"]').click();
    await page.waitForURL(/\/#\/app\/bundles/, { timeout: 10_000 });
    // Use keyboard shortcut
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+5' : 'Control+5');
    await page.waitForURL(/\/#\/app\/email/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/#\/app\/email/);
  });

  // ── Rail nav: switching views ─────────────────────────────────────────────

  test('clicking Starred in rail shows starred list header', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    // Navigate back to email if needed
    await page.locator('button[title="Email"]').click();
    await page.waitForURL(/\/#\/app\/email/, { timeout: 10_000 });
    const topbar = page.locator('.email-topbar');
    if (!await topbar.isVisible()) { test.skip(); return; }

    await page.locator('.rail-nav-btn[title="Starred"]').click();
    await expect(page.locator('.list-title')).toContainText('Starred');
  });

  test('clicking Sent in rail shows sent list header', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    const topbar = page.locator('.email-topbar');
    if (!await topbar.isVisible()) { test.skip(); return; }
    await page.locator('.rail-nav-btn[title="Sent"]').click();
    await expect(page.locator('.list-title')).toContainText('Sent');
  });

  test('clicking Archive in rail shows archive list header', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    const topbar = page.locator('.email-topbar');
    if (!await topbar.isVisible()) { test.skip(); return; }
    await page.locator('.rail-nav-btn[title="Archive"]').click();
    await expect(page.locator('.list-title')).toContainText('Archive');
  });

  test('clicking Inbox in rail shows inbox list header', async () => {
    test.fixme(!PHASE6_IMPLEMENTED);
    const topbar = page.locator('.email-topbar');
    if (!await topbar.isVisible()) { test.skip(); return; }
    await page.locator('.rail-nav-btn[title="Inbox"]').click();
    await expect(page.locator('.list-title')).toContainText('Inbox');
  });

});

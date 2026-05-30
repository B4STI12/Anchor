/**
 * Phase 1 — Profile switcher: dropdown, switching, toast notification.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, hasTestCredentials } from './helpers/auth';

test.describe('Phase 1 · Profile switcher', () => {

  test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD to run profile tests');

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsTestUser(page);
  });

  test.afterAll(async () => page.close());

  async function openDropdown() {
    await page.locator('.profile-btn').click();
    await expect(page.locator('.profile-dropdown')).toBeVisible();
  }

  // ── Dropdown ─────────────────────────────────────────────────────────────

  test('clicking profile button opens dropdown', async () => {
    await openDropdown();
  });

  test('dropdown has "Profiles" label', async () => {
    await openDropdown();
    await expect(page.locator('.dropdown-label')).toHaveText('Profiles');
  });

  test('dropdown lists Private and Work profiles', async () => {
    await openDropdown();
    const items = page.locator('.dropdown-item .item-name');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toHaveText('Private');
    await expect(items.nth(1)).toHaveText('Work');
  });

  test('active profile has checkmark', async () => {
    await openDropdown();
    // First profile (Private) is active by default → has SVG checkmark
    const activeRow = page.locator('.dropdown-item.active');
    await expect(activeRow).toBeVisible();
    await expect(activeRow.locator('svg')).toBeVisible();
  });

  test('dropdown has "Add Profile" button', async () => {
    await openDropdown();
    await expect(page.locator('.dropdown-item.muted')).toContainText('Add Profile');
  });

  test('clicking outside closes the dropdown', async () => {
    await openDropdown();
    await page.mouse.click(500, 400); // click the main content area
    await expect(page.locator('.profile-dropdown')).not.toBeVisible();
  });

  // ── Switching ─────────────────────────────────────────────────────────────

  test('switching to Work profile updates the titlebar indicator', async () => {
    await openDropdown();
    // Click "Work"
    await page.locator('.dropdown-item .item-name:text("Work")').click();
    await expect(page.locator('.profile-indicator .profile-name')).toHaveText('Work');
  });

  test('switching profile shows toast "Switched to Work profile"', async () => {
    // Switch back to Private first to reset state
    await openDropdown();
    await page.locator('.dropdown-item .item-name:text("Private")').click();
    await page.waitForTimeout(100);

    await openDropdown();
    await page.locator('.dropdown-item .item-name:text("Work")').click();
    await expect(page.locator('.toast')).toContainText('Switched to Work profile', { timeout: 3_000 });
  });

  test('toast disappears after ~2.2s', async () => {
    // Trigger a switch to ensure a toast is shown
    await openDropdown();
    await page.locator('.dropdown-item .item-name:text("Private")').click();
    await expect(page.locator('.toast')).toBeVisible({ timeout: 3_000 });
    await expect(page.locator('.toast')).not.toBeVisible({ timeout: 4_000 });
  });

  test('dropdown closes after switching profile', async () => {
    await openDropdown();
    await page.locator('.dropdown-item .item-name:text("Work")').click();
    await expect(page.locator('.profile-dropdown')).not.toBeVisible();
  });

  test('active profile colored dot is visible in sidebar button', async () => {
    await expect(page.locator('.profile-btn .profile-dot')).toBeVisible();
  });

});

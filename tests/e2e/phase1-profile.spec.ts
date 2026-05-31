/**
 * Phase 1 — Profile switcher: dropdown, switching, toast notification.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, hasTestCredentials, TEST_EMAIL, TEST_PASSWORD } from './helpers/auth';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lwpxbbeuijgqykkdtwtb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QK4eOFMdrApvZiW5P8xpYg_br_4XB8b';

test.describe('Phase 1 · Profile switcher', () => {

  test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD to run profile tests');

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000);

    // Seed: delete ALL profiles and recreate "Private" then "Work" in correct order
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await sb.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const { data: existing } = await sb.from('profiles').select('id').eq('user_id', user.id);
      const profileIds = (existing ?? []).map((p: any) => p.id);

      if (profileIds.length > 0) {
        // Cascade-delete dependent data in FK order before deleting profiles
        const { data: bundlesData } = await sb.from('bundles').select('id').in('profile_id', profileIds);
        const bundleIds = (bundlesData ?? []).map((b: any) => b.id);
        if (bundleIds.length > 0) await sb.from('links').delete().in('bundle_id', bundleIds);
        await sb.from('bundles').delete().in('profile_id', profileIds);
        await sb.from('snippets').delete().in('profile_id', profileIds);
        await sb.from('notes').delete().in('profile_id', profileIds);
        // Nullify self-referential parent_id before deleting folders
        await sb.from('folders').update({ parent_id: null }).in('profile_id', profileIds);
        await sb.from('folders').delete().in('profile_id', profileIds);
        await sb.from('profiles').delete().in('id', profileIds);
      }

      // Insert in order: Private first → Work second (ensures correct created_at order)
      await sb.from('profiles').insert({ user_id: user.id, name: 'Private', color: '#2563eb' });
      await new Promise(r => setTimeout(r, 100)); // small gap to guarantee created_at order
      await sb.from('profiles').insert({ user_id: user.id, name: 'Work', color: '#22c55e' });
    }
    await sb.auth.signOut();

    page = await browser.newPage();
    await loginAsTestUser(page);
  });

  test.afterAll(async () => page.close());

  async function openDropdown() {
    const dropdown = page.locator('.profile-dropdown');
    // If already open, close it first (button is a toggle — clicking again closes it)
    if (await dropdown.isVisible()) {
      await page.mouse.click(500, 400);
      await expect(dropdown).not.toBeVisible();
    }
    await page.locator('.profile-btn').click();
    await expect(dropdown).toBeVisible();
    // Wait for profile items to load from Supabase
    await page.locator('.profile-dropdown .dropdown-item').first().waitFor({ state: 'visible', timeout: 5_000 });
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
    // Switch back to Private first, then wait for that toast to clear
    await openDropdown();
    await page.locator('.dropdown-item .item-name:text("Private")').click();
    await expect(page.locator('.toast').first()).not.toBeVisible({ timeout: 4_000 });

    await openDropdown();
    await page.locator('.dropdown-item .item-name:text("Work")').click();
    await expect(page.locator('.toast').first()).toContainText('Switched to Work profile', { timeout: 3_000 });
  });

  test('toast disappears after ~2.2s', async () => {
    // Wait for any lingering toasts from the previous test to clear first
    await expect(page.locator('.toast').first()).not.toBeVisible({ timeout: 4_000 });

    await openDropdown();
    await page.locator('.dropdown-item .item-name:text("Private")').click();
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 3_000 });
    await expect(page.locator('.toast').first()).not.toBeVisible({ timeout: 4_000 });
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

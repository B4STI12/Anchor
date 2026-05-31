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

    // Seed: ensure exactly "Private" and "Work" profiles exist via Supabase SDK
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await sb.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const { data: existing } = await sb.from('profiles').select('*').eq('user_id', user.id).order('created_at');
      const profiles = existing ?? [];
      const hasPrivate = profiles.some((p: { name: string }) => p.name === 'Private');
      const hasWork    = profiles.some((p: { name: string }) => p.name === 'Work');
      // Delete profiles that are neither "Private" nor "Work"
      const toDelete = profiles.filter((p: { name: string }) => p.name !== 'Private' && p.name !== 'Work');
      for (const p of toDelete) {
        await sb.from('profiles').delete().eq('id', p.id);
      }
      if (!hasPrivate) {
        await sb.from('profiles').insert({ user_id: user.id, name: 'Private', color: '#2563eb' });
      }
      if (!hasWork) {
        await sb.from('profiles').insert({ user_id: user.id, name: 'Work', color: '#22c55e' });
      }
    }
    await sb.auth.signOut();

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

import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Phase 7 — New Features', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  // ── Task #5: Light theme toggle ──────────────────────────────────────────

  test.describe('Light theme', () => {
    test('settings shows Theme section with toggle', async ({ page }) => {
      await page.keyboard.press('Control+,');
      await expect(page.locator('text=Theme').first()).toBeVisible({ timeout: 8000 });
      await expect(page.locator('text=Light mode')).toBeVisible();
    });

    test('clicking theme toggle adds .light class to html', async ({ page }) => {
      await page.keyboard.press('Control+,');
      await page.waitForSelector('text=Light mode', { timeout: 8000 });
      const toggle = page.locator('label.toggle input[type="checkbox"]').last();
      const wasChecked = await toggle.isChecked();
      await toggle.click({ force: true });
      const isLight = await page.evaluate(() => document.documentElement.classList.contains('light'));
      expect(isLight).toBe(!wasChecked);
      // Restore
      await toggle.click({ force: true });
    });
  });

  // ── Task #6: Email settings in Settings ─────────────────────────────────

  test.describe('Email settings', () => {
    test('settings shows Email section with sync controls', async ({ page }) => {
      await page.keyboard.press('Control+,');
      await expect(page.locator('h2', { hasText: 'Email' }).first()).toBeVisible({ timeout: 8000 });
    });

    test('email section shows OAuth credentials inputs', async ({ page }) => {
      await page.keyboard.press('Control+,');
      await page.waitForSelector('text=OAuth Credentials', { timeout: 8000 });
      await expect(page.locator('text=Gmail Client ID')).toBeVisible();
      await expect(page.locator('text=Outlook Client ID')).toBeVisible();
    });

    test('email section shows Filter Rules area', async ({ page }) => {
      await page.keyboard.press('Control+,');
      await page.waitForSelector('text=Filter Rules', { timeout: 8000 });
      await expect(page.locator('text=Compose Templates')).toBeVisible();
    });
  });

  // ── Task #1 & #2: Note export + templates ────────────────────────────────

  test.describe('Notes export + templates', () => {
    test.beforeEach(async ({ page }) => {
      await page.keyboard.press('Control+2');
      await page.waitForSelector('.notes-root', { timeout: 10000 });
    });

    test('new-from-template dropdown button is visible in note list header', async ({ page }) => {
      await expect(page.locator('button.tmpl-btn')).toBeVisible({ timeout: 8000 });
    });

    test('clicking template dropdown shows template options', async ({ page }) => {
      await page.locator('button.tmpl-btn').click();
      await expect(page.locator('.template-menu')).toBeVisible();
      await expect(page.locator('.template-menu button', { hasText: 'Blank note' })).toBeVisible();
      await expect(page.locator('.template-menu button', { hasText: 'Meeting notes' })).toBeVisible();
      await expect(page.locator('.template-menu button', { hasText: 'Daily log' })).toBeVisible();
      await page.keyboard.press('Escape');
    });

    test('export buttons appear when a note is selected', async ({ page }) => {
      // Create or select a note
      await page.keyboard.press('Control+n');
      await page.waitForSelector('.export-btn', { timeout: 10000 });
      await expect(page.locator('.export-btn', { hasText: '.md' })).toBeVisible();
      await expect(page.locator('.export-btn', { hasText: '.pdf' })).toBeVisible();
    });

    test('meeting notes template populates editor with heading', async ({ page }) => {
      await page.locator('button.tmpl-btn').click();
      await page.locator('.template-menu button', { hasText: 'Meeting notes' }).click();
      await page.waitForSelector('.ProseMirror', { timeout: 10000 });
      const editorContent = await page.locator('.ProseMirror').textContent();
      expect(editorContent).toContain('Meeting Notes');
      expect(editorContent).toContain('Agenda');
    });

    test('daily log template populates editor with todays date heading', async ({ page }) => {
      await page.locator('button.tmpl-btn').click();
      await page.locator('.template-menu button', { hasText: 'Daily log' }).click();
      await page.waitForSelector('.ProseMirror', { timeout: 10000 });
      const editorContent = await page.locator('.ProseMirror').textContent();
      const year = new Date().getFullYear().toString();
      expect(editorContent).toContain(year);
    });
  });

  // ── Task #3 & #4: Bundles recently visited + zoom ─────────────────────────

  test.describe('Bundles webview enhancements', () => {
    test('zoom controls visible in webview toolbar (browser fallback mode)', async ({ page }) => {
      await page.keyboard.press('Control+1');
      await page.waitForSelector('.root', { timeout: 10000 });
      // We need at least one bundle with a link to enter webview
      // In browser mode the webview shows fallback — toolbar is still rendered
      // If no bundles exist, skip
      const hasBundle = await page.locator('.list-item').count() > 0;
      if (!hasBundle) {
        test.skip();
        return;
      }
      // Click first bundle to select it
      await page.locator('.list-item').first().click();
      // Click first link card if available
      const hasLink = await page.locator('.link-card').count() > 0;
      if (!hasLink) {
        test.skip();
        return;
      }
      await page.locator('.link-card').first().click();
      await page.waitForSelector('.webview-toolbar', { timeout: 8000 });
      await expect(page.locator('.zoom-label')).toBeVisible();
      await expect(page.locator('.zoom-btn').first()).toBeVisible();
    });
  });
});

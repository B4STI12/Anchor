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
      // The input is display:none — click the visible label element instead
      const toggleLabel = page.locator('label.toggle').last();
      const wasChecked = await toggleLabel.locator('input[type="checkbox"]').isChecked();
      await toggleLabel.click();
      // Wait for Angular's ngModelChange to apply the class to <html>
      await page.waitForFunction(
        (expected: boolean) => document.documentElement.classList.contains('light') === expected,
        !wasChecked,
        { timeout: 5000 }
      );
      const isLight = await page.evaluate(() => document.documentElement.classList.contains('light'));
      expect(isLight).toBe(!wasChecked);
      // Restore original state
      await toggleLabel.click();
      await page.waitForTimeout(300);
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
      // Wait for NoteService to finish loading (profile must be ready).
      // Without this, createNote() sees profileId='' and returns null early.
      await page.locator('.list-empty, .note-item').first()
        .waitFor({ state: 'visible', timeout: 20_000 });
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
      await expect(page.locator('.ProseMirror')).toContainText('Meeting Notes', { timeout: 12000 });
      await expect(page.locator('.ProseMirror')).toContainText('Agenda', { timeout: 8000 });
    });

    test('daily log template populates editor with todays date heading', async ({ page }) => {
      await page.locator('button.tmpl-btn').click();
      await page.locator('.template-menu button', { hasText: 'Daily log' }).click();
      const year = new Date().getFullYear().toString();
      await expect(page.locator('.ProseMirror')).toContainText(year, { timeout: 8000 });
    });
  });

  // ── Task #3 & #4: Bundles recently visited + zoom ─────────────────────────

  test.describe('Bundles webview enhancements', () => {
    test('zoom controls visible in webview toolbar (browser fallback mode)', async ({ page }) => {
      await page.keyboard.press('Control+1');
      await page.waitForSelector('.root', { timeout: 10000 });
      const hasBundle = await page.locator('.list-item').count() > 0;
      if (!hasBundle) { test.skip(); return; }
      await page.locator('.list-item').first().click();
      const hasLink = await page.locator('.link-card').count() > 0;
      if (!hasLink) { test.skip(); return; }
      await page.locator('.link-card').first().click();
      await page.waitForSelector('.webview-toolbar', { timeout: 8000 });
      await expect(page.locator('.zoom-label')).toBeVisible();
      await expect(page.locator('.zoom-btn').first()).toBeVisible();
    });
  });

  // ── Note tags ──────────────────────────────────────────────────────────────

  test.describe('Note tags', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to notes and ensure profile + data are loaded
      await page.keyboard.press('Control+2');
      await page.waitForSelector('.notes-root', { timeout: 10000 });
      await page.waitForTimeout(1500);
      // Select existing note or create one
      const hasNote = await page.locator('.note-item').count() > 0;
      if (hasNote) {
        await page.locator('.note-item').first().click();
      } else {
        await page.locator('button[title="New note"]').click();
      }
      await page.locator('.ProseMirror').waitFor({ state: 'visible', timeout: 10000 });
    });

    test('tags row renders below the note title', async ({ page }) => {
      await expect(page.locator('.tags-row')).toBeVisible();
    });

    test('tag input is present inside the tags row', async ({ page }) => {
      await expect(page.locator('.tag-input')).toBeVisible();
    });

    test('typing a tag and pressing Enter creates a chip', async ({ page }) => {
      const input = page.locator('.tag-input');
      await input.click();
      await input.type('playwright');
      await page.keyboard.press('Enter');
      await expect(page.locator('.tag-chip', { hasText: 'playwright' })).toBeVisible({ timeout: 5000 });
    });

    test('typing a tag and pressing comma creates a chip', async ({ page }) => {
      const input = page.locator('.tag-input');
      await input.click();
      await input.type('comma-tag');
      await page.keyboard.press(',');
      await expect(page.locator('.tag-chip', { hasText: 'comma-tag' })).toBeVisible({ timeout: 5000 });
    });

    test('clicking × on a tag chip removes it', async ({ page }) => {
      // Add a tag first
      const input = page.locator('.tag-input');
      await input.click();
      await input.type('removeme');
      await page.keyboard.press('Enter');
      await page.locator('.tag-chip', { hasText: 'removeme' }).waitFor({ timeout: 5000 });
      // Remove it
      await page.locator('.tag-chip', { hasText: 'removeme' }).locator('.tag-remove').click({ force: true });
      await expect(page.locator('.tag-chip', { hasText: 'removeme' })).toHaveCount(0, { timeout: 5000 });
    });

    test('note search filters by tag', async ({ page }) => {
      // Add a unique tag to the open note
      const uniqueTag = `tag-${Date.now()}`;
      const input = page.locator('.tag-input');
      await input.click();
      await input.type(uniqueTag);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      // Type the tag in the search box
      await page.locator('.search-input').fill(uniqueTag);
      await page.waitForTimeout(400);
      // At least one note should match
      await expect(page.locator('.note-item')).toHaveCount(1, { timeout: 5000 });
      // Clear search
      await page.locator('.search-input').fill('');
    });
  });

  // ── ? keyboard shortcut overlay ───────────────────────────────────────────

  test.describe('Keyboard shortcut overlay (?)', () => {
    test('pressing ? outside a text field shows the overlay', async ({ page }) => {
      // Click a non-input area (sidebar) so no input has focus
      await page.locator('app-sidebar').click({ force: true, position: { x: 10, y: 300 } });
      await page.waitForTimeout(100);
      await page.keyboard.press('?');
      await expect(page.locator('.shortcuts-overlay')).toBeVisible({ timeout: 5000 });
      await page.keyboard.press('Escape');
    });

    test('overlay lists all expected shortcuts', async ({ page }) => {
      await page.locator('app-sidebar').click({ force: true, position: { x: 10, y: 300 } });
      await page.keyboard.press('?');
      await page.locator('.shortcuts-overlay').waitFor({ timeout: 5000 });
      await expect(page.locator('.sc-table')).toContainText('Open command palette');
      await expect(page.locator('.sc-table')).toContainText('New note');
      await expect(page.locator('.sc-table')).toContainText('Toggle calculator');
      await expect(page.locator('.sc-table')).toContainText('Show this overlay');
      await page.keyboard.press('Escape');
    });

    test('pressing Escape closes the overlay', async ({ page }) => {
      await page.locator('app-sidebar').click({ force: true, position: { x: 10, y: 300 } });
      await page.keyboard.press('?');
      await page.locator('.shortcuts-overlay').waitFor({ timeout: 5000 });
      await page.keyboard.press('Escape');
      await expect(page.locator('.shortcuts-overlay')).toHaveCount(0, { timeout: 3000 });
    });

    test('clicking × closes the overlay', async ({ page }) => {
      await page.locator('app-sidebar').click({ force: true, position: { x: 10, y: 300 } });
      await page.keyboard.press('?');
      await page.locator('.shortcuts-overlay').waitFor({ timeout: 5000 });
      await page.locator('.sc-close').click();
      await expect(page.locator('.shortcuts-overlay')).toHaveCount(0, { timeout: 3000 });
    });

    test('pressing ? while focused in an input does NOT show the overlay', async ({ page }) => {
      // Focus a text input (the command palette search bar in the titlebar)
      await page.locator('.search-bar').click();
      await page.waitForTimeout(200);
      // Close command palette if it opened
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
      // Now focus the note search input
      await page.keyboard.press('Control+2');
      await page.waitForSelector('.search-input', { timeout: 8000 });
      await page.locator('.search-input').click();
      await page.keyboard.press('?');
      await expect(page.locator('.shortcuts-overlay')).toHaveCount(0);
    });
  });

  // ── Save current URL to bundle ────────────────────────────────────────────

  test.describe('Save current URL to bundle (webview toolbar)', () => {
    test.beforeEach(async ({ page }) => {
      await page.keyboard.press('Control+1');
      await page.waitForSelector('.root', { timeout: 10000 });
    });

    test('save-to-bundle button is present in webview toolbar', async ({ page }) => {
      const hasLink = await page.locator('.link-card').count() > 0;
      if (!hasLink) { test.skip(); return; }
      await page.locator('.link-card').first().click();
      await page.waitForSelector('.webview-toolbar', { timeout: 8000 });
      await expect(page.locator('button[title="Save current URL to bundle"]')).toBeVisible();
    });

    test('clicking save button opens the Save to Bundle modal', async ({ page }) => {
      const hasLink = await page.locator('.link-card').count() > 0;
      if (!hasLink) { test.skip(); return; }
      await page.locator('.link-card').first().click();
      await page.waitForSelector('.webview-toolbar', { timeout: 8000 });
      await page.locator('button[title="Save current URL to bundle"]').click();
      await expect(page.locator('.modal-title', { hasText: 'Save to Bundle' })).toBeVisible({ timeout: 5000 });
    });

    test('modal pre-fills label from the current URL domain', async ({ page }) => {
      const hasLink = await page.locator('.link-card').count() > 0;
      if (!hasLink) { test.skip(); return; }
      await page.locator('.link-card').first().click();
      await page.waitForSelector('.webview-toolbar', { timeout: 8000 });
      await page.locator('button[title="Save current URL to bundle"]').click();
      await page.locator('.modal-title', { hasText: 'Save to Bundle' }).waitFor({ timeout: 5000 });
      const labelValue = await page.locator('.modal input.field-input').inputValue();
      expect(labelValue.length).toBeGreaterThan(0);
    });

    test('modal has a bundle dropdown with at least one option', async ({ page }) => {
      const hasLink = await page.locator('.link-card').count() > 0;
      if (!hasLink) { test.skip(); return; }
      await page.locator('.link-card').first().click();
      await page.waitForSelector('.webview-toolbar', { timeout: 8000 });
      await page.locator('button[title="Save current URL to bundle"]').click();
      await page.locator('.modal-title', { hasText: 'Save to Bundle' }).waitFor({ timeout: 5000 });
      const options = page.locator('.field-select option');
      await expect(options).not.toHaveCount(0);
    });

    test('Cancel button closes the modal', async ({ page }) => {
      const hasLink = await page.locator('.link-card').count() > 0;
      if (!hasLink) { test.skip(); return; }
      await page.locator('.link-card').first().click();
      await page.waitForSelector('.webview-toolbar', { timeout: 8000 });
      await page.locator('button[title="Save current URL to bundle"]').click();
      await page.locator('.modal-title', { hasText: 'Save to Bundle' }).waitFor({ timeout: 5000 });
      await page.locator('.btn-secondary', { hasText: 'Cancel' }).click();
      await expect(page.locator('.modal-title', { hasText: 'Save to Bundle' })).toHaveCount(0, { timeout: 3000 });
    });
  });
});

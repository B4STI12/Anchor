/**
 * Phase 3 — Notes module (TipTap editor, folders, auto-save, DeepL)
 * All tests are fixme until Phase 3 ships.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, hasTestCredentials } from './helpers/auth';

const PHASE3_IMPLEMENTED = false;

test.describe('Phase 3 · Notes', () => {

  test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD');

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsTestUser(page);
    await page.locator('button[title="Notes"]').click();
    await page.waitForTimeout(300);
  });

  test.afterAll(async () => page.close());

  // ── Three-column layout ───────────────────────────────────────────────────

  test('renders folder tree, note list, and editor panels', async () => {
    test.fixme(!PHASE3_IMPLEMENTED);
    await expect(page.locator('.folder-tree')).toBeVisible();
    await expect(page.locator('.note-list')).toBeVisible();
    await expect(page.locator('.note-editor')).toBeVisible();
  });

  // ── Folder tree ───────────────────────────────────────────────────────────

  test('folder tree shows root folders', async () => {
    test.fixme(!PHASE3_IMPLEMENTED);
    await expect(page.locator('.folder-item')).toHaveCount({ minimum: 1 });
  });

  test('right-clicking a folder shows New Folder / Rename / Delete', async () => {
    test.fixme(!PHASE3_IMPLEMENTED);
    await page.locator('.folder-item').first().click({ button: 'right' });
    await expect(page.locator('.context-menu')).toContainText('New Folder');
    await expect(page.locator('.context-menu')).toContainText('Rename');
    await expect(page.locator('.context-menu')).toContainText('Delete');
    await page.keyboard.press('Escape');
  });

  // ── Note list ─────────────────────────────────────────────────────────────

  test('note list shows title, preview, and relative date', async () => {
    test.fixme(!PHASE3_IMPLEMENTED);
    const item = page.locator('.note-item').first();
    await expect(item.locator('.note-title')).not.toBeEmpty();
    await expect(item.locator('.note-preview')).not.toBeEmpty();
    await expect(item.locator('.note-date')).not.toBeEmpty();
  });

  test('pinned notes have a pin icon and appear at the top', async () => {
    test.fixme(!PHASE3_IMPLEMENTED);
    const first = page.locator('.note-item').first();
    await expect(first.locator('.pin-icon')).toBeVisible();
  });

  // ── TipTap editor ─────────────────────────────────────────────────────────

  test('clicking a note opens it in the editor', async () => {
    test.fixme(!PHASE3_IMPLEMENTED);
    await page.locator('.note-item').first().click();
    await expect(page.locator('.ProseMirror')).toBeVisible();
  });

  test('formatting toolbar shows Bold, Italic, Heading, List buttons', async () => {
    test.fixme(!PHASE3_IMPLEMENTED);
    await expect(page.locator('[title="Bold"]')).toBeVisible();
    await expect(page.locator('[title="Italic"]')).toBeVisible();
    await expect(page.locator('[title="Heading 1"]')).toBeVisible();
    await expect(page.locator('[title="Bullet list"]')).toBeVisible();
  });

  test('editor shows word count', async () => {
    test.fixme(!PHASE3_IMPLEMENTED);
    await expect(page.locator('.word-count')).toBeVisible();
    await expect(page.locator('.word-count')).toContainText('word');
  });

  test('editing content triggers "Saving…" then "Saved" indicator', async () => {
    test.fixme(!PHASE3_IMPLEMENTED);
    await page.locator('.ProseMirror').click();
    await page.keyboard.type(' test');
    await expect(page.locator('.save-indicator')).toContainText('Saving', { timeout: 3_000 });
    await expect(page.locator('.save-indicator')).toContainText('Saved', { timeout: 5_000 });
  });

  // ── Ctrl+N new note ───────────────────────────────────────────────────────

  test('Ctrl+N creates a new untitled note', async () => {
    test.fixme(!PHASE3_IMPLEMENTED);
    const before = await page.locator('.note-item').count();
    await page.keyboard.press('Control+n');
    await page.waitForTimeout(300);
    await expect(page.locator('.note-item')).toHaveCount(before + 1);
  });

  // ── DeepL Write ───────────────────────────────────────────────────────────

  test('DeepL Write button is visible in the editor toolbar', async () => {
    test.fixme(!PHASE3_IMPLEMENTED);
    await expect(page.locator('[title="Improve with DeepL"]')).toBeVisible();
  });

});

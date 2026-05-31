/**
 * Phase 3 — Notes module (TipTap editor, folders, auto-save, DeepL)
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, hasTestCredentials } from './helpers/auth';

const PHASE3_IMPLEMENTED = true;

test.describe('Phase 3 · Notes', () => {

  test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD');

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // test.setTimeout() is the only reliable way to set a hook timeout when
    // the hook takes fixture arguments ({ browser }).
    test.setTimeout(90_000);

    page = await browser.newPage();
    await loginAsTestUser(page);

    // ── Profile-load guarantee ────────────────────────────────────────────────
    // ShellComponent.ngOnInit() calls profile.load() asynchronously.
    // ProfileService starts with id:'' (falsy), so noteService.load() exits
    // early (no spinner) if called before the Supabase profile fetch completes.
    //
    // Strategy:
    //   1. Click Notes once — this starts the profile fetch in the background.
    //   2. Wait 3 s — enough for any Supabase cold-start (free tier can be slow).
    //   3. Navigate away → back — re-triggers NotesComponent.ngOnInit(), so
    //      noteService.load() runs again now that active().id is a real UUID.
    //   4. Wait for the empty/loaded state — confirms the real DB calls finished.
    await page.locator('button[title="Notes"]').click();
    await page.waitForTimeout(3_000);

    await page.locator('button[title="Bundles"]').click();
    await page.waitForTimeout(300);
    await page.locator('button[title="Notes"]').click();

    // After re-navigation noteService.load() makes real DB calls.
    // Wait until the note list is no longer in "Loading…" state.
    // Both ".list-empty" (no notes) and ".note-item" (existing notes) only
    // appear after loading completes.
    await page.locator('.list-empty, .note-item').first()
      .waitFor({ state: 'visible', timeout: 20_000 });

    // ── Seed test data ────────────────────────────────────────────────────────

    // Create a user folder so the context-menu test has a non-root folder.
    // Root items ("All Notes", "Unfiled") have no contextmenu handler.
    await page.locator('button[title="New folder"]').click();
    await page.locator('.modal-input').fill('Test Folder');
    await page.locator('.btn-primary').click();
    await page.locator('.folder-item:not(.root-item)').first()
      .waitFor({ state: 'visible', timeout: 20_000 });

    // Create a note and wait for it to open in the editor.
    // Use the toolbar button — more reliable than Ctrl+N (keyboard handler is
    // blocked when an INPUT has focus after the modal closes).
    await page.locator('button[title="New note"]').click();
    await page.locator('.note-item').first().waitFor({ state: 'visible', timeout: 20_000 });
    await page.locator('.ProseMirror').waitFor({ state: 'visible', timeout: 20_000 });

    // Type content so .note-preview is non-empty after auto-save.
    // NoteService.updateNote signals update AFTER the DB write, so the preview
    // only reflects the content once the 2 s debounce + round-trip finishes.
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Playwright test content');
    await page.waitForTimeout(3_500);

    // Pin the note (force bypasses opacity-0 CSS on the pin button).
    await page.locator('.note-item').first().hover();
    await page.locator('.note-item').first().locator('.pin-btn').click({ force: true });
    await page.waitForTimeout(500);

    // Re-select the note so editor, toolbar, and footer are in the DOM for tests
    // that depend on a note being open.
    await page.locator('.note-item').first().click();
    await page.locator('.ProseMirror').waitFor({ state: 'visible', timeout: 5_000 });
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
    // "All Notes" and "Unfiled" root items are always present
    await expect(page.locator('.folder-item').first()).toBeVisible();
  });

  test('right-clicking a folder shows New Folder / Rename / Delete', async () => {
    test.fixme(!PHASE3_IMPLEMENTED);
    // Only user-created folder divs (not .root-item buttons) have the contextmenu handler
    await page.locator('.folder-item:not(.root-item)').first().click({ button: 'right' });
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
    // Click the editor body so focus is on a div, not an INPUT/TEXTAREA —
    // the keyboard handler blocks Ctrl+N when a form field has focus.
    await page.locator('.editor-body').click();
    await page.keyboard.press('Control+n');
    await expect(page.locator('.note-item')).toHaveCount(before + 1, { timeout: 8_000 });
  });

  // ── DeepL Write ───────────────────────────────────────────────────────────

  test('DeepL Write button is visible in the editor toolbar', async () => {
    test.fixme(!PHASE3_IMPLEMENTED);
    await expect(page.locator('[title="Improve with DeepL"]')).toBeVisible();
  });

});

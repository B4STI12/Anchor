/**
 * Phase 4 — Floating calculator overlay
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, hasTestCredentials } from './helpers/auth';

const PHASE4_IMPLEMENTED = false;

test.describe('Phase 4 · Calculator', () => {

  test.skip(!hasTestCredentials(), 'Set TEST_EMAIL + TEST_PASSWORD');

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsTestUser(page);
  });

  test.afterAll(async () => page.close());

  async function openCalc() {
    await page.keyboard.press('Control+4');
    await expect(page.locator('.calc-overlay')).toBeVisible();
  }

  test('Ctrl+4 opens the floating calculator', async () => {
    test.fixme(!PHASE4_IMPLEMENTED);
    await openCalc();
  });

  test('clicking Calculator sidebar button toggles it', async () => {
    test.fixme(!PHASE4_IMPLEMENTED);
    await page.locator('button[title="Calculator"]').click();
    await expect(page.locator('.calc-overlay')).toBeVisible();
    await page.locator('button[title="Calculator"]').click();
    await expect(page.locator('.calc-overlay')).not.toBeVisible();
  });

  test('calculator renders digit and operator buttons', async () => {
    test.fixme(!PHASE4_IMPLEMENTED);
    await openCalc();
    await expect(page.locator('.calc-key:has-text("1")')).toBeVisible();
    await expect(page.locator('.calc-key:has-text("+")')).toBeVisible();
    await expect(page.locator('.calc-key:has-text("=")')).toBeVisible();
  });

  test('keyboard input works (1 + 2 = 3)', async () => {
    test.fixme(!PHASE4_IMPLEMENTED);
    await openCalc();
    await page.keyboard.press('1');
    await page.keyboard.press('+');
    await page.keyboard.press('2');
    await page.keyboard.press('Enter');
    await expect(page.locator('.calc-display')).toContainText('3');
  });

  test('C button clears the display', async () => {
    test.fixme(!PHASE4_IMPLEMENTED);
    await openCalc();
    await page.keyboard.press('5');
    await page.locator('.calc-key:has-text("C")').click();
    await expect(page.locator('.calc-display')).toHaveText('0');
  });

  test('result appears in history panel', async () => {
    test.fixme(!PHASE4_IMPLEMENTED);
    await openCalc();
    await page.keyboard.press('9');
    await page.keyboard.press('Enter');
    await expect(page.locator('.calc-history-item').first()).toContainText('9');
  });

  test('clicking a history item restores the result', async () => {
    test.fixme(!PHASE4_IMPLEMENTED);
    await openCalc();
    await page.locator('.calc-history-item').first().click();
    await expect(page.locator('.calc-display')).not.toHaveText('0');
  });

  test('Escape closes the calculator', async () => {
    test.fixme(!PHASE4_IMPLEMENTED);
    await openCalc();
    await page.keyboard.press('Escape');
    await expect(page.locator('.calc-overlay')).not.toBeVisible();
  });

  test('close button (×) hover turns red', async () => {
    test.fixme(!PHASE4_IMPLEMENTED);
    await openCalc();
    await page.locator('.calc-close').hover();
    const color = await page.locator('.calc-close').evaluate(el =>
      getComputedStyle(el).color
    );
    expect(color).toContain('248, 113, 113'); // #f87171
  });

  test('calculator floats over other content (z-index > sidebar)', async () => {
    test.fixme(!PHASE4_IMPLEMENTED);
    await openCalc();
    const z = await page.locator('.calc-overlay').evaluate(el =>
      parseInt(getComputedStyle(el).zIndex, 10)
    );
    expect(z).toBeGreaterThan(100);
  });

});

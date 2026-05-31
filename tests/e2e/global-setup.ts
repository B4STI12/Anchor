import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { config as dotenvConfig } from 'dotenv';

// Ensure .env at project root is loaded regardless of how the runner was invoked
dotenvConfig({ path: path.join(__dirname, '../..', '.env') });

export const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'state.json');

export default async function globalSetup() {
  const email    = process.env['TEST_EMAIL'];
  const password = process.env['TEST_PASSWORD'];

  // Ensure .auth directory exists
  const authDir = path.dirname(AUTH_STATE_PATH);
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  // Always warm up the Angular dev server with a browser request.
  // This ensures TypeScript compilation completes before any test runs,
  // preventing the first few tests from hitting slow compilation timeouts.
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page    = await context.newPage();

  await page.goto('http://localhost:4201/#/login', { waitUntil: 'networkidle', timeout: 90_000 });
  console.log('[global-setup] Angular dev server is warm');

  if (!email || !password) {
    console.log('[global-setup] TEST_EMAIL / TEST_PASSWORD not set — writing empty auth state');
    fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }));
    await browser.close();
    return;
  }

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/#\/app/, { timeout: 60_000 });

  await context.storageState({ path: AUTH_STATE_PATH });
  await browser.close();

  console.log('[global-setup] Auth state saved to', AUTH_STATE_PATH);
}

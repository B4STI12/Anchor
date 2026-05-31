import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { config as dotenvConfig } from 'dotenv';

// Ensure .env at project root is loaded regardless of how the runner was invoked
dotenvConfig({ path: path.join(__dirname, '../..', '.env') });

export const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'state.json');

export default async function globalSetup() {
  // Ensure .auth directory exists (needed so playwright.config storageState path is valid)
  const authDir = path.dirname(AUTH_STATE_PATH);
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  // Note: Supabase is configured with persistSession:false in this app.
  // Sessions live in memory only, so storageState cannot capture them.
  // The auth state file is kept empty; loginAsTestUser always does a full UI login.
  fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }));

  // Warm up the Angular dev server so TypeScript compilation completes before
  // the first test runs. Without this, the first few page.goto() calls take
  // 30+ seconds and hit the test timeout.
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page    = await context.newPage();

  await page.goto('http://localhost:4201/#/login', { waitUntil: 'networkidle', timeout: 90_000 });
  await browser.close();

  console.log('[global-setup] Angular dev server is warm');
}

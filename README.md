# Anchor

A personal desktop productivity app — site launcher, embedded browser, notes, snippets, and calculator in one password-protected workspace with multi-profile support.

Built with **Electron + Angular + Supabase**.

---

## Table of Contents

1. [What it does](#what-it-does)
2. [Tech stack](#tech-stack)
3. [Roadmap](#roadmap)
4. [Quick start](#quick-start)
5. [Supabase setup](#supabase-setup)
6. [Environment configuration](#environment-configuration)
7. [Scripts reference](#scripts-reference)
8. [Project structure](#project-structure)
9. [Design system](#design-system)
10. [Architecture notes](#architecture-notes)
11. [Testing](#testing)
12. [Building for distribution](#building-for-distribution)

---

## What it does

| Module | Description |
|---|---|
| **Bundles** | Groups of links. Click a card to open the site in the embedded browser, or hit *Open All* to fire them in sequence. |
| **Embedded browser** | Full Chromium webview inside the app — no X-Frame-Options issues. Back / Forward / Reload / Copy URL / Open externally / **Save current page to any bundle** / Per-domain zoom memory. |
| **Notes** | Three-column editor: folder tree → note list → TipTap rich-text editor. Auto-saves every 2 s. **Tag chips** below the title, searchable. Export as `.md` or PDF. Templates (blank, meeting, daily log). Optional DeepL Write integration. |
| **Snippets** | Address cards (per-field copy) and custom text snippets (monospace). Usage counter sorts most-used to the top. |
| **Calculator** | Floating draggable overlay with keyboard input and calculation history. Appears over any screen. |
| **Command palette** | `Ctrl/⌘ K` — search bundles, notes, and snippets from anywhere. |
| **Profiles** | Multiple named profiles (Private, Work, …) each with their own data and a color indicator. |
| **Settings** | Password, profiles, DeepL API key (stored in OS keychain via `safeStorage`), theme, keyboard shortcuts, data export. |

---

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Desktop shell | Electron | 42 |
| Frontend | Angular (standalone components) | 21 |
| Styling | Plain CSS + custom properties | — |
| Backend / Auth | Supabase (Postgres + Auth) | — |
| Note editor | TipTap | (Phase 3) |
| Packaging | electron-builder | 26 |
| Dev runner | concurrently + wait-on | — |
| E2E tests | Playwright | 1.60 |

---

## Roadmap

| Phase | Status | Contents |
|---|---|---|
| **Phase 1** | ✅ Done | Electron + Angular wired, Supabase auth, sidebar shell, CSS design system |
| **Phase 2** | ✅ Done | Bundles CRUD, link cards, embedded webview, Snippets full CRUD |
| **Phase 3** | ✅ Done | Notes: TipTap editor, folder tree, auto-save, DeepL Write, export, templates |
| **Phase 4** | ✅ Done | Floating calculator, command palette, drag-to-reorder, toasts, reachability dots, zoom, recently visited |
| **Phase 5** | ✅ Done | System tray, app lock, settings (complete), onboarding wizard, email placeholders |
| **Phase 6** | ✅ Done | Light theme, note export (.md / .pdf), templates, recently visited, per-domain zoom, email settings, HTML email |
| **Phase 7** | ✅ Done | Add current URL to bundle (webview toolbar), `?` keyboard shortcut overlay, note tags with chip UI |

---

## Quick start

### Prerequisites

- **Node.js** 18 or later (`node --version`)
- A **Supabase** project — see [Supabase setup](#supabase-setup) below

### 1 — Clone and install

```bash
git clone https://github.com/B4STI12/Anchor.git
cd Anchor
npm install
```

### 2 — Configure Supabase credentials

Open `src/environments/environment.ts` and fill in your project URL and anon key:

```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://xxxx.supabase.co',
  supabaseAnonKey: 'your-anon-key',
};
```

Do the same in `src/environments/environment.prod.ts` for production builds.

> The Supabase **anon key** is safe to commit — it is intentionally public and protected by Row Level Security policies. Never commit the `service_role` key.

### 3 — Run in development

```bash
npm run dev
```

This starts `ng serve` and, once Angular is ready on port 4200, compiles Electron and launches the desktop window.  
The first run downloads the Electron binary (~130 MB) — subsequent launches are instant.

---

## Supabase setup

### Create tables

Run the following SQL in your Supabase **SQL editor** to create the full schema:

```sql
-- Profiles (one per named workspace, many per auth user)
create table profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  name        text not null,
  color       text not null,
  avatar_icon text,
  created_at  timestamptz default now()
);

-- Bundles (groups of links)
create table bundles (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles not null,
  name       text not null,
  color      text,
  ord        int default 0
);

-- Links (individual URLs inside a bundle)
create table links (
  id         uuid primary key default gen_random_uuid(),
  bundle_id  uuid references bundles not null,
  label      text not null,
  url        text not null,
  favicon    text,
  ord        int default 0
);

-- Folders (nested, for notes)
create table folders (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles not null,
  name       text not null,
  parent_id  uuid references folders,
  ord        int default 0
);

-- Notes
create table notes (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles not null,
  folder_id  uuid references folders,
  title      text not null default 'Untitled',
  content    jsonb,
  pinned     boolean default false,
  tags       text[],
  updated_at timestamptz default now()
);

-- Snippets
create table snippets (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles not null,
  label      text not null,
  type       text not null check (type in ('address', 'custom')),
  content    text,
  fields     jsonb,
  category   text,
  uses       int default 0,
  ord        int default 0
);
```

### Enable Row Level Security

```sql
alter table profiles  enable row level security;
alter table bundles   enable row level security;
alter table links     enable row level security;
alter table folders   enable row level security;
alter table notes     enable row level security;
alter table snippets  enable row level security;

-- Policy pattern: user can only access their own data via profile join
create policy "own profiles"  on profiles  for all using (auth.uid() = user_id);
create policy "own bundles"   on bundles   for all using (auth.uid() = (select user_id from profiles where id = profile_id));
create policy "own links"     on links     for all using (auth.uid() = (select user_id from profiles where id = (select profile_id from bundles where id = bundle_id)));
create policy "own folders"   on folders   for all using (auth.uid() = (select user_id from profiles where id = profile_id));
create policy "own notes"     on notes     for all using (auth.uid() = (select user_id from profiles where id = profile_id));
create policy "own snippets"  on snippets  for all using (auth.uid() = (select user_id from profiles where id = profile_id));
```

### Migrate existing tables

If you already have the schema without the `tags` column on notes:

```sql
alter table notes add column if not exists tags text[];
```

### Create a user

In the Supabase dashboard go to **Authentication → Users → Add user** and create an email/password account. That is the account you sign in with on the Anchor login screen.

---

## Environment configuration

### Supabase (required)

`src/environments/environment.ts`

```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://xxxx.supabase.co',
  supabaseAnonKey: 'eyJ...',
};
```

### DeepL API key (optional — Phase 3)

The DeepL key is **not** stored in environment files. It is saved on-device in the OS keychain via Electron's `safeStorage` API. Set it through **Settings → DeepL API key** inside the running app.

---

## Scripts reference

| Script | Command | Description |
|---|---|---|
| Dev (full) | `npm run dev` | `ng serve` + Electron, both in one terminal |
| Angular only | `npm start` | `ng serve` at `localhost:4200` — useful without Electron |
| Electron only | `npm run electron:start` | Compile Electron TS then launch (requires Angular already running) |
| Production build | `npm run build:full` | Angular prod build + Electron TS compile |
| Package app | `npm run dist` | Full build then electron-builder packaging → `release/` |
| Run all tests | `npm test` | Playwright E2E suite (starts dev server automatically) |
| Test — Phase 1 | `npm run test:phase1` | Login, shell, navigation, profile, palette |
| Test — Phase 2 | `npm run test:phase2` | Bundles, snippets (fixme until Phase 2 ships) |
| Test — Phase 3 | `npm run test:phase3` | Notes (fixme until Phase 3 ships) |
| Test — Phase 4 | `npm run test:phase4` | Calculator (fixme until Phase 4 ships) |
| Test — Phase 5 | `npm run test:phase5` | Settings full (fixme until Phase 5 ships) |
| Test UI mode | `npm run test:ui` | Playwright visual test runner |
| Test report | `npm run test:report` | Open last HTML test report in browser |

---

## Project structure

```
Anchor/
│
├── electron/
│   ├── main.ts             # BrowserWindow, IPC handlers (window controls, API keys)
│   ├── preload.ts          # contextBridge → exposes window.electronAPI to Angular
│   └── safe-storage.ts     # OS keychain read/write via Electron safeStorage
│
├── src/
│   ├── main.ts             # Angular bootstrap
│   ├── styles.css          # Global CSS entry point (imports global.css)
│   ├── index.html          # HTML shell + Google Fonts link
│   │
│   ├── environments/
│   │   ├── environment.ts       # Dev: Supabase URL + anon key
│   │   └── environment.prod.ts  # Prod: same shape
│   │
│   ├── styles/
│   │   └── global.css      # CSS custom properties, resets, scrollbar, animations
│   │
│   └── app/
│       ├── app.ts           # Root component (RouterOutlet only)
│       ├── app.routes.ts    # Routes: /login, /app/** with AuthGuard, hash location
│       ├── app.config.ts    # ApplicationConfig with provideRouter
│       │
│       ├── core/
│       │   ├── auth/
│       │   │   ├── auth.service.ts         # Supabase signIn/signOut, session signal
│       │   │   ├── auth.guard.ts           # CanActivateFn — redirects to /login if unauth
│       │   │   └── login/
│       │   │       └── login.component.ts  # Login form with error handling + loading state
│       │   ├── supabase/
│       │   │   └── supabase.service.ts     # SupabaseClient singleton (no session persistence)
│       │   └── electron/
│       │       └── electron.service.ts     # window.electronAPI wrapper (gracefully no-ops in browser)
│       │
│       ├── layout/
│       │   ├── shell/
│       │   │   └── shell.component.ts      # Titlebar + sidebar + router-outlet wrapper
│       │   └── sidebar/
│       │       └── sidebar.component.ts    # Icon nav, profile switcher, keyboard shortcuts
│       │
│       ├── modules/
│       │   ├── bundles/bundles.component.ts     # Placeholder → Phase 2
│       │   ├── notes/notes.component.ts         # Placeholder → Phase 3
│       │   └── snippets/snippets.component.ts   # Placeholder → Phase 2
│       │
│       ├── settings/
│       │   └── settings.component.ts       # Stub: account info + sign out
│       │
│       └── shared/
│           ├── components/
│           │   ├── toast/toast.component.ts                       # Toast notification host
│           │   └── command-palette/command-palette.component.ts   # Ctrl+K modal stub
│           └── services/
│               ├── toast.service.ts            # Signal-based toast queue (auto-dismiss 2.2 s)
│               ├── profile.service.ts          # Active profile + profile list signals
│               ├── nav.service.ts              # Current screen signal (sidebar ↔ shell)
│               └── command-palette.service.ts  # open/toggle/close signal
│
├── tests/
│   └── e2e/
│       ├── helpers/auth.ts              # loginAsTestUser(), TEST_EMAIL/TEST_PASSWORD
│       ├── phase1-login.spec.ts         # 12 tests — login page
│       ├── phase1-shell.spec.ts         # 13 tests — titlebar + sidebar layout
│       ├── phase1-navigation.spec.ts    # 13 tests — screen switching + shortcuts
│       ├── phase1-profile.spec.ts       # 11 tests — profile switcher + toast
│       ├── phase1-palette.spec.ts        # 9 tests — command palette
│       ├── phase2-bundles.spec.ts       # 18 tests — (fixme until Phase 2)
│       ├── phase2-snippets.spec.ts      # 17 tests — (fixme until Phase 2)
│       ├── phase3-notes.spec.ts         # 11 tests — (fixme until Phase 3)
│       ├── phase4-calculator.spec.ts    # 10 tests — (fixme until Phase 4)
│       └── phase5-settings.spec.ts       # 9 tests — 2 run now, 7 fixme
│
├── playwright.config.ts        # Playwright config — auto-starts ng serve
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.electron.json      # Separate TS config for Electron (CommonJS, outDir: dist-electron)
├── electron-builder.json       # Packaging config (win/mac/linux)
├── package.json
└── CLAUDE.md                   # Full app spec (source of truth for Claude Code)
```

---

## Design system

All values come from the mockup in `mockup/anchor/`. The CSS custom properties are declared in `src/styles/global.css`:

```css
--bg:      #0e1118   /* main background */
--panel:   #151926   /* card / panel surface */
--panel-2: #11151f   /* secondary panel (sidebar sub-areas) */
--rail:    #0b0e15   /* narrow sidebar rail */
--border:  #232a3a   /* all borders */
--hover:   #1b2130   /* hover state fill */
--text:    #eef1f7   /* primary text */
--dim:     #c0c7d4   /* secondary text */
--muted:   #6b7488   /* placeholder / disabled text */
--accent:  #2563eb   /* dark blue — primary actions */
--accent2: #60a5fa   /* blue highlight — active states */
--mono:    'JetBrains Mono', ui-monospace, monospace
```

**Fonts:** Inter (UI), JetBrains Mono (code/mono elements) — loaded from Google Fonts.

**Border radius:** 8 px small · 12–13 px cards · 16 px large panels.

**Animations:**
- `appIn` — page load fade-in + subtle scale
- `toastIn` — toast slide-up with spring bounce
- `popIn` — dropdown pop-in

---

## Architecture notes

### Electron ↔ Angular communication

Angular never has direct access to Node.js APIs. Everything goes through the IPC bridge:

```
Angular (renderer)
  └─ ElectronService.getApiKey()
       └─ window.electronAPI.getApiKey()   ← set by preload.ts via contextBridge
            └─ ipcRenderer.invoke('get-api-key')
                 └─ ipcMain.handle('get-api-key')   ← main.ts
                      └─ safeStorage.decryptString()
```

`ElectronService` gracefully no-ops when `window.electronAPI` is undefined (i.e. when running `ng serve` in a plain browser without Electron).

### Auth model

- Single Supabase email+password user per installation
- JWT session is kept **in memory only** — not in `localStorage` — so it is cleared on app relaunch (by design; the lock screen re-prompts without a full logout)
- `AuthGuard` protects all `/app/**` routes; unauthenticated requests redirect to `/login`
- Router uses **hash location** (`/#/login`, `/#/app/bundles`) so Electron's `loadFile` in production works without a server

### Profiles

Each named profile (Private, Work, …) is a row in the `profiles` table scoped to one Supabase auth user. All other tables (`bundles`, `links`, `notes`, `snippets`, `folders`) reference a `profile_id`. Switching profiles reloads all module data for the new `profile_id`.

In Phase 1, profiles are hardcoded in `ProfileService`. In Phase 4 they will be wired to Supabase.

### API key storage

The DeepL API key is stored on-device using Electron's `safeStorage` (OS keychain on macOS, DPAPI on Windows, libsecret on Linux). It is never written to disk in plain text and never sent to Supabase. Reads and writes go through IPC (`get-api-key` / `set-api-key`).

### Webview

The embedded browser uses Electron's `<webview>` tag — a real isolated Chromium instance. This is why `webviewTag: true` is set in `BrowserWindow` webPreferences. Without it, Angular renders an empty `<div>` with no error.

JavaScript in the Angular renderer **cannot** read selected text inside a `<webview>` due to cross-origin isolation — the "Save to Notes" floating button therefore only appears for selections within Angular's own DOM.

---

## Testing

### Setup

Tests run against the Angular dev server (started automatically by Playwright if not already running).

Authenticated tests (shell, navigation, profile switcher, command palette) require a Supabase account. Set two environment variables before running:

```powershell
# PowerShell
$env:TEST_EMAIL    = "you@example.com"
$env:TEST_PASSWORD = "yourpassword"
npm test
```

```bash
# bash / macOS / Linux
TEST_EMAIL=you@example.com TEST_PASSWORD=yourpassword npm test
```

Tests without these variables are **automatically skipped** — the unauthenticated login-page tests still run.

### Test organisation

```
126 tests total across 10 spec files
├── Phase 1  (58 tests)  — run immediately, no fixme
└── Phase 2-5 (68 tests) — marked fixme, activate per phase
```

### Activating Phase 2+ tests

When a phase ships, open the corresponding spec file and flip the flag:

```ts
// tests/e2e/phase2-bundles.spec.ts
const PHASE2_IMPLEMENTED = true;  // ← was false
```

Then run `npm run test:phase2` to confirm all new tests pass before marking the phase done.

### Test commands

```bash
npm test                 # full suite + HTML report
npm run test:phase1      # Phase 1 only (~30 s)
npm run test:ui          # Playwright visual runner (pick tests interactively)
npm run test:report      # open last HTML report in browser
```

Reports are saved to `tests/report/`.

---

## Building for distribution

```bash
npm run dist
```

This runs:
1. `ng build` — Angular production build → `dist/anchor/browser/`
2. `tsc -p tsconfig.electron.json` — Electron TS → `dist-electron/`
3. `electron-builder` — packages everything → `release/`

Output targets configured in `electron-builder.json`:

| Platform | Format |
|---|---|
| Windows | NSIS installer |
| macOS | DMG |
| Linux | AppImage |

To build for a specific platform:

```bash
npx electron-builder --win
npx electron-builder --mac
npx electron-builder --linux
```

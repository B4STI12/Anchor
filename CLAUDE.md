\# Anchor — Project Spec for Claude Code



Anchor is a personal desktop productivity app built with Electron + Angular + Supabase.

It combines a site launcher, embedded browser, notes, snippets, and a calculator into one

password-protected workspace with multi-profile support.



A full UI mockup exists (`mockup/Anchor.html`) — use it as the visual reference for all screens.

Match the design system exactly: colors, spacing, component shapes, and interactions.



\---



\## Tech Stack



| Layer | Technology |

|---|---|

| Desktop shell | Electron (latest stable) |

| Frontend | Angular (latest stable), standalone components |

| Styling | Plain CSS with CSS custom properties — no Tailwind, no CSS-in-JS |

| Backend | Supabase (Postgres + Auth) |

| Note editor | TipTap via `@tiptap/angular` |

| Packaging | electron-builder |

| Dev runner | concurrently (Angular dev server + Electron simultaneously) |



\*\*Electron config requirements:\*\*

\- `webviewTag: true` in BrowserWindow webPreferences (required for embedded browser)

\- `contextIsolation: true`, `nodeIntegration: false` in renderer

\- All Node/OS access goes through the preload IPC bridge — never expose raw Node to Angular



\---



\## Design System



Pull all values from the mockup. Reference:



```css

\--bg:       #0e1118

\--panel:    #151926

\--panel-2:  #11151f

\--rail:     #0b0e15

\--border:   #232a3a

\--hover:    #1b2130

\--text:     #eef1f7

\--dim:      #c0c7d4

\--muted:    #6b7488

\--accent:   #2563eb   /\* dark blue primary \*/

\--accent2:  #60a5fa   /\* blue highlight \*/

\--mono:     'JetBrains Mono', ui-monospace, monospace

```



\*\*Fonts:\*\* Inter (UI), JetBrains Mono (code/monospace elements)  

\*\*Border radius:\*\* 8px small, 12–13px cards, 16px large panels  

\*\*Titlebar:\*\* macOS traffic light dots (red/yellow/green), app name, screen breadcrumb, search bar, active profile indicator  

\*\*Animations:\*\* `appIn` on load, `toastIn` for toasts, `popIn` for dropdowns — see mockup CSS



\---



\## Project Structure



```

anchor/

├── electron/

│   ├── main.ts           # Electron main process

│   ├── preload.ts        # IPC bridge — exposes window.electronAPI to Angular

│   └── safe-storage.ts   # safeStorage wrapper for API key encryption

├── src/

│   ├── app/

│   │   ├── core/

│   │   │   ├── auth/             # login guard, JWT service, auth state

│   │   │   ├── supabase/         # supabase client service

│   │   │   └── electron/         # IPC service wrapping window.electronAPI

│   │   ├── layout/

│   │   │   ├── shell/            # main app wrapper (titlebar + sidebar + outlet)

│   │   │   └── sidebar/          # icon nav, profile switcher, calc toggle

│   │   ├── modules/

│   │   │   ├── bundles/

│   │   │   │   ├── bundle-list/       # left sub-panel, bundle CRUD

│   │   │   │   ├── bundle-grid/       # link card grid, "Open All" button

│   │   │   │   ├── link-card/         # single link (favicon, label, hover state, drag handle)

│   │   │   │   └── webview/           # embedded browser: toolbar + <webview> tag

│   │   │   ├── notes/

│   │   │   │   ├── folder-tree/       # nested folder sidebar, right-click context menu

│   │   │   │   ├── note-list/         # middle panel, pinned notes, search

│   │   │   │   ├── note-editor/       # TipTap wrapper, DeepL Write button, word count, auto-save

│   │   │   │   └── save-selection/    # floating "Save to Notes" button on text selection

│   │   │   ├── snippets/

│   │   │   │   ├── snippet-list/      # filterable grid (All / Addresses / Custom)

│   │   │   │   └── snippet-card/      # card with multi-field copy rows for addresses

│   │   │   ├── calculator/            # floating draggable overlay, history panel

│   │   │   ├── email/                 # placeholder screen — "Coming Soon" UI only

│   │   │   └── email-triad/           # placeholder screen — disabled button, future API hook

│   │   ├── shared/

│   │   │   ├── components/

│   │   │   │   ├── toast/             # toast notification host

│   │   │   │   ├── command-palette/   # Cmd+K global search overlay

│   │   │   │   └── modal/             # reusable modal wrapper

│   │   │   └── services/

│   │   │       ├── deepl.service.ts   # DeepL Write API calls

│   │   │       ├── clipboard.service.ts

│   │   │       └── search.service.ts  # indexes notes, snippets, bundles for command palette

│   │   └── settings/                  # password, profiles, DeepL key, theme, export

│   ├── styles/

│   │   └── global.css                 # CSS variables, resets, scrollbar, animations

│   └── environments/

│       ├── environment.ts

│       └── environment.prod.ts

├── mockup/                            # the full HTML mockup — reference only, do not modify

│   └── Anchor.html

├── CLAUDE.md

├── angular.json

├── package.json

└── electron-builder.json

```



\---



\## Supabase Data Model



```sql

\-- One Supabase auth user per installation

\-- Multiple named profiles per user (private, work, etc.)



profiles (

&#x20; id          uuid primary key default gen\_random\_uuid(),

&#x20; user\_id     uuid references auth.users not null,

&#x20; name        text not null,

&#x20; color       text not null,           -- hex color for dot indicator

&#x20; avatar\_icon text,

&#x20; created\_at  timestamptz default now()

)



bundles (

&#x20; id          uuid primary key default gen\_random\_uuid(),

&#x20; profile\_id  uuid references profiles not null,

&#x20; name        text not null,

&#x20; color       text,

&#x20; ord         int default 0            -- display order

)



links (

&#x20; id          uuid primary key default gen\_random\_uuid(),

&#x20; bundle\_id   uuid references bundles not null,

&#x20; label       text not null,

&#x20; url         text not null,

&#x20; favicon     text,                    -- auto-fetched, stored as data URL or null

&#x20; ord         int default 0

)



folders (

&#x20; id          uuid primary key default gen\_random\_uuid(),

&#x20; profile\_id  uuid references profiles not null,

&#x20; name        text not null,

&#x20; parent\_id   uuid references folders, -- null = root level

&#x20; ord         int default 0

)



notes (

&#x20; id          uuid primary key default gen\_random\_uuid(),

&#x20; profile\_id  uuid references profiles not null,

&#x20; folder\_id   uuid references folders,  -- null = unfiled

&#x20; title       text not null default 'Untitled',

&#x20; content     jsonb,                    -- TipTap JSON doc format

&#x20; pinned      boolean default false,

&#x20; updated\_at  timestamptz default now()

)



snippets (

&#x20; id          uuid primary key default gen\_random\_uuid(),

&#x20; profile\_id  uuid references profiles not null,

&#x20; label       text not null,

&#x20; type        text not null check (type in ('address', 'custom')),

&#x20; content     text,                     -- used for type = 'custom'

&#x20; fields      jsonb,                    -- used for type = 'address': \[{k, v}]

&#x20; category    text,

&#x20; uses        int default 0,            -- usage counter, increment on copy

&#x20; ord         int default 0

)

```



Enable Row Level Security on all tables. Policy: `auth.uid() = user\_id` via profile join.



\---



\## Electron IPC Bridge



`preload.ts` exposes only these methods to Angular via `window.electronAPI`:



```typescript

window.electronAPI = {

&#x20; // DeepL API key — stored in OS keychain via safeStorage

&#x20; getApiKey: (service: string) => ipcRenderer.invoke('get-api-key', service),

&#x20; setApiKey: (service: string, key: string) => ipcRenderer.invoke('set-api-key', service, key),



&#x20; // Window controls

&#x20; minimize: () => ipcRenderer.send('window-minimize'),

&#x20; maximize: () => ipcRenderer.send('window-maximize'),

&#x20; close:    () => ipcRenderer.send('window-close'),

}

```



The Angular `ElectronService` wraps `window.electronAPI` and handles the case where it is

undefined (i.e. running in a browser during development).



\---



\## Modules — Detailed Behaviour



\### Auth

\- Single Supabase auth user, email+password

\- On first launch: show onboarding wizard to create account + first profile

\- After login: JWT stored in memory (not localStorage) — re-authenticate on app relaunch

\- App lock: after configurable inactivity timeout, re-prompt password without full logout

\- `AuthGuard` on all routes except `/login`



\### Profile Switcher

\- Lives at top of sidebar

\- Shows initials + colored dot of active profile

\- Click → dropdown: list all profiles with colored dots, active has checkmark, "Add Profile" at bottom

\- Switching profile reloads all module data scoped to the new `profile\_id`

\- Toast: "Switched to \[name] profile"



\### Bundles

\- Left sub-panel: list of bundles, drag to reorder (CDK drag-drop)

\- Each bundle has a colored dot and name

\- Main area: card grid of links — favicon auto-fetched from `https://www.google.com/s2/favicons?domain={url}\&sz=64`

\- Each card: favicon, label, small reachability dot (green/red, checked on load via `fetch` HEAD request with 3s timeout)

\- Top bar: bundle name, "Open All" button (dark blue), "+" add link button

\- Clicking a single link → navigates to embedded browser screen

\- "Open All" → opens first link in embedded browser (multiple tabs not applicable in single webview — open all fires each link in sequence into the webview or prompt user)

\- Drag handles on cards to reorder within a bundle

\- Right-click card → context menu: Edit, Delete



\### Embedded Browser (Webview)

\- Uses Electron `<webview>` tag — real Chromium, no X-Frame-Options issues

\- Toolbar: ← back, → forward, ↺ reload | URL bar (read-only display) | copy-URL icon | open-in-external-browser icon

\- Animated loading bar (translating div) while page loads

\- Graceful handling of crashes/errors — show error state with retry button

\- "Add current URL to bundle" button in toolbar

\- Escape key → back to Bundles screen



\### Notes

\- Three-column layout: folder tree | note list | editor

\- \*\*Folder tree:\*\* nested folders, collapse/expand, right-click → New Folder / Rename / Delete, drag note between folders

\- \*\*Note list:\*\* sorted by `updated\_at` desc, pinned notes float to top with pin icon, shows title + first line preview + relative date

\- \*\*Editor (TipTap):\*\* formatting toolbar (bold, italic, underline, strikethrough, h1/h2/h3, bullet list, ordered list, blockquote, code), word count bottom-right, auto-save every 2s with "Saved" indicator

\- \*\*DeepL Write button\*\* in toolbar: calls `/v2/write` endpoint with selected text or full note content, replaces with improved version, shows diff briefly

\- \*\*Save to Notes:\*\* `document.addEventListener('selectionchange')` — when text is selected anywhere within the app (not webview), show a floating button "Save to Notes" → creates new note with selected text as content

\- Note tags: comma-separated tag input below title, searchable via command palette



\### Snippets

\- Filter tabs: All / Addresses / Custom

\- Card grid (auto-fill columns, min 300px)

\- \*\*Address card:\*\* header with label + copy-all button, expanded body shows per-field rows (Name, Street, City, ZIP each individually copyable), each row highlights on hover

\- \*\*Custom card:\*\* label + monospaced content block + copy button

\- `uses` counter increments on every copy, shown as "N uses" in card subtitle

\- Recently used: snippets with highest `uses` sort to top within their category

\- "New Snippet" → modal: choose type (Address / Custom), fill fields

\- Search input filters by label and content



\### Calculator

\- Floating draggable overlay (not a screen) — toggled by sidebar calc icon or Cmd+4

\- Appears over whatever screen is active — user can see context while calculating

\- Keyboard input works while open (digits, operators, Enter = equals, Escape = close)

\- History panel (toggle): shows last 12 calculations, click any to restore result to display

\- Close button (×) — hover turns red



\### Settings

\- \*\*Password:\*\* change master password (current + new + confirm)

\- \*\*Profiles:\*\* list all profiles with color dots, edit name/color, delete (with confirmation), "Add Profile" button

\- \*\*DeepL API key:\*\* masked input, save button calls `electronAPI.setApiKey('deepl', key)`, "Test" button makes a sample Write call to verify key works

\- \*\*Theme:\*\* dark/light toggle (dark is default)

\- \*\*Keyboard shortcuts:\*\* static cheat sheet table

\- \*\*Export:\*\* "Export all data (JSON)" — queries all Supabase tables for active profile, downloads as `anchor-export-{date}.json`

\- \*\*Supabase:\*\* connection status indicator (green dot / red dot)

\- \*\*Auto-launch:\*\* toggle OS startup (via electron-auto-launch package)

\- \*\*App lock timeout:\*\* dropdown (Never / 5 min / 15 min / 30 min / 1 hour)



\### Email + Email Triad (Placeholders)

\- Both are greyed-out sidebar icons with "Coming soon" tooltip on hover

\- Clicking shows a placeholder screen: icon, title, short description, a disabled "Connect" button

\- Email Triad placeholder stores a `emailTriadEndpoint` setting for future wiring



\### Command Palette (Cmd+K)

\- Centered modal overlay, search input focused on open

\- Results grouped: Bundles (opens bundle), Notes (opens note in editor), Snippets (copies to clipboard)

\- Keyboard navigation: arrow keys + Enter

\- Escape closes

\- `SearchService` maintains an in-memory index rebuilt on data changes



\---



\## QoL Features to Implement



\- \*\*System tray:\*\* tray icon, right-click menu: Show Anchor / Lock / Quit

\- \*\*Auto-launch on OS startup:\*\* `electron-auto-launch` package, toggle in Settings

\- \*\*Window position memory:\*\* save/restore `BrowserWindow` bounds via `electron-store`

\- \*\*App lock timeout:\*\* after N minutes of inactivity, show lock screen (password prompt), no full logout

\- \*\*Keyboard shortcut cheat sheet:\*\* press `?` anywhere (when not in a text field) to show overlay

\- \*\*Drag to reorder:\*\* CDK drag-drop on bundles list, links grid, folders

\- \*\*Link reachability:\*\* HEAD request with 3s timeout on bundle load, green/red dot on each link card

\- \*\*Add current URL from webview toolbar\*\*

\- \*\*Recently visited links:\*\* store last 10 opened links in local state, show in bundles sub-panel

\- \*\*Pin notes to top\*\*

\- \*\*Note tags + tag search\*\*

\- \*\*Word count display in note editor\*\*

\- \*\*Auto-save indicator\*\* (debounced 2s, "Saving…" → "Saved")

\- \*\*Note export:\*\* button in editor header → export as `.md` or `.pdf`

\- \*\*Note templates:\*\* "New from template" option (blank, meeting notes, daily log)

\- \*\*Snippet usage counter:\*\* increment on every copy, displayed in card

\- \*\*Recently used snippets:\*\* highest uses float to top

\- \*\*Multi-field address snippets:\*\* individual field copy + copy-all

\- \*\*Per-site zoom memory:\*\* store zoom level per domain in local state, restore on revisit

\- \*\*Webview page history:\*\* back/forward within session

\- \*\*Copy current URL button\*\* in webview toolbar

\- \*\*Import bookmarks:\*\* Settings → parse Chrome/Firefox HTML export, import as a new bundle

\- \*\*Full data backup + restore:\*\* JSON export/import in Settings

\- \*\*Onboarding wizard:\*\* first-launch flow: create account → name first profile → add first bundle



\---



\## Build Phases



Build in this order. Each phase produces something runnable.



\*\*Phase 1 — Skeleton\*\*

\- Electron + Angular wired, app launches

\- Supabase connected, auth working (login screen)

\- Sidebar shell with navigation, no content yet

\- CSS variables and global styles from mockup



\*\*Phase 2 — Core modules\*\*

\- Bundles: full CRUD, link cards, "Open All", embedded webview with toolbar

\- Snippets: full CRUD, multi-field addresses, copy to clipboard, usage counter



\*\*Phase 3 — Notes\*\*

\- Folder tree, note list, TipTap editor

\- Auto-save, word count, pin notes

\- Save-to-notes on text selection

\- DeepL Write integration (key from safeStorage)



\*\*Phase 4 — Polish\*\*

\- Floating calculator (draggable, keyboard input, history)

\- Command palette (Cmd+K)

\- All keyboard shortcuts

\- Toasts, drag-to-reorder, reachability dots

\- Profile switcher fully wired to data



\*\*Phase 5 — QoL + Integrations\*\*

\- System tray, auto-launch, app lock timeout, window position memory

\- Settings screen complete (all sections)

\- Import bookmarks, export data

\- Email + Email Triad placeholders

\- Onboarding wizard



\---



\## Key Technical Notes



1\. \*\*`<webview>` tag\*\* requires `webviewTag: true` in main process `BrowserWindow` — without this Angular will render an empty div with no error

2\. \*\*safeStorage\*\* is only available in the main process — API key reads/writes must go through IPC, never call safeStorage from the renderer

3\. \*\*TipTap content\*\* is stored as TipTap JSON (`editor.getJSON()`), not HTML — parse with `editor.commands.setContent(json)` on load

4\. \*\*DeepL Write endpoint:\*\* `POST https://api.deepl.com/v2/write` with header `Authorization: DeepL-Auth-Key {key}`, body `{ text: \[...], language: 'EN' }` — returns `improvements\[].improved\_text`

5\. \*\*Supabase RLS:\*\* all tables must have RLS enabled. Without it, any authenticated user can read all data. Policy pattern: `auth.uid() = (select user\_id from profiles where id = profile\_id)`

6\. \*\*Drag-to-reorder\*\* updates the `ord` column — use CDK drag-drop, write back the new order to Supabase after drop

7\. \*\*`<webview>` cross-origin text selection:\*\* JS in Angular cannot read selected text inside a `<webview>` — the "Save to Notes" floating button only appears for selections within Angular's own DOM

8\. \*\*Favicon fetching:\*\* use Google's favicon service `https://www.google.com/s2/favicons?domain={domain}\&sz=64` — store the URL string, not the image data

9\. \*\*Dev setup:\*\* use `concurrently` to run `ng serve` and `electron .` simultaneously — Electron loads `http://localhost:4200` in dev, `loadFile(dist/index.html)` in prod



\---



\## Environment Variables



```

\# src/environments/environment.ts

export const environment = {

&#x20; production: false,

&#x20; supabaseUrl: 'YOUR\_SUPABASE\_URL',

&#x20; supabaseAnonKey: 'YOUR\_SUPABASE\_ANON\_KEY',

};

```



DeepL API key is NOT in environment variables — it is stored on-device via Electron `safeStorage` and accessed through IPC.



\---



\## Mockup Reference



The `mockup/Anchor.html` file is a fully interactive React mockup of the app. Open it in a browser to see all screens, interactions, and the design system in action. Use it as the source of truth for:

\- Exact colors, spacing, and component shapes

\- Interaction patterns (hover states, active states, transitions)

\- Dummy data structure and realistic content

\- Calculator behaviour and floating overlay positioning

\- Profile switcher dropdown UX

\- Multi-field snippet card layout



Do not modify the mockup — it is reference only.


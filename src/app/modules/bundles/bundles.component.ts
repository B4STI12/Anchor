import {
  Component, inject, signal, HostListener,
  ViewChild, ElementRef, AfterViewChecked, OnInit,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BundleService, Bundle, Link } from '../../shared/services/bundle.service';
import { ToastService } from '../../shared/services/toast.service';
import { ElectronService } from '../../core/electron/electron.service';

type View = 'bundles' | 'webview';

const PRESET_COLORS = ['#2563eb','#22c55e','#f59e0b','#a855f7','#ec4899','#ef4444','#14b8a6','#f97316'];

@Component({
  selector: 'app-bundles',
  standalone: true,
  imports: [FormsModule],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
<!-- ───── Bundles view ───── -->
@if (view() === 'bundles') {
  <div class="root">

    <!-- Left panel: bundle list -->
    <div class="list-panel">
      <div class="list-header">
        <span class="list-label">Bundles</span>
        <button class="icon-btn" title="New bundle" (click)="openNewBundleModal()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <div class="list-items">
        @for (b of bundleService.bundles(); track b.id) {
          <button
            class="list-item"
            [class.active]="activeBundle()?.id === b.id"
            (click)="selectBundle(b)"
          >
            <span class="dot" [style.background]="b.color"></span>
            <span class="item-name">{{ b.name }}</span>
            @if (activeBundle()?.id === b.id) {
              <span class="item-count">{{ activeLinks().length }}</span>
            }
          </button>
        }
        @if (bundleService.bundles().length === 0 && !bundleService.loading()) {
          <div class="empty-list">No bundles yet</div>
        }
        @if (bundleService.loading()) {
          <div class="empty-list">Loading…</div>
        }
      </div>
    </div>

    <!-- Right panel: link grid -->
    <div class="content-panel">
      @if (activeBundle()) {
        <div class="content-header">
          <span class="dot-lg" [style.background]="activeBundle()!.color"></span>
          <h1 class="bundle-title">{{ activeBundle()!.name }}</h1>
          <span class="link-count">{{ activeLinks().length }} links</span>
          <div class="spacer"></div>
          <button class="icon-btn" title="Add link" (click)="openAddLinkModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button class="btn-primary" title="Open all links" (click)="openAll()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Open All
          </button>
        </div>
        @if (linksLoading()) {
          <div class="loading-state">Loading links…</div>
        } @else if (activeLinks().length === 0) {
          <div class="empty-links">
            <p>No links yet.</p>
            <button class="btn-primary" (click)="openAddLinkModal()">Add first link</button>
          </div>
        } @else {
          <div class="link-grid">
            @for (link of activeLinks(); track link.id) {
              <div class="link-card" (click)="openInWebview(link)" (contextmenu)="onContextMenu($event, link)">
                <span class="drag-handle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </span>
                <div class="favicon-wrap">
                  <img class="favicon" [src]="bundleService.faviconUrl(link.url)" [alt]="link.label"
                       onerror="this.style.display='none'" loading="lazy" />
                </div>
                <div class="link-info">
                  <div class="link-label">{{ link.label }}</div>
                  <div class="link-url">{{ link.url }}</div>
                </div>
                <span class="reach-dot"
                      [class.green]="reachability()[link.id] === true"
                      [class.red]="reachability()[link.id] === false"
                      [title]="reachability()[link.id] === true ? 'Reachable' : reachability()[link.id] === false ? 'Unreachable' : 'Checking…'">
                </span>
                <span class="external-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </span>
              </div>
            }
          </div>
        }
      } @else if (!bundleService.loading()) {
        <div class="empty-content">
          <div class="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 21 7.5 12 12 3 7.5z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 16.5 12 21l9-4.5"/></svg>
          </div>
          <h2>Create your first bundle</h2>
          <p>Bundles are collections of links you open together.</p>
          <button class="btn-primary" (click)="openNewBundleModal()">New Bundle</button>
        </div>
      }
    </div>

  </div>
}

<!-- ───── Webview view ───── -->
@if (view() === 'webview') {
  <div class="webview-root">
    <div class="webview-toolbar">
      <button class="nav-btn" title="Back to Bundles" (click)="closeWebview()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div class="nav-sep"></div>
      <button class="nav-btn" title="Back" (click)="wvBack()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
      </button>
      <button class="nav-btn" title="Forward" (click)="wvForward()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 5 7 7-7 7"/><path d="M5 12h14"/></svg>
      </button>
      <button class="nav-btn" title="Reload" (click)="wvReload()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
      </button>
      <div class="url-bar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span class="url-text">{{ currentUrl() }}</span>
      </div>
      <button class="nav-btn" title="Copy URL" (click)="copyUrl()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
      <button class="nav-btn" title="Open in system browser" (click)="openExternal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </button>
    </div>

    @if (wvLoading()) {
      <div class="wv-loadbar an-webload"></div>
    }

    @if (electronService.isElectron) {
      <webview #wv class="webview" [attr.src]="webviewSrc()"></webview>
    } @else {
      <div class="wv-fallback">
        <div class="wv-fallback-icon">
          <img [src]="bundleService.faviconUrl(webviewSrc())" [alt]="openedLink()?.label || ''"
               onerror="this.style.display='none'" style="width:64px;height:64px;border-radius:16px" />
        </div>
        <div class="wv-fallback-name">{{ openedLink()?.label }}</div>
        <div class="wv-fallback-url">{{ webviewSrc() }}</div>
        <div class="wv-fallback-note">Webview requires the Electron desktop app</div>
      </div>
    }
  </div>
}

<!-- ───── Context menu ───── -->
@if (contextMenu()) {
  <div class="context-menu" [style.left.px]="contextMenu()!.x" [style.top.px]="contextMenu()!.y" (click)="$event.stopPropagation()">
    <button class="ctx-item danger" (click)="deleteLink(contextMenu()!.link)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      Delete link
    </button>
  </div>
}

<!-- ───── New Bundle Modal ───── -->
@if (showNewBundleModal()) {
  <div class="modal-backdrop" (click)="showNewBundleModal.set(false)">
    <div class="modal" (click)="$event.stopPropagation()">
      <h3 class="modal-title">New Bundle</h3>
      <label class="field-label">Name</label>
      <input class="field-input" placeholder="e.g. Daily Dev" [(ngModel)]="newBundleName" (keydown.enter)="createBundle()" autofocus />
      <label class="field-label">Color</label>
      <div class="color-row">
        @for (c of presetColors; track c) {
          <button class="color-swatch" [style.background]="c"
                  [class.selected]="newBundleColor === c"
                  (click)="newBundleColor = c" [title]="c">
          </button>
        }
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" (click)="showNewBundleModal.set(false)">Cancel</button>
        <button class="btn-primary" (click)="createBundle()">Create Bundle</button>
      </div>
    </div>
  </div>
}

<!-- ───── Add Link Modal ───── -->
@if (showAddLinkModal()) {
  <div class="modal-backdrop" (click)="showAddLinkModal.set(false)">
    <div class="modal" (click)="$event.stopPropagation()">
      <h3 class="modal-title">Add Link</h3>
      <label class="field-label">Label</label>
      <input class="field-input" placeholder="e.g. GitHub" [(ngModel)]="newLinkLabel" />
      <label class="field-label">URL</label>
      <input class="field-input" placeholder="e.g. github.com" [(ngModel)]="newLinkUrl" (keydown.enter)="addLink()" />
      <div class="modal-actions">
        <button class="btn-secondary" (click)="showAddLinkModal.set(false)">Cancel</button>
        <button class="btn-primary" (click)="addLink()">Add Link</button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    /* ── Bundles layout ── */
    .root { display: flex; height: 100%; }

    .list-panel {
      width: 220px; flex-shrink: 0;
      border-right: 1px solid var(--border);
      background: var(--panel-2);
      display: flex; flex-direction: column;
      padding: 14px 10px;
    }
    .list-header {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 0 6px 10px;
    }
    .list-label {
      font-size: 11.5px; font-weight: 700; letter-spacing: .4px;
      text-transform: uppercase; color: var(--muted);
    }
    .icon-btn {
      width: 28px; height: 28px; border-radius: 7px;
      border: 1px solid var(--border); background: transparent;
      color: var(--muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .12s, color .12s;
    }
    .icon-btn:hover { background: var(--hover); color: var(--text); }

    .list-items { display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
    .list-item {
      display: flex; align-items: center; gap: 10px;
      width: 100%; padding: 9px 10px; border-radius: 9px;
      border: 1px solid transparent;
      background: transparent; color: var(--dim);
      cursor: pointer; text-align: left;
      font-size: 13.5px; font-weight: 500;
      transition: background .12s, color .12s, border-color .12s;
    }
    .list-item:hover { background: var(--hover); color: var(--text); }
    .list-item.active {
      border-color: rgba(37,99,235,.35);
      background: rgba(37,99,235,.14);
      color: var(--text);
    }
    .dot { width: 9px; height: 9px; border-radius: 99px; flex-shrink: 0; }
    .item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .item-count { font-size: 11.5px; color: var(--muted); font-variant-numeric: tabular-nums; }
    .empty-list { font-size: 12.5px; color: var(--muted); padding: 12px 6px; }

    /* ── Content panel ── */
    .content-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .content-header {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .dot-lg { width: 11px; height: 11px; border-radius: 99px; flex-shrink: 0; }
    .bundle-title { font-size: 17px; font-weight: 700; margin: 0; color: var(--text); white-space: nowrap; }
    .link-count { font-size: 12.5px; color: var(--muted); white-space: nowrap; }
    .spacer { flex: 1; }
    .btn-primary {
      display: flex; align-items: center; gap: 7px;
      height: 34px; padding: 0 15px; border-radius: 9px;
      border: 1px solid rgba(37,99,235,.5);
      background: linear-gradient(160deg,#1e3a8a,#1c326f);
      color: #eaf1ff; font-size: 13px; font-weight: 600;
      cursor: pointer; white-space: nowrap;
      box-shadow: 0 6px 16px rgba(30,58,138,.4);
      transition: opacity .12s;
    }
    .btn-primary:hover { opacity: .9; }

    .link-grid {
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
      overflow-y: auto;
      align-content: start;
    }
    .link-card {
      position: relative;
      display: flex; align-items: center; gap: 12px;
      padding: 13px 13px 13px 22px;
      border-radius: 12px; cursor: pointer;
      border: 1px solid var(--border);
      background: var(--panel);
      box-shadow: 0 1px 0 rgba(255,255,255,.02);
      transition: all .14s;
    }
    .link-card:hover {
      border-color: rgba(37,99,235,.45);
      background: linear-gradient(160deg,#1c2334,#171b27);
      box-shadow: 0 10px 26px rgba(0,0,0,.4);
      transform: translateY(-1px);
    }
    .drag-handle {
      position: absolute; left: 4px; top: 50%; transform: translateY(-50%);
      color: var(--muted); opacity: 0; cursor: grab;
      transition: opacity .12s;
    }
    .link-card:hover .drag-handle { opacity: .7; }
    .favicon-wrap { width: 34px; height: 34px; border-radius: 9px; overflow: hidden; flex-shrink: 0; background: var(--panel-2); display: flex; align-items: center; justify-content: center; }
    .favicon { width: 34px; height: 34px; object-fit: contain; }
    .link-info { min-width: 0; flex: 1; }
    .link-label { font-size: 13.5px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .link-url { font-size: 11.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
    .reach-dot {
      width: 7px; height: 7px; border-radius: 99px; flex-shrink: 0;
      background: var(--border); transition: background .3s;
    }
    .reach-dot.green { background: #22c55e; }
    .reach-dot.red   { background: #ef4444; }
    .external-icon { color: var(--muted); opacity: 0; transition: opacity .12s; }
    .link-card:hover .external-icon { opacity: 1; }

    .loading-state, .empty-links, .empty-content {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; gap: 14px; color: var(--muted);
      font-size: 14px; text-align: center;
    }
    .empty-icon {
      width: 68px; height: 68px; border-radius: 20px;
      background: rgba(37,99,235,.1); border: 1px solid rgba(37,99,235,.2);
      display: flex; align-items: center; justify-content: center;
    }
    .empty-content h2 { margin: 0; font-size: 20px; font-weight: 700; color: var(--text); }
    .empty-content p  { margin: 0; font-size: 14px; color: var(--muted); }

    /* ── Webview ── */
    .webview-root { display: flex; flex-direction: column; height: 100%; background: #0c0e14; }
    .webview-toolbar {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 14px; border-bottom: 1px solid var(--border);
      background: var(--panel); flex-shrink: 0;
    }
    .nav-sep { width: 1px; height: 20px; background: var(--border); margin: 0 2px; }
    .nav-btn {
      width: 32px; height: 32px; border-radius: 8px;
      border: none; background: transparent;
      color: var(--dim); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .12s, color .12s;
    }
    .nav-btn:hover { background: var(--hover); color: var(--text); }
    .url-bar {
      flex: 1; display: flex; align-items: center; gap: 9px;
      height: 34px; padding: 0 12px;
      background: var(--bg); border: 1px solid var(--border);
      border-radius: 9px; color: var(--muted);
    }
    .url-text { font-size: 13px; color: var(--dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .wv-loadbar {
      height: 2px; background: linear-gradient(90deg, transparent, var(--accent2), transparent);
      width: 40%; animation: an-webload 1.4s linear infinite;
    }
    webview { flex: 1; width: 100%; display: block; }

    .wv-fallback {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 16px;
      background: radial-gradient(120% 80% at 50% 0%, #11151f, #0a0c12);
      color: var(--muted);
    }
    .wv-fallback-name { font-size: 16px; font-weight: 600; color: var(--dim); }
    .wv-fallback-url  { font-size: 12.5px; font-family: var(--mono); color: var(--muted); }
    .wv-fallback-note { font-size: 11.5px; color: #3b4252; letter-spacing: .3px; }

    /* ── Context menu ── */
    .context-menu {
      position: fixed; z-index: 200;
      background: var(--panel); border: 1px solid var(--border);
      border-radius: 10px; padding: 5px;
      box-shadow: 0 16px 48px rgba(0,0,0,.55);
      min-width: 150px;
    }
    .ctx-item {
      display: flex; align-items: center; gap: 8px;
      width: 100%; padding: 8px 10px;
      border: none; border-radius: 7px;
      background: transparent; cursor: pointer;
      font-size: 13px; font-weight: 500; text-align: left;
      color: var(--text); transition: background .1s;
    }
    .ctx-item:hover { background: var(--hover); }
    .ctx-item.danger { color: #f87171; }
    .ctx-item.danger:hover { background: rgba(248,113,113,.1); }

    /* ── Modals ── */
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 300;
      background: rgba(0,0,0,.6);
      display: flex; align-items: center; justify-content: center;
    }
    .modal {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      width: 340px;
      box-shadow: 0 32px 80px rgba(0,0,0,.6);
    }
    .modal-title { margin: 0 0 20px; font-size: 16px; font-weight: 700; color: var(--text); }
    .field-label { display: block; font-size: 11.5px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .3px; margin-bottom: 6px; }
    .field-input {
      width: 100%; height: 36px; border-radius: 9px;
      border: 1px solid var(--border); background: var(--bg);
      color: var(--text); font-size: 14px; padding: 0 12px;
      outline: none; box-sizing: border-box;
      margin-bottom: 16px; transition: border-color .15s;
    }
    .field-input:focus { border-color: rgba(37,99,235,.5); }

    .color-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
    .color-swatch {
      width: 26px; height: 26px; border-radius: 99px;
      border: 2px solid transparent; cursor: pointer;
      transition: transform .12s, border-color .12s;
    }
    .color-swatch:hover { transform: scale(1.15); }
    .color-swatch.selected { border-color: white; transform: scale(1.1); }

    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .btn-secondary {
      height: 34px; padding: 0 15px; border-radius: 9px;
      border: 1px solid var(--border); background: transparent;
      color: var(--dim); font-size: 13px; font-weight: 600;
      cursor: pointer; transition: background .12s;
    }
    .btn-secondary:hover { background: var(--hover); }
  `],
})
export class BundlesComponent implements OnInit, AfterViewChecked {
  readonly bundleService = inject(BundleService);
  private readonly toast = inject(ToastService);
  readonly electronService = inject(ElectronService);

  // Layout state
  view = signal<View>('bundles');
  activeBundle = signal<Bundle | null>(null);
  activeLinks = signal<Link[]>([]);
  linksLoading = signal(false);

  // Webview state
  openedLink = signal<Link | null>(null);
  webviewSrc = signal('');
  currentUrl = signal('');
  wvLoading = signal(false);

  // Reachability: linkId → boolean | null (null=checking)
  reachability = signal<Record<string, boolean | null>>({});

  // Context menu
  contextMenu = signal<{ link: Link; x: number; y: number } | null>(null);

  // Modals
  showNewBundleModal = signal(false);
  showAddLinkModal = signal(false);

  // Form fields
  newBundleName = '';
  newBundleColor = '#2563eb';
  newLinkLabel = '';
  newLinkUrl = '';

  readonly presetColors = PRESET_COLORS;

  @ViewChild('wv') wvRef?: ElementRef;
  private wvListenersAdded = false;

  async ngOnInit(): Promise<void> {
    await this.bundleService.loadBundles();
    const bundles = this.bundleService.bundles();
    if (bundles.length > 0) await this.selectBundle(bundles[0]);
  }

  ngAfterViewChecked(): void {
    if (this.wvRef && !this.wvListenersAdded) {
      this.wvListenersAdded = true;
      const wv: any = this.wvRef.nativeElement;
      wv.addEventListener('did-navigate', (e: any) => this.currentUrl.set(e.url));
      wv.addEventListener('did-start-loading', () => this.wvLoading.set(true));
      wv.addEventListener('did-stop-loading', () => this.wvLoading.set(false));
    }
    if (!this.wvRef) this.wvListenersAdded = false;
  }

  async selectBundle(bundle: Bundle): Promise<void> {
    this.activeBundle.set(bundle);
    this.linksLoading.set(true);
    const links = await this.bundleService.loadLinks(bundle.id);
    this.activeLinks.set(links);
    this.linksLoading.set(false);
    this.reachability.set({});
    this.checkReachability(links);
  }

  private async checkReachability(links: Link[]): Promise<void> {
    for (const link of links) {
      const url = link.url.startsWith('http') ? link.url : 'https://' + link.url;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: ctrl.signal });
        clearTimeout(timer);
        this.reachability.update(r => ({ ...r, [link.id]: true }));
      } catch {
        this.reachability.update(r => ({ ...r, [link.id]: false }));
      }
    }
  }

  openInWebview(link: Link): void {
    const url = link.url.startsWith('http') ? link.url : 'https://' + link.url;
    this.openedLink.set(link);
    this.webviewSrc.set(url);
    this.currentUrl.set(url);
    this.wvLoading.set(true);
    this.wvListenersAdded = false;
    this.view.set('webview');
  }

  closeWebview(): void {
    this.view.set('bundles');
    this.openedLink.set(null);
    this.wvListenersAdded = false;
  }

  openAll(): void {
    const links = this.activeLinks();
    if (!links.length) return;
    this.openInWebview(links[0]);
    this.toast.show(`Opening ${links.length} link${links.length !== 1 ? 's' : ''}…`);
  }

  wvBack(): void    { (this.wvRef?.nativeElement as any)?.goBack?.(); }
  wvForward(): void { (this.wvRef?.nativeElement as any)?.goForward?.(); }
  wvReload(): void  { (this.wvRef?.nativeElement as any)?.reload?.(); }

  copyUrl(): void {
    navigator.clipboard.writeText(this.currentUrl())
      .then(() => this.toast.show('URL copied to clipboard'));
  }

  openExternal(): void { window.open(this.currentUrl(), '_blank'); }

  openNewBundleModal(): void {
    this.newBundleName = '';
    this.newBundleColor = '#2563eb';
    this.showNewBundleModal.set(true);
  }

  openAddLinkModal(): void {
    this.newLinkLabel = '';
    this.newLinkUrl = '';
    this.showAddLinkModal.set(true);
  }

  async createBundle(): Promise<void> {
    const name = this.newBundleName.trim();
    if (!name) return;
    const bundle = await this.bundleService.createBundle(name, this.newBundleColor);
    if (bundle) {
      this.showNewBundleModal.set(false);
      await this.selectBundle(bundle);
      this.toast.show(`Bundle "${bundle.name}" created`);
    }
  }

  async addLink(): Promise<void> {
    const bundleId = this.activeBundle()?.id;
    const label = this.newLinkLabel.trim();
    const url   = this.newLinkUrl.trim();
    if (!bundleId || !label || !url) return;
    const link = await this.bundleService.createLink(bundleId, label, url);
    if (link) {
      this.activeLinks.update(ls => [...ls, link]);
      this.showAddLinkModal.set(false);
      this.toast.show('Link added');
    }
  }

  onContextMenu(e: MouseEvent, link: Link): void {
    e.preventDefault();
    this.contextMenu.set({ link, x: e.clientX, y: e.clientY });
  }

  async deleteLink(link: Link): Promise<void> {
    await this.bundleService.deleteLink(link.id);
    this.activeLinks.update(ls => ls.filter(l => l.id !== link.id));
    this.contextMenu.set(null);
    this.toast.show('Link deleted');
  }

  @HostListener('document:click')
  closeContextMenu(): void { this.contextMenu.set(null); }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      if (this.view() === 'webview') { this.closeWebview(); return; }
      if (this.showNewBundleModal()) { this.showNewBundleModal.set(false); return; }
      if (this.showAddLinkModal())   { this.showAddLinkModal.set(false); }
    }
  }
}

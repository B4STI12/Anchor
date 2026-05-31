import { Component, inject, signal, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth/auth.service';
import { ProfileService, Profile } from '../shared/services/profile.service';
import { ElectronService } from '../core/electron/electron.service';
import { SupabaseService } from '../core/supabase/supabase.service';
import { ToastService } from '../shared/services/toast.service';
import { BundleService } from '../shared/services/bundle.service';
import { NoteService } from '../shared/services/note.service';
import { SnippetService } from '../shared/services/snippet.service';
import { EmailService } from '../shared/services/email.service';
import type { RuleRecord, TemplateRecord } from '../shared/services/email.service';

const COLORS = ['#2563eb','#22c55e','#f59e0b','#a855f7','#ec4899','#ef4444','#14b8a6','#f97316'];
const LOCK_OPTIONS = [
  { label: 'Never', value: 0 },
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  template: `
<div class="settings-wrap">

  <header class="settings-header">
    <h1>Settings</h1>
    <p>Manage your Anchor workspace</p>
  </header>

  <div class="settings-body">

    <!-- ── Password ── -->
    <section class="section">
      <h2>Password</h2>
      <div class="field-group">
        <input class="field-input" type="password" placeholder="Current password" [(ngModel)]="pwCurrent" />
        <input class="field-input" type="password" placeholder="New password" [(ngModel)]="pwNew" />
        <input class="field-input" type="password" placeholder="Confirm new password" [(ngModel)]="pwConfirm" />
      </div>
      <div class="error-msg" *ngIf="pwError()">{{ pwError() }}</div>
      <button class="btn-primary" (click)="changePassword()" [disabled]="pwSaving()">
        {{ pwSaving() ? 'Saving…' : 'Change Password' }}
      </button>
    </section>

    <!-- ── Profiles ── -->
    <section class="section">
      <h2>Profiles</h2>
      <div class="profiles-list">
        <div class="settings-profile-row" *ngFor="let p of profiles.profiles()">
          <span class="profile-dot" [style.background]="p.color"></span>
          <span class="profile-name" *ngIf="editingProfileId() !== p.id">{{ p.name }}</span>
          <input class="inline-edit" *ngIf="editingProfileId() === p.id" [(ngModel)]="editingName"
                 (keydown.enter)="saveProfileEdit(p)" (keydown.escape)="editingProfileId.set(null)" />
          <div class="profile-actions">
            <button class="icon-btn" title="Edit" (click)="startEdit(p)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="icon-btn danger" title="Delete" (click)="deleteProfile(p)"
                    [disabled]="profiles.profiles().length <= 1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>
      <button class="btn-secondary" (click)="showAddProfile.set(true)">+ Add Profile</button>
    </section>

    <!-- ── DeepL API key ── -->
    <section class="section">
      <h2>DeepL Integration</h2>
      <div class="row-inline">
        <input class="field-input flex1" type="password" placeholder="DeepL API key" [(ngModel)]="deeplKey" />
        <button class="btn-secondary" (click)="saveDeepL()">Save</button>
        <button class="btn-secondary" (click)="testDeepL()">Test</button>
      </div>
      <p class="note" *ngIf="deeplStatus()">{{ deeplStatus() }}</p>
    </section>

    <!-- ── Supabase status ── -->
    <section class="section">
      <h2>Connection</h2>
      <div class="status-row">
        <span class="supabase-status" [class.connected]="supabaseOk()">
          {{ supabaseOk() ? '● Connected to Supabase' : '● Disconnected' }}
        </span>
      </div>
    </section>

    <!-- ── App lock timeout ── -->
    <section class="section">
      <h2>App Lock</h2>
      <div class="field-row">
        <span class="label">Timeout</span>
        <select class="lock-timeout-select" [(ngModel)]="lockTimeout" (ngModelChange)="onLockTimeoutChange($event)">
          <option *ngFor="let o of lockOptions" [value]="o.value">{{ o.label }}</option>
        </select>
      </div>
    </section>

    <!-- ── Auto-launch ── -->
    <section class="section">
      <h2>Startup</h2>
      <div class="field-row">
        <span class="label flex1">Launch at login</span>
        <label class="toggle">
          <input type="checkbox" [(ngModel)]="autoLaunch" (ngModelChange)="onAutoLaunchChange($event)" />
          <span class="toggle-track"></span>
        </label>
      </div>
      <p class="note" *ngIf="!electron.isElectron">Not available in browser mode</p>
    </section>

    <!-- ── Keyboard shortcuts ── -->
    <section class="section">
      <h2>Keyboard Shortcuts</h2>
      <table class="shortcuts-table">
        <tbody>
          <tr><td class="kbd-cell"><kbd>⌘K</kbd></td><td>Open command palette</td></tr>
          <tr><td class="kbd-cell"><kbd>⌘1</kbd></td><td>Go to Bundles</td></tr>
          <tr><td class="kbd-cell"><kbd>⌘2</kbd></td><td>Go to Notes</td></tr>
          <tr><td class="kbd-cell"><kbd>⌘3</kbd></td><td>Go to Snippets</td></tr>
          <tr><td class="kbd-cell"><kbd>⌘4</kbd></td><td>Toggle Calculator</td></tr>
          <tr><td class="kbd-cell"><kbd>⌘,</kbd></td><td>Open Settings</td></tr>
          <tr><td class="kbd-cell"><kbd>⌘N</kbd></td><td>New note (in Notes)</td></tr>
          <tr><td class="kbd-cell"><kbd>Esc</kbd></td><td>Close overlay / back</td></tr>
          <tr><td class="kbd-cell"><kbd>?</kbd></td><td>Show this cheat sheet</td></tr>
        </tbody>
      </table>
    </section>

    <!-- ── Data ── -->
    <section class="section">
      <h2>Data</h2>
      <div class="row-inline">
        <button class="btn-secondary" (click)="exportData()">Export all data (JSON)</button>
        <label class="btn-secondary file-btn">
          Import bookmarks (HTML)
          <input type="file" accept=".html" (change)="importBookmarks($event)" style="display:none" />
        </label>
      </div>
      <p class="note" *ngIf="importStatus()">{{ importStatus() }}</p>
    </section>

    <!-- ── Theme ── -->
    <section class="section">
      <h2>Theme</h2>
      <div class="field-row">
        <span class="label flex1">Light mode</span>
        <label class="toggle">
          <input type="checkbox" [(ngModel)]="lightMode" (ngModelChange)="onThemeChange($event)" />
          <span class="toggle-track"></span>
        </label>
      </div>
    </section>

    <!-- ── Email ── -->
    <section class="section">
      <h2>Email</h2>

      <div class="field-row">
        <span class="label">Sync</span>
        <select class="lock-timeout-select" [(ngModel)]="emailSyncFreq" (ngModelChange)="saveEmailSyncFreq($event)">
          <option value="1m">Every 1 min</option>
          <option value="5m">Every 5 min</option>
          <option value="15m">Every 15 min</option>
          <option value="manual">Manual only</option>
        </select>
        <button class="btn-secondary" (click)="emailSyncNow()" [disabled]="emailSyncing()">
          {{ emailSyncing() ? 'Syncing…' : 'Sync Now' }}
        </button>
      </div>

      <div class="subsection-label">OAuth Credentials</div>
      <div class="cred-grid">
        <span class="cred-key">Gmail Client ID</span>
        <input class="field-input" placeholder="….apps.googleusercontent.com" [(ngModel)]="gmailClientId" />
        <span class="cred-key">Gmail Client Secret</span>
        <input class="field-input" type="password" placeholder="GOCSPX-…" [(ngModel)]="gmailClientSecret" />
        <span class="cred-key">Outlook Client ID</span>
        <input class="field-input" placeholder="xxxxxxxx-xxxx-…" [(ngModel)]="outlookClientId" />
        <span class="cred-key">Outlook Client Secret</span>
        <input class="field-input" type="password" [(ngModel)]="outlookClientSecret" />
      </div>
      <button class="btn-primary" (click)="saveEmailCreds()" [disabled]="emailCredsSaving()">
        {{ emailCredsSaving() ? 'Saving…' : 'Save Credentials' }}
      </button>

      <div class="subsection-label" style="margin-top:12px">Filter Rules</div>
      <div class="rule-list">
        @for (r of emailRules(); track r.id) {
          <div class="rule-row">
            <span class="rule-pattern">{{ r.pattern }}</span>
            <span class="rule-cat" [style.color]="catColor(r.category)">{{ r.category }}</span>
            <button class="icon-btn danger" (click)="removeRule(r.id)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        }
        @if (emailRules().length === 0) {
          <p class="note">No rules yet. Emails matching a rule pattern are auto-categorized.</p>
        }
      </div>
      <div class="row-inline" style="margin-top:6px">
        <input class="field-input" placeholder="Pattern (e.g. @newsletter.com)" [(ngModel)]="newRulePattern" style="flex:1" />
        <select class="lock-timeout-select" [(ngModel)]="newRuleCategory">
          <option value="newsletter">Newsletter</option>
          <option value="spam">Spam</option>
          <option value="important">Important</option>
          <option value="receipt">Receipt</option>
          <option value="other">Other</option>
        </select>
        <button class="btn-secondary" (click)="addRule()">Add</button>
      </div>

      <div class="subsection-label" style="margin-top:12px">Compose Templates</div>
      <div class="rule-list">
        @for (t of emailTemplates(); track t.id) {
          <div class="rule-row">
            <span class="rule-pattern">{{ t.name }}</span>
            <button class="icon-btn danger" (click)="removeTemplate(t.id)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        }
        @if (emailTemplates().length === 0) {
          <p class="note">No templates yet.</p>
        }
      </div>
      <div class="field-group" style="margin-top:6px">
        <input class="field-input" placeholder="Template name" [(ngModel)]="newTemplateName" />
        <textarea class="field-textarea" placeholder="Template body…" [(ngModel)]="newTemplateBody" rows="3"></textarea>
        <button class="btn-secondary" (click)="addTemplate()">Add Template</button>
      </div>

      <p class="note" *ngIf="emailStatus()">{{ emailStatus() }}</p>
    </section>

    <!-- ── Account ── -->
    <section class="section">
      <h2>Account</h2>
      <div class="field-row">
        <span class="label">Email</span>
        <span class="value">{{ auth.user?.email ?? '—' }}</span>
      </div>
      <div class="field-row">
        <span class="label">Version</span>
        <span class="value mono">0.1.0</span>
      </div>
      <button class="btn-danger" (click)="auth.signOut()">Sign out</button>
    </section>

  </div>
</div>

<!-- ── Add Profile modal ── -->
<div class="modal-backdrop" *ngIf="showAddProfile()" (click)="showAddProfile.set(false)">
  <div class="modal" (click)="$event.stopPropagation()">
    <h3 class="modal-title">Add Profile</h3>
    <label class="field-label">Name</label>
    <input class="field-input" placeholder="e.g. Work" [(ngModel)]="newProfileName" />
    <label class="field-label">Color</label>
    <div class="color-row">
      <button *ngFor="let c of colors" class="color-swatch"
              [style.background]="c" [class.selected]="newProfileColor === c"
              (click)="newProfileColor = c"></button>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" (click)="showAddProfile.set(false)">Cancel</button>
      <button class="btn-primary" (click)="addProfile()">Create</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    .settings-wrap { display: flex; flex-direction: column; height: 100%; overflow-y: auto; }

    .settings-header {
      padding: 24px 32px 18px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    h1 { margin: 0 0 4px; font-size: 20px; font-weight: 700; color: var(--text); }
    .settings-header p { margin: 0; font-size: 13.5px; color: var(--muted); }

    .settings-body { padding: 24px 32px; display: flex; flex-direction: column; gap: 28px; max-width: 580px; }

    .section { display: flex; flex-direction: column; gap: 12px; }
    h2 { margin: 0; font-size: 11.5px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; }

    .field-group { display: flex; flex-direction: column; gap: 8px; }
    .field-input {
      height: 36px; padding: 0 12px; border-radius: 8px;
      border: 1px solid var(--border); background: var(--bg);
      color: var(--text); font-size: 13.5px; outline: none;
      transition: border-color .15s; box-sizing: border-box; width: 100%;
    }
    .field-input:focus { border-color: rgba(37,99,235,.5); }
    .field-input.flex1 { flex: 1; }

    .field-row { display: flex; align-items: center; gap: 12px; }
    .label { font-size: 13.5px; color: var(--dim); width: 70px; flex-shrink: 0; }
    .value { font-size: 13.5px; color: var(--text); }
    .value.mono { font-family: var(--mono); }

    .row-inline { display: flex; align-items: center; gap: 8px; }

    .error-msg { font-size: 12.5px; color: #f87171; }
    .note { margin: 0; font-size: 12.5px; color: var(--muted); }

    .btn-primary {
      align-self: flex-start; height: 34px; padding: 0 16px; border-radius: 8px;
      border: 1px solid rgba(37,99,235,.5);
      background: linear-gradient(160deg,#1e3a8a,#1c326f);
      color: #eaf1ff; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: opacity .12s;
    }
    .btn-primary:hover:not(:disabled) { opacity: .88; }
    .btn-primary:disabled { opacity: .45; cursor: not-allowed; }

    .btn-secondary {
      align-self: flex-start; height: 34px; padding: 0 14px; border-radius: 8px;
      border: 1px solid var(--border); background: transparent;
      color: var(--dim); font-size: 13px; font-weight: 500;
      cursor: pointer; white-space: nowrap; transition: background .12s, color .12s;
    }
    .btn-secondary:hover { background: var(--hover); color: var(--text); }
    .file-btn { cursor: pointer; }

    .btn-danger {
      align-self: flex-start; height: 34px; padding: 0 14px; border-radius: 8px;
      background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3);
      color: #f87171; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: background .15s;
    }
    .btn-danger:hover { background: rgba(239,68,68,.2); }

    /* Profiles */
    .profiles-list { display: flex; flex-direction: column; gap: 4px; }
    .settings-profile-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 9px;
      border: 1px solid var(--border); background: var(--panel-2);
    }
    .profile-dot { width: 10px; height: 10px; border-radius: 99px; flex-shrink: 0; }
    .profile-name { flex: 1; font-size: 13.5px; font-weight: 500; color: var(--text); }
    .profile-actions { display: flex; gap: 4px; margin-left: auto; }
    .icon-btn {
      width: 26px; height: 26px; border-radius: 6px; border: none;
      background: transparent; color: var(--muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .1s, color .1s;
    }
    .icon-btn:hover { background: var(--hover); color: var(--text); }
    .icon-btn.danger:hover { color: #f87171; background: rgba(248,113,113,.1); }
    .icon-btn:disabled { opacity: .3; cursor: default; }
    .inline-edit {
      flex: 1; height: 28px; padding: 0 8px; border-radius: 6px;
      border: 1px solid var(--accent); background: var(--bg);
      color: var(--text); font-size: 13px; outline: none;
    }

    /* Supabase status */
    .status-row { display: flex; align-items: center; gap: 10px; }
    .supabase-status { font-size: 13.5px; color: #f87171; font-weight: 500; }
    .supabase-status.connected { color: #4ade80; }

    /* Toggle switch */
    .flex1 { flex: 1; }
    .toggle { display: flex; align-items: center; cursor: pointer; }
    .toggle input { display: none; }
    .toggle-track {
      width: 36px; height: 20px; border-radius: 10px;
      background: var(--border); position: relative;
      transition: background .2s;
    }
    .toggle-track::after {
      content: ''; position: absolute; top: 3px; left: 3px;
      width: 14px; height: 14px; border-radius: 99px;
      background: var(--dim); transition: transform .2s, background .2s;
    }
    .toggle input:checked + .toggle-track { background: var(--accent); }
    .toggle input:checked + .toggle-track::after { transform: translateX(16px); background: #fff; }

    /* App lock */
    .lock-timeout-select {
      height: 34px; padding: 0 10px; border-radius: 8px;
      border: 1px solid var(--border); background: var(--panel-2);
      color: var(--text); font-size: 13.5px; outline: none; cursor: pointer;
    }

    /* Shortcuts table */
    .shortcuts-table { border-collapse: collapse; width: 100%; }
    .shortcuts-table tr { border-bottom: 1px solid var(--border); }
    .shortcuts-table td { padding: 7px 10px; font-size: 13px; color: var(--dim); }
    .kbd-cell { width: 90px; }
    kbd {
      font-family: var(--mono); font-size: 12px; font-weight: 600;
      background: var(--panel-2); border: 1px solid var(--border);
      border-radius: 5px; padding: 2px 7px; color: var(--accent2);
    }

    /* Email settings */
    .subsection-label {
      font-size: 11px; font-weight: 600; color: var(--muted);
      text-transform: uppercase; letter-spacing: .35px; margin-bottom: 6px;
    }
    .cred-grid { display: grid; grid-template-columns: 140px 1fr; gap: 8px 12px; align-items: center; margin-bottom: 10px; }
    .cred-key { font-size: 12.5px; color: var(--dim); }
    .rule-list { display: flex; flex-direction: column; gap: 4px; }
    .rule-row {
      display: flex; align-items: center; gap: 8px; padding: 6px 8px;
      border: 1px solid var(--border); border-radius: 7px; background: var(--panel-2);
    }
    .rule-pattern { flex: 1; font-size: 12.5px; font-family: var(--mono); color: var(--text); }
    .rule-cat { font-size: 11.5px; font-weight: 600; }
    .field-textarea {
      width: 100%; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg); color: var(--text); font-size: 13px;
      padding: 8px 12px; outline: none; resize: vertical; font-family: inherit;
    }
    .field-textarea:focus { border-color: rgba(37,99,235,.5); }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 300;
      background: rgba(0,0,0,.6);
      display: flex; align-items: center; justify-content: center;
    }
    .modal {
      background: var(--panel); border: 1px solid var(--border);
      border-radius: 16px; padding: 24px; width: 340px;
      box-shadow: 0 32px 80px rgba(0,0,0,.6);
      display: flex; flex-direction: column; gap: 12px;
    }
    .modal-title { margin: 0; font-size: 16px; font-weight: 700; color: var(--text); }
    .field-label { font-size: 11.5px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .3px; }
    .color-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .color-swatch {
      width: 26px; height: 26px; border-radius: 99px;
      border: 2px solid transparent; cursor: pointer; transition: transform .12s;
    }
    .color-swatch:hover { transform: scale(1.12); }
    .color-swatch.selected { border-color: #fff; transform: scale(1.08); }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
  `],
})
export class SettingsComponent implements OnInit {
  auth    = inject(AuthService);
  profiles = inject(ProfileService);
  electron = inject(ElectronService);
  private db       = inject(SupabaseService);
  private toast    = inject(ToastService);
  private bundles  = inject(BundleService);
  private notes    = inject(NoteService);
  private snippets = inject(SnippetService);
  private emailSvc = inject(EmailService);

  // Password
  pwCurrent = ''; pwNew = ''; pwConfirm = '';
  pwSaving = signal(false);
  pwError  = signal<string | null>(null);

  // Profiles
  showAddProfile  = signal(false);
  newProfileName  = '';
  newProfileColor = '#2563eb';
  editingProfileId = signal<string | null>(null);
  editingName = '';

  // DeepL
  deeplKey    = '';
  deeplStatus = signal<string | null>(null);

  // Supabase status
  supabaseOk = signal(false);

  // Import status
  importStatus = signal<string | null>(null);

  // App lock
  lockTimeout = parseInt(localStorage.getItem('lockTimeout') ?? '0', 10);
  readonly lockOptions = LOCK_OPTIONS;
  readonly colors = COLORS;

  // Auto-launch
  autoLaunch = false;

  // Theme
  lightMode = localStorage.getItem('theme') === 'light';

  // Email settings
  emailSyncFreq = '5m';
  emailSyncing = signal(false);
  emailCredsSaving = signal(false);
  emailStatus = signal<string | null>(null);
  gmailClientId = '';
  gmailClientSecret = '';
  outlookClientId = '';
  outlookClientSecret = '';
  emailRules = signal<RuleRecord[]>([]);
  emailTemplates = signal<TemplateRecord[]>([]);
  newRulePattern = '';
  newRuleCategory = 'newsletter';
  newTemplateName = '';
  newTemplateBody = '';

  async ngOnInit(): Promise<void> {
    // Load DeepL key from OS keychain
    const key = await this.electron.getApiKey('deepl');
    if (key) this.deeplKey = key;
    // Supabase connection check
    const { error } = await this.db.client.from('profiles').select('id').limit(1);
    this.supabaseOk.set(!error);
    // Auto-launch state
    this.autoLaunch = await this.electron.getAutoLaunch();
    // Email settings
    this.emailSyncFreq = await this.emailSvc.settingsGetSyncFreq();
    const creds = await this.emailSvc.settingsGetOauthCreds();
    if (creds) {
      this.gmailClientId = creds.gmailClientId || '';
      this.gmailClientSecret = creds.gmailClientSecret || '';
      this.outlookClientId = creds.outlookClientId || '';
      this.outlookClientSecret = creds.outlookClientSecret || '';
    }
    this.emailRules.set(await this.emailSvc.rulesList());
    this.emailTemplates.set(await this.emailSvc.templatesList());
  }

  // ── Password ─────────────────────────────────────────────────────────────

  async changePassword(): Promise<void> {
    this.pwError.set(null);
    if (!this.pwNew || this.pwNew !== this.pwConfirm) {
      this.pwError.set('New passwords do not match.');
      return;
    }
    if (this.pwNew.length < 6) {
      this.pwError.set('Password must be at least 6 characters.');
      return;
    }
    this.pwSaving.set(true);
    const err = await this.auth.changePassword(this.pwNew);
    this.pwSaving.set(false);
    if (err) { this.pwError.set(err); return; }
    this.pwCurrent = ''; this.pwNew = ''; this.pwConfirm = '';
    this.toast.show('Password changed successfully');
  }

  // ── Profiles ─────────────────────────────────────────────────────────────

  async addProfile(): Promise<void> {
    const name = this.newProfileName.trim();
    if (!name) return;
    await this.profiles.createProfile(name, this.newProfileColor);
    this.showAddProfile.set(false);
    this.newProfileName = '';
    this.newProfileColor = '#2563eb';
    this.toast.show(`Profile "${name}" created`);
  }

  startEdit(p: Profile): void {
    this.editingProfileId.set(p.id);
    this.editingName = p.name;
  }

  async saveProfileEdit(p: Profile): Promise<void> {
    const name = this.editingName.trim();
    if (name && name !== p.name) {
      await this.profiles.updateProfile(p.id, { name });
      this.toast.show('Profile renamed');
    }
    this.editingProfileId.set(null);
  }

  async deleteProfile(p: Profile): Promise<void> {
    if (!confirm(`Delete profile "${p.name}"? This cannot be undone.`)) return;
    await this.profiles.deleteProfile(p.id);
    this.toast.show(`Profile "${p.name}" deleted`);
  }

  // ── DeepL ─────────────────────────────────────────────────────────────────

  async saveDeepL(): Promise<void> {
    await this.electron.setApiKey('deepl', this.deeplKey);
    this.toast.show('DeepL API key saved');
  }

  async testDeepL(): Promise<void> {
    this.deeplStatus.set('Testing…');
    try {
      const base = this.deeplKey.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
      const res = await fetch(`${base}/v2/translate`, {
        method: 'POST',
        headers: { Authorization: `DeepL-Auth-Key ${this.deeplKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ['Hello'], target_lang: 'DE' }),
      });
      this.deeplStatus.set(res.ok ? '✓ Key is valid' : `✗ Error ${res.status}`);
    } catch {
      this.deeplStatus.set('✗ Request failed');
    }
  }

  // ── App lock ──────────────────────────────────────────────────────────────

  onLockTimeoutChange(minutes: number): void {
    localStorage.setItem('lockTimeout', String(minutes));
  }

  // ── Auto-launch ───────────────────────────────────────────────────────────

  async onAutoLaunchChange(enable: boolean): Promise<void> {
    await this.electron.setAutoLaunch(enable);
    this.toast.show(enable ? 'Anchor will launch at login' : 'Auto-launch disabled');
  }

  // ── Theme ────────────────────────────────────────────────────────────────

  onThemeChange(light: boolean): void {
    localStorage.setItem('theme', light ? 'light' : 'dark');
    document.documentElement.classList.toggle('light', light);
  }

  // ── Email settings ────────────────────────────────────────────────────────

  async saveEmailSyncFreq(v: string): Promise<void> {
    await this.emailSvc.settingsSetSyncFreq(v);
    this.toast.show('Sync frequency saved');
  }

  async emailSyncNow(): Promise<void> {
    this.emailSyncing.set(true);
    await this.emailSvc.syncNow();
    this.emailSyncing.set(false);
    this.toast.show('Sync complete');
  }

  async saveEmailCreds(): Promise<void> {
    this.emailCredsSaving.set(true);
    await this.emailSvc.settingsSetOauthCreds({
      gmailClientId: this.gmailClientId,
      gmailClientSecret: this.gmailClientSecret,
      outlookClientId: this.outlookClientId,
      outlookClientSecret: this.outlookClientSecret,
    });
    this.emailCredsSaving.set(false);
    this.toast.show('Email credentials saved');
  }

  async addRule(): Promise<void> {
    const pattern = this.newRulePattern.trim();
    if (!pattern) return;
    await this.emailSvc.rulesAdd(pattern, this.newRuleCategory);
    this.emailRules.set(await this.emailSvc.rulesList());
    this.newRulePattern = '';
  }

  async removeRule(id: number): Promise<void> {
    await this.emailSvc.rulesRemove(id);
    this.emailRules.set(await this.emailSvc.rulesList());
  }

  async addTemplate(): Promise<void> {
    const name = this.newTemplateName.trim();
    const body = this.newTemplateBody.trim();
    if (!name || !body) return;
    await this.emailSvc.templatesAdd(name, body);
    this.emailTemplates.set(await this.emailSvc.templatesList());
    this.newTemplateName = '';
    this.newTemplateBody = '';
  }

  async removeTemplate(id: number): Promise<void> {
    await this.emailSvc.templatesRemove(id);
    this.emailTemplates.set(await this.emailSvc.templatesList());
  }

  catColor(category: string): string {
    const map: Record<string, string> = {
      newsletter: '#F59E0B', spam: '#EF4444', important: '#3B82F6',
      receipt: '#22C55E', other: '#6b7488',
    };
    return map[category] ?? '#6b7488';
  }

  // ── Import Bookmarks ─────────────────────────────────────────────────────

  async importBookmarks(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const html = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const anchors = Array.from(doc.querySelectorAll('a[href]')) as HTMLAnchorElement[];

    if (anchors.length === 0) {
      this.importStatus.set('No bookmarks found in file.');
      return;
    }

    this.importStatus.set(`Importing ${anchors.length} bookmark(s)…`);

    const bundleName = `Imported ${new Date().toLocaleDateString()}`;
    const bundle = await this.bundles.createBundle(bundleName, '#6b7488');
    if (!bundle) { this.importStatus.set('Failed to create bundle.'); return; }

    let count = 0;
    for (const a of anchors) {
      const url = a.href;
      const label = a.textContent?.trim() || url;
      if (!url.startsWith('http')) continue;
      await this.bundles.createLink(bundle.id, label, url);
      count++;
    }

    input.value = '';
    this.importStatus.set(`Imported ${count} links into "${bundleName}".`);
    this.toast.show(`Imported ${count} bookmarks`);
  }

  // ── Export ────────────────────────────────────────────────────────────────

  async exportData(): Promise<void> {
    const profileId = this.profiles.active().id;
    const [bRes, lRes, fRes, nRes, sRes] = await Promise.all([
      this.db.client.from('bundles').select('*').eq('profile_id', profileId),
      this.db.client.from('links').select('*'),
      this.db.client.from('folders').select('*').eq('profile_id', profileId),
      this.db.client.from('notes').select('*').eq('profile_id', profileId),
      this.db.client.from('snippets').select('*').eq('profile_id', profileId),
    ]);
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: this.profiles.active(),
      bundles: bRes.data ?? [],
      links: lRes.data ?? [],
      folders: fRes.data ?? [],
      notes: nRes.data ?? [],
      snippets: sRes.data ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `anchor-export-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.show('Data exported');
  }
}

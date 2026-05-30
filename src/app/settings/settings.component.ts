import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <div class="settings-wrap">
      <header class="settings-header">
        <h1>Settings</h1>
        <p>Manage your Anchor workspace</p>
      </header>

      <div class="settings-body">
        <section class="section">
          <h2>Account</h2>
          <div class="field-row">
            <span class="label">Status</span>
            <span class="value connected">● Connected</span>
          </div>
          <div class="field-row">
            <span class="label">Email</span>
            <span class="value">{{ auth.user?.email ?? '—' }}</span>
          </div>
          <button class="btn-danger" (click)="auth.signOut()">Sign out</button>
        </section>

        <section class="section">
          <h2>About</h2>
          <div class="field-row">
            <span class="label">Version</span>
            <span class="value mono">0.0.1-phase1</span>
          </div>
          <p class="note">Phase 2–5 features will be added in upcoming releases.</p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .settings-wrap {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
    }
    .settings-header {
      padding: 28px 32px 0;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
    }
    h1 { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
    .settings-header p { margin: 0; font-size: 13.5px; color: var(--muted); }
    .settings-body { padding: 24px 32px; display: flex; flex-direction: column; gap: 32px; max-width: 560px; }
    .section { display: flex; flex-direction: column; gap: 14px; }
    h2 { margin: 0; font-size: 13px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; }
    .field-row { display: flex; align-items: center; gap: 12px; }
    .label { font-size: 13.5px; color: var(--dim); width: 80px; flex-shrink: 0; }
    .value { font-size: 13.5px; color: var(--text); }
    .value.mono { font-family: var(--mono); }
    .connected { color: #4ade80; }
    .btn-danger {
      align-self: flex-start;
      padding: 8px 16px;
      background: rgba(239,68,68,.1);
      border: 1px solid rgba(239,68,68,.3);
      color: #f87171;
      border-radius: var(--radius-sm);
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: background .15s;
    }
    .btn-danger:hover { background: rgba(239,68,68,.2); }
    .note { margin: 0; font-size: 12.5px; color: var(--muted); }
  `],
})
export class SettingsComponent {
  auth = inject(AuthService);
}

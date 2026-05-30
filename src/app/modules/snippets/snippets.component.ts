import { Component } from '@angular/core';

@Component({
  selector: 'app-snippets',
  standalone: true,
  template: `
    <div class="placeholder">
      <div class="icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m9 8-4 4 4 4"/><path d="m15 8 4 4-4 4"/>
        </svg>
      </div>
      <h2>Snippets</h2>
      <p>Addresses, custom fields, and clipboard snippets.</p>
      <span class="phase">Phase 2</span>
    </div>
  `,
  styles: [`
    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 14px;
      color: var(--text);
    }
    .icon {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: rgba(37,99,235,.1);
      border: 1px solid rgba(37,99,235,.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    h2 { margin: 0; font-size: 22px; font-weight: 700; }
    p  { margin: 0; font-size: 14px; color: var(--muted); }
    .phase {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .4px;
      text-transform: uppercase;
      color: var(--muted);
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 4px 10px;
    }
  `],
})
export class SnippetsComponent {}

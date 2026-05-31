import { Component } from '@angular/core';

@Component({
  selector: 'app-email-triad',
  standalone: true,
  template: `
    <div class="placeholder-screen">
      <div class="placeholder-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="8" height="7" rx="1.5"/>
          <rect x="13" y="4" width="8" height="7" rx="1.5"/>
          <rect x="8" y="14" width="8" height="6" rx="1.5"/>
        </svg>
      </div>
      <h2 class="placeholder-title">Email Triad</h2>
      <p class="placeholder-desc">A smart three-pane email workflow. Wire up your endpoint to get started.</p>
      <button class="btn-connect" disabled>Connect</button>
    </div>
  `,
  styles: [`
    .placeholder-screen {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 18px;
      color: var(--dim);
    }
    .placeholder-icon {
      width: 96px;
      height: 96px;
      border-radius: 24px;
      background: var(--panel);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .placeholder-title { font-size: 22px; font-weight: 700; color: var(--text); margin: 0; }
    .placeholder-desc { font-size: 14px; color: var(--muted); margin: 0; max-width: 320px; text-align: center; line-height: 1.6; }
    .btn-connect {
      padding: 9px 22px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--muted);
      font-size: 13px;
      font-weight: 500;
      cursor: not-allowed;
      opacity: 0.5;
    }
  `],
})
export class EmailTriadComponent {}

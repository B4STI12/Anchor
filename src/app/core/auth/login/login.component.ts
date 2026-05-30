import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  template: `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-logo">
          <div class="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3 21 7.5 12 12 3 7.5z"/>
              <path d="M3 12.5 12 17l9-4.5"/>
              <path d="M3 16.5 12 21l9-4.5"/>
            </svg>
          </div>
          <span class="logo-name">Anchor</span>
        </div>

        <h1 class="login-title">Sign in to your workspace</h1>
        <p class="login-sub">Enter your credentials to access Anchor</p>

        <form (ngSubmit)="submit()" class="login-form">
          <div class="field">
            <label class="label">Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              class="input"
              placeholder="you@example.com"
              autocomplete="email"
              required
            />
          </div>

          <div class="field">
            <label class="label">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              class="input"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
          </div>

          <div class="error" *ngIf="error()">{{ error() }}</div>

          <button type="submit" class="btn-primary" [disabled]="loading()">
            <span *ngIf="!loading()">Sign in</span>
            <span *ngIf="loading()">Signing in…</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(120% 120% at 50% 0%, #0c1018, #05070c 70%);
      padding: 24px;
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 36px 32px;
      box-shadow: 0 40px 100px rgba(0,0,0,.6);
      animation: appIn .3s ease;
    }
    .login-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
    }
    .logo-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(37,99,235,.15);
      border: 1px solid rgba(37,99,235,.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-name {
      font-size: 20px;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -.02em;
    }
    .login-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 6px;
      letter-spacing: -.01em;
    }
    .login-sub {
      font-size: 13.5px;
      color: var(--muted);
      margin: 0 0 28px;
    }
    .login-form { display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .label { font-size: 12.5px; font-weight: 600; color: var(--dim); }
    .input {
      height: 40px;
      padding: 0 12px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text);
      font-size: 14px;
      outline: none;
      transition: border-color .15s;
    }
    .input:focus { border-color: var(--accent); }
    .error {
      padding: 10px 12px;
      background: rgba(239,68,68,.1);
      border: 1px solid rgba(239,68,68,.3);
      border-radius: var(--radius-sm);
      color: #f87171;
      font-size: 13px;
    }
    .btn-primary {
      height: 42px;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 14.5px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity .15s;
      margin-top: 4px;
    }
    .btn-primary:hover:not(:disabled) { opacity: .88; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  async submit(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set(null);
    const err = await this.auth.signIn(this.email, this.password);
    if (err) this.error.set(err);
    this.loading.set(false);
  }
}

import { Component, inject, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-lock-screen',
  standalone: true,
  imports: [FormsModule, NgIf],
  template: `
    <div class="lock-backdrop">
      <div class="lock-card">
        <div class="lock-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 class="lock-title">Anchor is locked</h2>
        <p class="lock-sub">Enter your password to continue</p>
        <form (ngSubmit)="unlock()" class="lock-form">
          <input
            class="lock-input"
            type="password"
            placeholder="Password"
            [(ngModel)]="password"
            name="password"
            autocomplete="current-password"
            autofocus
          />
          <div class="lock-error" *ngIf="error()">{{ error() }}</div>
          <button class="lock-btn" type="submit" [disabled]="loading()">
            {{ loading() ? 'Unlocking…' : 'Unlock' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .lock-backdrop {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(5, 7, 12, 0.92);
      backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
    }
    .lock-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 36px;
      width: 320px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      box-shadow: 0 40px 100px rgba(0,0,0,.7);
      animation: popIn .18s ease;
    }
    .lock-icon {
      width: 60px; height: 60px;
      border-radius: 16px;
      background: rgba(37,99,235,.12);
      border: 1px solid rgba(37,99,235,.25);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
    }
    .lock-title { margin: 0; font-size: 18px; font-weight: 700; color: var(--text); }
    .lock-sub { margin: 0 0 6px; font-size: 13.5px; color: var(--muted); }
    .lock-form { width: 100%; display: flex; flex-direction: column; gap: 10px; }
    .lock-input {
      width: 100%; height: 40px; padding: 0 14px;
      border-radius: 10px; border: 1px solid var(--border);
      background: var(--bg); color: var(--text);
      font-size: 14px; outline: none;
      transition: border-color .15s; box-sizing: border-box;
    }
    .lock-input:focus { border-color: rgba(37,99,235,.5); }
    .lock-error { font-size: 12.5px; color: #f87171; text-align: center; }
    .lock-btn {
      height: 40px; border-radius: 10px;
      border: 1px solid rgba(37,99,235,.5);
      background: linear-gradient(160deg, #1e3a8a, #1c326f);
      color: #eaf1ff; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: opacity .12s;
    }
    .lock-btn:hover:not(:disabled) { opacity: .88; }
    .lock-btn:disabled { opacity: .45; cursor: not-allowed; }
  `],
})
export class AppLockComponent {
  private auth = inject(AuthService);

  unlocked = output<void>();

  password = '';
  loading  = signal(false);
  error    = signal<string | null>(null);

  async unlock(): Promise<void> {
    const email = this.auth.user?.email;
    if (!email || !this.password) return;
    this.loading.set(true);
    this.error.set(null);
    const err = await this.auth.signIn(email, this.password);
    this.loading.set(false);
    if (err) {
      this.error.set('Incorrect password');
      this.password = '';
    } else {
      this.unlocked.emit();
    }
  }
}

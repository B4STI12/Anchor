import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { ProfileService } from '../../shared/services/profile.service';
import { BundleService } from '../../shared/services/bundle.service';
import { AuthService } from '../../core/auth/auth.service';

const COLORS = ['#2563eb','#22c55e','#f59e0b','#a855f7','#ec4899','#ef4444','#14b8a6','#f97316'];

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  template: `
    <div class="onboard-wrap">
      <div class="onboard-card">

        <!-- Step indicator -->
        <div class="steps">
          <div class="step" [class.active]="step() >= 1" [class.done]="step() > 1">1</div>
          <div class="step-line" [class.done]="step() > 1"></div>
          <div class="step" [class.active]="step() >= 2" [class.done]="step() > 2">2</div>
          <div class="step-line" [class.done]="step() > 2"></div>
          <div class="step" [class.active]="step() >= 3">3</div>
        </div>

        <!-- Step 1: Welcome -->
        <div *ngIf="step() === 1" class="step-body">
          <div class="step-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3 21 7.5 12 12 3 7.5z"/>
              <path d="M3 12.5 12 17l9-4.5"/>
              <path d="M3 16.5 12 21l9-4.5"/>
            </svg>
          </div>
          <h2 class="step-title">Welcome to Anchor</h2>
          <p class="step-sub">Your personal productivity workspace. Let's get you set up in seconds.</p>

          <div class="field">
            <label class="label">Email</label>
            <input class="input" type="email" placeholder="you@example.com"
                   [(ngModel)]="email" autocomplete="email" />
          </div>
          <div class="field">
            <label class="label">Password</label>
            <input class="input" type="password" placeholder="Minimum 6 characters"
                   [(ngModel)]="password" autocomplete="new-password" />
          </div>
          <div class="field">
            <label class="label">Confirm password</label>
            <input class="input" type="password" placeholder="Repeat password"
                   [(ngModel)]="passwordConfirm" autocomplete="new-password" />
          </div>
          <div class="error" *ngIf="error()">{{ error() }}</div>
          <button class="btn-primary" (click)="createAccount()" [disabled]="loading()">
            {{ loading() ? 'Creating account…' : 'Create account' }}
          </button>
          <p class="already">Already have an account? <a class="link" (click)="router.navigate(['/login'])">Sign in</a></p>
        </div>

        <!-- Step 2: Name profile -->
        <div *ngIf="step() === 2" class="step-body">
          <div class="step-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <h2 class="step-title">Name your first profile</h2>
          <p class="step-sub">Profiles keep your work and personal life separate. You can add more later.</p>
          <div class="field">
            <label class="label">Profile name</label>
            <input class="input" placeholder="e.g. Personal, Work, Side Project"
                   [(ngModel)]="profileName" (keydown.enter)="createProfile()" />
          </div>
          <div class="label" style="margin-top:4px">Color</div>
          <div class="color-row">
            <button *ngFor="let c of colors" class="color-swatch"
                    [style.background]="c" [class.selected]="profileColor === c"
                    (click)="profileColor = c"></button>
          </div>
          <div class="error" *ngIf="error()">{{ error() }}</div>
          <button class="btn-primary" (click)="createProfile()" [disabled]="loading()">
            {{ loading() ? 'Creating…' : 'Continue' }}
          </button>
        </div>

        <!-- Step 3: Add first bundle -->
        <div *ngIf="step() === 3" class="step-body">
          <div class="step-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>
            </svg>
          </div>
          <h2 class="step-title">Create your first bundle</h2>
          <p class="step-sub">Bundles group links you open together — like a morning routine or a project.</p>
          <div class="field">
            <label class="label">Bundle name</label>
            <input class="input" placeholder="e.g. Morning, Work, Research"
                   [(ngModel)]="bundleName" (keydown.enter)="createBundle()" />
          </div>
          <div class="label" style="margin-top:4px">Color</div>
          <div class="color-row">
            <button *ngFor="let c of colors" class="color-swatch"
                    [style.background]="c" [class.selected]="bundleColor === c"
                    (click)="bundleColor = c"></button>
          </div>
          <div class="error" *ngIf="error()">{{ error() }}</div>
          <div class="btn-row">
            <button class="btn-secondary" (click)="skip()">Skip for now</button>
            <button class="btn-primary" (click)="createBundle()" [disabled]="loading()">
              {{ loading() ? 'Creating…' : 'Create bundle' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .onboard-wrap {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: radial-gradient(120% 120% at 50% 0%, #0c1018, #05070c 70%);
      padding: 24px;
    }
    .onboard-card {
      width: 100%; max-width: 440px;
      background: var(--panel); border: 1px solid var(--border);
      border-radius: 20px; padding: 40px 36px;
      box-shadow: 0 40px 100px rgba(0,0,0,.6);
      animation: appIn .3s ease;
    }
    .steps {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 32px;
    }
    .step {
      width: 28px; height: 28px; border-radius: 99px;
      border: 1.5px solid var(--border);
      color: var(--muted); font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      transition: all .2s;
    }
    .step.active { border-color: var(--accent); color: var(--accent2); background: rgba(37,99,235,.12); }
    .step.done { border-color: #22c55e; color: #22c55e; background: rgba(34,197,94,.1); }
    .step-line { flex: 1; height: 1.5px; background: var(--border); transition: background .2s; }
    .step-line.done { background: #22c55e; }

    .step-body { display: flex; flex-direction: column; gap: 16px; }
    .step-icon {
      width: 64px; height: 64px; border-radius: 18px;
      background: rgba(37,99,235,.1); border: 1px solid rgba(37,99,235,.2);
      display: flex; align-items: center; justify-content: center;
    }
    .step-title { margin: 0; font-size: 20px; font-weight: 700; color: var(--text); }
    .step-sub { margin: 0; font-size: 13.5px; color: var(--muted); line-height: 1.6; }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .3px; }
    .input {
      height: 40px; padding: 0 12px; border-radius: 10px;
      border: 1px solid var(--border); background: var(--bg);
      color: var(--text); font-size: 14px; outline: none;
      transition: border-color .15s;
    }
    .input:focus { border-color: rgba(37,99,235,.5); }
    .error { font-size: 12.5px; color: #f87171; }

    .color-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
    .color-swatch {
      width: 26px; height: 26px; border-radius: 99px;
      border: 2px solid transparent; cursor: pointer; transition: transform .12s;
    }
    .color-swatch:hover { transform: scale(1.12); }
    .color-swatch.selected { border-color: #fff; transform: scale(1.08); }

    .btn-primary {
      height: 42px; border-radius: 10px;
      border: 1px solid rgba(37,99,235,.5);
      background: linear-gradient(160deg, #1e3a8a, #1c326f);
      color: #eaf1ff; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: opacity .12s;
    }
    .btn-primary:hover:not(:disabled) { opacity: .88; }
    .btn-primary:disabled { opacity: .45; cursor: not-allowed; }
    .btn-secondary {
      height: 42px; border-radius: 10px;
      border: 1px solid var(--border); background: transparent;
      color: var(--dim); font-size: 14px; font-weight: 500;
      cursor: pointer; transition: background .12s;
    }
    .btn-secondary:hover { background: var(--hover); }
    .btn-row { display: flex; gap: 10px; }
    .btn-row .btn-primary { flex: 1; }

    .already { font-size: 13px; color: var(--muted); text-align: center; margin: 0; }
    .link { color: var(--accent2); cursor: pointer; text-decoration: underline; }
  `],
})
export class OnboardingComponent {
  router      = inject(Router);
  private auth    = inject(AuthService);
  private profiles = inject(ProfileService);
  private bundles  = inject(BundleService);

  step    = signal(1);
  loading = signal(false);
  error   = signal<string | null>(null);

  // Step 1
  email = ''; password = ''; passwordConfirm = '';

  // Step 2
  profileName  = 'Personal';
  profileColor = '#2563eb';

  // Step 3
  bundleName  = '';
  bundleColor = '#2563eb';

  readonly colors = COLORS;

  async createAccount(): Promise<void> {
    this.error.set(null);
    if (!this.email || !this.password) { this.error.set('Email and password are required.'); return; }
    if (this.password !== this.passwordConfirm) { this.error.set('Passwords do not match.'); return; }
    if (this.password.length < 6) { this.error.set('Password must be at least 6 characters.'); return; }
    this.loading.set(true);
    const err = await this.auth.signUp(this.email, this.password);
    this.loading.set(false);
    if (err) { this.error.set(err); return; }
    this.step.set(2);
  }

  async createProfile(): Promise<void> {
    this.error.set(null);
    const name = this.profileName.trim() || 'Personal';
    this.loading.set(true);
    await this.profiles.load();
    // Rename the auto-created profile to the chosen name/color
    const existing = this.profiles.profiles()[0];
    if (existing) {
      await this.profiles.updateProfile(existing.id, { name, color: this.profileColor });
    } else {
      await this.profiles.createProfile(name, this.profileColor);
    }
    this.loading.set(false);
    this.step.set(3);
  }

  async createBundle(): Promise<void> {
    this.error.set(null);
    const name = this.bundleName.trim();
    if (!name) { this.error.set('Bundle name is required.'); return; }
    this.loading.set(true);
    await this.bundles.createBundle(name, this.bundleColor);
    this.loading.set(false);
    await this.router.navigate(['/app/bundles']);
  }

  async skip(): Promise<void> {
    await this.router.navigate(['/app/bundles']);
  }
}

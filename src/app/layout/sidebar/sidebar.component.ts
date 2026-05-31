import { Component, inject, signal, HostListener } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ProfileService, Profile } from '../../shared/services/profile.service';
import { ToastService } from '../../shared/services/toast.service';
import { NavService, Screen } from '../../shared/services/nav.service';
import { CalculatorService } from '../../shared/services/calculator.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <nav class="sidebar">

      <!-- Profile switcher -->
      <div class="profile-area">
        <button class="profile-btn" (click)="profileOpen.update(v=>!v)" title="Switch profile">
          {{ profile.active().name[0] }}
          <span class="profile-dot" [style.background]="profile.active().color"></span>
        </button>

        <div class="profile-dropdown an-pop" *ngIf="profileOpen()">
          <div class="dropdown-label">Profiles</div>
          <button
            *ngFor="let p of profile.profiles()"
            class="dropdown-item"
            [class.active]="p.id === profile.active().id"
            (click)="switchProfile(p)"
          >
            <span class="dot" [style.background]="p.color"></span>
            <span class="item-name">{{ p.name }}</span>
            <svg *ngIf="p.id === profile.active().id" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </button>
          <div class="divider"></div>
          <button class="dropdown-item muted" (click)="profileOpen.set(false)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Add Profile
          </button>
        </div>
      </div>

      <div class="separator"></div>

      <!-- Main nav items -->
      <div class="nav-group">
        <div class="nav-item-wrap" *ngFor="let item of mainItems">
          <button
            class="nav-btn"
            [class.active]="nav.screen() === item.screen"
            [title]="item.label"
            (click)="navigate(item.screen)"
          >
            <div class="active-bar" *ngIf="nav.screen() === item.screen"></div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="safePaths(item.paths)"></svg>
            <div class="tooltip">{{ item.label }} <span class="badge">{{ item.shortcut }}</span></div>
          </button>
        </div>

        <!-- Calculator toggle -->
        <div class="nav-item-wrap">
          <button class="nav-btn" title="Calculator" (click)="calcToggle()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="3" width="14" height="18" rx="2"/>
              <path d="M8 7h8"/>
              <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" stroke-width="2.4"/>
            </svg>
            <div class="tooltip">Calculator <span class="badge">⌘4</span></div>
          </button>
        </div>
      </div>

      <div class="divider-line"></div>

      <!-- Email -->
      <div class="nav-group">
        <div class="nav-item-wrap">
          <button class="nav-btn" [class.active]="nav.screen() === 'email'" (click)="navigate('email')" title="Email">
            <div class="active-bar" *ngIf="nav.screen() === 'email'"></div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>
            </svg>
            <div class="tooltip">Email <span class="badge">⌘5</span></div>
          </button>
        </div>
        <div class="nav-item-wrap">
          <button class="nav-btn disabled" disabled title="Email Triad">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="8" height="7" rx="1.5"/>
              <rect x="13" y="4" width="8" height="7" rx="1.5"/>
              <rect x="8" y="14" width="8" height="6" rx="1.5"/>
            </svg>
            <div class="tooltip">Email Triad <span class="badge">coming soon</span></div>
          </button>
        </div>
      </div>

      <div class="spacer"></div>

      <!-- Settings -->
      <div class="nav-item-wrap">
        <button class="nav-btn" [class.active]="nav.screen() === 'settings'" (click)="navigate('settings')" title="Settings">
          <div class="active-bar" *ngIf="nav.screen() === 'settings'"></div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <div class="tooltip">Settings <span class="badge">⌘,</span></div>
        </button>
      </div>

    </nav>
  `,
  styles: [`
    .sidebar {
      width: 56px;
      flex-shrink: 0;
      background: var(--rail);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 0;
      gap: 4px;
    }
    .profile-area { position: relative; margin-bottom: 2px; }
    .profile-btn {
      width: 38px;
      height: 38px;
      border-radius: 11px;
      border: 1px solid var(--border);
      background: linear-gradient(160deg,#2b3550,#1a2236);
      color: #dbe4ff;
      font-size: 14px;
      font-weight: 700;
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .profile-dot {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      border-radius: 99px;
      border: 2.5px solid var(--bg);
    }
    .profile-dropdown {
      position: absolute;
      top: 0;
      left: 48px;
      width: 188px;
      z-index: 60;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 6px;
      box-shadow: 0 18px 50px rgba(0,0,0,.55);
    }
    .dropdown-label { padding: 6px 8px 4px; font-size: 11px; font-weight: 600; color: var(--muted); letter-spacing: .3px; text-transform: uppercase; }
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--text);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      text-align: left;
      transition: background .1s;
    }
    .dropdown-item:hover { background: var(--hover); }
    .dropdown-item.active { background: rgba(37,99,235,.16); }
    .dropdown-item.muted { color: var(--muted); }
    .dot { width: 9px; height: 9px; border-radius: 99px; flex-shrink: 0; display: inline-block; }
    .item-name { flex: 1; }
    .divider { height: 1px; background: var(--border); margin: 5px 4px; }
    .separator { height: 1px; background: var(--border); width: 28px; margin: 4px 0 8px; }
    .divider-line { height: 1px; background: var(--border); width: 36px; margin: 8px 0; }
    .spacer { flex: 1; }
    .nav-group { display: flex; flex-direction: column; gap: 4px; }
    .nav-item-wrap { position: relative; display: flex; justify-content: center; }
    .nav-btn {
      width: 40px;
      height: 40px;
      border-radius: 11px;
      cursor: pointer;
      border: 1px solid transparent;
      background: transparent;
      color: var(--muted);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: background .12s, color .12s;
    }
    .nav-btn:hover:not(.disabled):not(:disabled) { background: var(--hover); color: var(--text); }
    .nav-btn.active {
      border-color: rgba(37,99,235,.55);
      background: linear-gradient(160deg,#1e3a8a,#1c326f);
      color: #dbe7ff;
      box-shadow: 0 6px 16px rgba(30,58,138,.45);
    }
    .nav-btn.disabled, .nav-btn:disabled { color: #3b4252; cursor: default; }
    .active-bar {
      position: absolute;
      left: -9px;
      top: 9px;
      bottom: 9px;
      width: 3px;
      border-radius: 3px;
      background: var(--accent2);
    }
    .tooltip {
      display: none;
      position: absolute;
      left: 50px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 70;
      background: #0a0c12;
      border: 1px solid var(--border);
      color: var(--text);
      padding: 5px 9px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      box-shadow: 0 8px 24px rgba(0,0,0,.5);
      pointer-events: none;
    }
    .nav-item-wrap:hover .tooltip { display: block; }
    .badge { color: var(--muted); margin-left: 6px; font-size: 11px; }
  `],
})
export class SidebarComponent {
  profile = inject(ProfileService);
  nav = inject(NavService);
  calc = inject(CalculatorService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  safePaths(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  profileOpen = signal(false);

  readonly mainItems = [
    { screen: 'bundles' as Screen, label: 'Bundles', shortcut: '⌘1',
      paths: '<path d="M12 3 21 7.5 12 12 3 7.5z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 16.5 12 21l9-4.5"/>' },
    { screen: 'notes' as Screen, label: 'Notes', shortcut: '⌘2',
      paths: '<path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>' },
    { screen: 'snippets' as Screen, label: 'Snippets', shortcut: '⌘3',
      paths: '<path d="m9 8-4 4 4 4"/><path d="m15 8 4 4-4 4"/>' },
  ];

  navigate(screen: Screen): void {
    this.nav.setScreen(screen);
    this.router.navigate(['/app', screen]);
    this.profileOpen.set(false);
  }

  calcToggle(): void {
    this.calc.toggle();
  }

  switchProfile(p: Profile): void {
    this.profile.switchTo(p);
    this.toast.show(`Switched to ${p.name} profile`);
    this.profileOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const mod = e.metaKey || e.ctrlKey;
    if      (mod && e.key === '1') { e.preventDefault(); this.navigate('bundles'); }
    else if (mod && e.key === '2') { e.preventDefault(); this.navigate('notes'); }
    else if (mod && e.key === '3') { e.preventDefault(); this.navigate('snippets'); }
    else if (mod && e.key === '4') { e.preventDefault(); this.calc.toggle(); }
    else if (mod && e.key === '5') { e.preventDefault(); this.navigate('email'); }
    else if (mod && e.key === ',') { e.preventDefault(); this.navigate('settings'); }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (this.profileOpen()) {
      if (!(e.target as HTMLElement).closest('.profile-area')) {
        this.profileOpen.set(false);
      }
    }
  }
}

import { Component, inject, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { CommandPaletteComponent } from '../../shared/components/command-palette/command-palette.component';
import { ElectronService } from '../../core/electron/electron.service';
import { CommandPaletteService } from '../../shared/services/command-palette.service';
import { ProfileService } from '../../shared/services/profile.service';
import { NavService } from '../../shared/services/nav.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToastComponent, CommandPaletteComponent, TitleCasePipe],
  template: `
    <div class="app-frame an-app-in">

      <!-- Titlebar -->
      <header class="titlebar">
        <div class="traffic-lights">
          <button class="tl red"    (click)="electron.close()"></button>
          <button class="tl yellow" (click)="electron.minimize()"></button>
          <button class="tl green"  (click)="electron.maximize()"></button>
        </div>

        <div class="title-name">
          <span class="app-name">Anchor</span>
          <span class="sep">·</span>
          <span class="breadcrumb">{{ nav.screen() | titlecase }}</span>
        </div>

        <div class="title-center">
          <button class="search-bar" (click)="cp.show()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <span class="search-placeholder">Search or jump to…</span>
            <kbd class="kbd">⌘K</kbd>
          </button>
        </div>

        <div class="profile-indicator">
          <span class="profile-dot-sm" [style.background]="profile.active().color"></span>
          <span class="profile-name">{{ profile.active().name }}</span>
        </div>
      </header>

      <!-- Body -->
      <div class="body">
        <app-sidebar></app-sidebar>
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>

    </div>

    <app-toast></app-toast>
    <app-command-palette></app-command-palette>
  `,
  styles: [`
    :host { display: block; height: 100vh; background: #05070c; padding: 22px; display: flex; align-items: center; justify-content: center;
      background: radial-gradient(120% 120% at 50% 0%, #0c1018, #05070c 70%); }

    .app-frame {
      width: 100%;
      max-width: 1240px;
      height: 100%;
      max-height: 800px;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid #2a3242;
      box-shadow: 0 40px 120px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.02);
    }

    .titlebar {
      height: 44px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 0 16px;
      border-bottom: 1px solid var(--border);
      background: var(--rail);
      -webkit-app-region: drag;
    }
    .titlebar * { -webkit-app-region: no-drag; }

    .traffic-lights { display: flex; gap: 8px; align-items: center; }
    .tl {
      width: 12px;
      height: 12px;
      border-radius: 99px;
      border: none;
      cursor: pointer;
      box-shadow: inset 0 0 0 .5px rgba(0,0,0,.2);
    }
    .red    { background: #ff5f57; }
    .yellow { background: #febc2e; }
    .green  { background: #28c840; }

    .title-name { display: flex; align-items: center; gap: 8px; margin-left: 4px; }
    .app-name   { font-size: 13px; font-weight: 700; letter-spacing: -.01em; color: var(--text); }
    .sep        { font-size: 12px; color: var(--muted); }
    .breadcrumb { font-size: 12.5px; color: var(--dim); font-weight: 500; }

    .title-center { flex: 1; display: flex; justify-content: center; }
    .search-bar {
      display: flex;
      align-items: center;
      gap: 9px;
      height: 28px;
      padding: 0 11px 0 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--panel-2);
      color: var(--muted);
      cursor: pointer;
      font-size: 12.5px;
      font-weight: 500;
      min-width: 230px;
      transition: border-color .15s;
    }
    .search-bar:hover { border-color: rgba(37,99,235,.4); }
    .search-placeholder { flex: 1; text-align: left; }
    .kbd { font-size: 11px; color: var(--muted); background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; }

    .profile-indicator { display: flex; align-items: center; gap: 7px; }
    .profile-dot-sm { width: 8px; height: 8px; border-radius: 99px; display: inline-block; }
    .profile-name { font-size: 12.5px; color: var(--dim); font-weight: 500; }

    .body { flex: 1; display: flex; min-height: 0; }
    .content { flex: 1; min-width: 0; background: var(--bg); overflow: hidden; }
  `],
})
export class ShellComponent {
  electron = inject(ElectronService);
  cp = inject(CommandPaletteService);
  profile = inject(ProfileService);
  nav = inject(NavService);

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); this.cp.toggle(); }
  }
}

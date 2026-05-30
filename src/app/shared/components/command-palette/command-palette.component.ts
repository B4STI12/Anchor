import { Component, inject, HostListener, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { NgIf } from '@angular/common';
import { CommandPaletteService } from '../../services/command-palette.service';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="palette-backdrop" *ngIf="cp.open()" (click)="cp.hide()">
      <div class="palette-modal an-pop" (click)="$event.stopPropagation()">
        <div class="palette-search-row">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input #searchInput class="palette-input" placeholder="Search or jump to…" />
          <kbd class="palette-kbd">Esc</kbd>
        </div>
        <div class="palette-empty">
          <span>Start typing to search bundles, notes, and snippets</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .palette-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.55);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 120px;
      z-index: 8000;
    }
    .palette-modal {
      width: 560px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,.65);
    }
    .palette-search-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }
    .search-icon { color: var(--muted); flex-shrink: 0; }
    .palette-input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      color: var(--text);
      font-size: 14.5px;
      font-weight: 500;
    }
    .palette-kbd {
      font-size: 11px;
      color: var(--muted);
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 5px;
      padding: 2px 6px;
    }
    .palette-empty {
      padding: 32px 16px;
      text-align: center;
      font-size: 13px;
      color: var(--muted);
    }
  `],
})
export class CommandPaletteComponent implements AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  cp = inject(CommandPaletteService);

  ngAfterViewInit(): void {}

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.cp.open()) {
      this.cp.hide();
    }
  }
}

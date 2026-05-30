import {
  Component, inject, HostListener, ViewChild, ElementRef,
  AfterViewChecked, signal, computed,
} from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandPaletteService } from '../../services/command-palette.service';
import { SearchService, SearchResult, ResultKind } from '../../services/search.service';
import { SnippetService } from '../../services/snippet.service';
import { NavService } from '../../services/nav.service';
import { ToastService } from '../../services/toast.service';

const KIND_LABEL: Record<ResultKind, string> = {
  bundle: 'Bundles',
  note: 'Notes',
  snippet: 'Snippets',
};

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  template: `
    <div class="palette-backdrop" *ngIf="cp.open()" (click)="cp.hide()">
      <div class="palette-modal an-pop" (click)="$event.stopPropagation()">

        <div class="palette-search-row">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            #searchInput
            class="palette-input"
            placeholder="Search bundles, notes, snippets…"
            [(ngModel)]="query"
            (ngModelChange)="onQuery()"
          />
          <kbd class="palette-kbd">Esc</kbd>
        </div>

        <div class="palette-results" *ngIf="results().length > 0">
          <ng-container *ngFor="let group of groups()">
            <div class="group-label">{{ group.label }}</div>
            <button
              class="result-item"
              *ngFor="let r of group.items; let i = index"
              [class.active]="activeIndex() === globalIndex(group.label, i)"
              (click)="select(r)"
              (mouseenter)="activeIndex.set(globalIndex(group.label, i))"
            >
              <span class="result-icon">
                <svg *ngIf="r.kind === 'bundle'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 21 7.5 12 12 3 7.5z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 16.5 12 21l9-4.5"/></svg>
                <svg *ngIf="r.kind === 'note'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>
                <svg *ngIf="r.kind === 'snippet'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m9 8-4 4 4 4"/><path d="m15 8 4 4-4 4"/></svg>
              </span>
              <span class="result-label">{{ r.label }}</span>
              <span class="result-sub">{{ r.sub }}</span>
            </button>
          </ng-container>
        </div>

        <div class="palette-empty" *ngIf="query.length > 0 && results().length === 0">
          No results for "{{ query }}"
        </div>
        <div class="palette-empty" *ngIf="query.length === 0">
          Start typing to search bundles, notes, and snippets
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
      padding-top: 100px;
      z-index: 8000;
    }
    .palette-modal {
      width: 560px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,.65);
      max-height: 480px;
      display: flex;
      flex-direction: column;
    }
    .palette-search-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
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
    .palette-results {
      overflow-y: auto;
      flex: 1;
      padding: 6px;
    }
    .group-label {
      padding: 8px 10px 4px;
      font-size: 11px;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: .35px;
      text-transform: uppercase;
    }
    .result-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 9px 10px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--text);
      cursor: pointer;
      font-size: 13.5px;
      font-weight: 500;
      text-align: left;
      transition: background .1s;
    }
    .result-item:hover, .result-item.active { background: var(--hover); }
    .result-icon { color: var(--muted); flex-shrink: 0; display: flex; align-items: center; }
    .result-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .result-sub { font-size: 11.5px; color: var(--muted); white-space: nowrap; }
    .palette-empty {
      padding: 28px 16px;
      text-align: center;
      font-size: 13px;
      color: var(--muted);
    }
  `],
})
export class CommandPaletteComponent implements AfterViewChecked {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  cp = inject(CommandPaletteService);
  private searchSvc = inject(SearchService);
  private snippetService = inject(SnippetService);
  private nav = inject(NavService);
  private router = inject(Router);
  private toast = inject(ToastService);

  query = '';
  activeIndex = signal(0);
  results = signal<SearchResult[]>([]);

  groups = computed(() => {
    const map = new Map<ResultKind, SearchResult[]>();
    for (const r of this.results()) {
      if (!map.has(r.kind)) map.set(r.kind, []);
      map.get(r.kind)!.push(r);
    }
    return Array.from(map.entries()).map(([kind, items]) => ({ label: KIND_LABEL[kind], kind, items }));
  });

  private wasOpen = false;

  ngAfterViewChecked(): void {
    const isOpen = this.cp.open();
    if (isOpen && !this.wasOpen) {
      setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
    }
    if (!isOpen && this.wasOpen) {
      this.query = '';
      this.results.set([]);
      this.activeIndex.set(0);
    }
    this.wasOpen = isOpen;
  }

  onQuery(): void {
    this.results.set(this.searchSvc.search(this.query));
    this.activeIndex.set(0);
  }

  globalIndex(groupLabel: string, itemIndex: number): number {
    let idx = 0;
    for (const g of this.groups()) {
      if (g.label === groupLabel) return idx + itemIndex;
      idx += g.items.length;
    }
    return 0;
  }

  select(r: SearchResult): void {
    if (r.kind === 'bundle') {
      this.nav.setScreen('bundles');
      this.router.navigate(['/app/bundles']);
    } else if (r.kind === 'note') {
      this.nav.setScreen('notes');
      this.router.navigate(['/app/notes']);
    } else if (r.kind === 'snippet') {
      const s = this.snippetService.snippets().find(x => x.id === r.id);
      if (s) {
        const text = s.type === 'custom'
          ? (s.content ?? '')
          : (s.fields?.map(f => `${f.k}: ${f.v}`).join('\n') ?? '');
        navigator.clipboard.writeText(text).then(() => this.toast.show(`Copied "${s.label}"`));
        this.snippetService.incrementUses(s.id);
      }
    }
    this.cp.hide();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.cp.open()) return;
    if (e.key === 'Escape') { this.cp.hide(); return; }
    const flat = this.groups().flatMap(g => g.items);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex.update(i => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex.update(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const r = flat[this.activeIndex()];
      if (r) this.select(r);
    }
  }
}

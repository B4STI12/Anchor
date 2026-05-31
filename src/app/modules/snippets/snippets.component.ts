import { Component, inject, signal, computed, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SnippetService, Snippet, SnippetField } from '../../shared/services/snippet.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-snippets',
  standalone: true,
  imports: [FormsModule],
  template: `
<div class="snippets-root">

  <!-- Header -->
  <div class="header">
    <h1 class="page-title">Snippets</h1>
    <span class="count snippets-count">{{ snippetService.snippets().length }} saved</span>
    <div class="spacer"></div>
    <div class="search-bar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      <input class="search-input" placeholder="Search snippets…" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" />
    </div>
    <button class="btn-primary" (click)="openNewModal()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
      New Snippet
    </button>
  </div>

  <!-- Body -->
  <div class="body">
    <div class="inner">

      <!-- Addresses section (always shown) -->
      <div class="section-label">Addresses</div>
      <div class="snippet-grid">
        @for (s of addresses(); track s.id) {
          <div class="snippet-card" [attr.data-type]="'address'" [class.hov]="hoveredId() === s.id"
               (mouseenter)="hoveredId.set(s.id)" (mouseleave)="hoveredId.set(null)">
            <div class="card-header">
              <span class="type-icon addr-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </span>
              <div class="card-meta">
                <div class="card-label snippet-label">{{ s.label }}</div>
                <div class="card-sub snippet-uses">{{ s.uses }} uses · Address</div>
              </div>
              <button class="copy-btn copy-all-btn" [class.copied]="copiedId() === s.id" (click)="copyAll(s)">
                @if (copiedId() === s.id) {
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  Copied
                } @else {
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy All
                }
              </button>
            </div>
            <div class="fields">
              @for (f of (s.fields ?? []); track f.k) {
                <div class="field-row" (click)="copyField(s, f)">
                  <span class="field-key">{{ f.k }}</span>
                  <span class="field-val">{{ f.v }}</span>
                  <span class="field-copy copy-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </span>
                </div>
              }
            </div>
          </div>
        }
        @if (addresses().length === 0 && !snippetService.loading()) {
          <p class="section-empty">No address snippets yet.</p>
        }
      </div>

      <!-- Custom section (always shown) -->
      <div class="section-label" style="margin-top:28px">Custom Fields</div>
      <div class="snippet-grid">
        @for (s of customs(); track s.id) {
          <div class="snippet-card" [attr.data-type]="'custom'" [class.hov]="hoveredId() === s.id"
               (mouseenter)="hoveredId.set(s.id)" (mouseleave)="hoveredId.set(null)">
            <div class="card-header no-border">
              <span class="type-icon custom-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 8-4 4 4 4"/><path d="m15 8 4 4-4 4"/></svg>
              </span>
              <div class="card-meta">
                <div class="card-label snippet-label">{{ s.label }}</div>
                <div class="card-sub snippet-uses">{{ s.uses }} uses · Custom</div>
              </div>
              <button class="copy-btn" [class.copied]="copiedId() === s.id" (click)="copyAll(s)">
                @if (copiedId() === s.id) {
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  Copied
                } @else {
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                }
              </button>
            </div>
            <div class="custom-content snippet-content">{{ s.content }}</div>
          </div>
        }
        @if (customs().length === 0 && !snippetService.loading()) {
          <p class="section-empty">No custom snippets yet.</p>
        }
      </div>

      @if (filtered().length === 0 && !snippetService.loading() && searchQuery()) {
        <div class="empty-state">
          <h2>No matches</h2>
          <p>No snippets match "{{ searchQuery() }}".</p>
        </div>
      }

    </div>
  </div>
</div>

<!-- ── New Snippet Modal ── -->
@if (showModal()) {
  <div class="modal-backdrop" (click)="showModal.set(false)">
    <div class="modal" (click)="$event.stopPropagation()">
      <h3 class="modal-title">New Snippet</h3>

      <label class="field-label">Label</label>
      <input class="field-input" placeholder="Snippet label" [(ngModel)]="newLabel" />

      <label class="field-label">Type</label>
      <div class="type-tabs">
        <button class="type-tab" value="address" [class.active]="newType === 'address'" (click)="newType = 'address'">Address</button>
        <button class="type-tab" value="custom"  [class.active]="newType === 'custom'"  (click)="newType = 'custom'">Custom</button>
      </div>

      @if (newType === 'address') {
        @for (f of newFields; track $index) {
          <div class="field-row-input">
            <input class="field-input-sm" placeholder="Key (e.g. Street)" [(ngModel)]="f.k" />
            <input class="field-input-sm" placeholder="Value" [(ngModel)]="f.v" />
          </div>
        }
        <button class="add-field-btn" (click)="addField()">+ Add field</button>
      } @else {
        <label class="field-label">Content</label>
        <textarea class="field-textarea" placeholder="content or paste here" [(ngModel)]="newContent" rows="4"></textarea>
      }

      <div class="modal-actions">
        <button class="btn-secondary" (click)="showModal.set(false)">Cancel</button>
        <button class="btn-primary" (click)="createSnippet()">Save</button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .snippets-root { display: flex; flex-direction: column; height: 100%; }

    .header {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 24px; border-bottom: 1px solid var(--border); flex-shrink: 0;
    }
    .page-title { font-size: 18px; font-weight: 700; margin: 0; color: var(--text); }
    .count { font-size: 12.5px; color: var(--muted); }
    .spacer { flex: 1; }
    .search-bar {
      display: flex; align-items: center; gap: 8px;
      height: 34px; padding: 0 11px;
      background: var(--panel); border: 1px solid var(--border);
      border-radius: 9px; color: var(--muted); width: 220px;
    }
    .search-input { flex: 1; border: none; background: transparent; outline: none; color: var(--text); font-size: 13px; }
    .btn-primary {
      display: flex; align-items: center; gap: 7px;
      height: 34px; padding: 0 15px; border-radius: 9px;
      border: 1px solid rgba(37,99,235,.5);
      background: linear-gradient(160deg,#1e3a8a,#1c326f);
      color: #eaf1ff; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
      box-shadow: 0 6px 16px rgba(30,58,138,.4);
    }
    .btn-primary:hover { opacity: .9; }

    .body { flex: 1; overflow-y: auto; padding: 22px 24px; }
    .inner { max-width: 960px; margin: 0 auto; }

    .section-label { font-size: 11.5px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: var(--muted); margin: 0 0 12px 2px; }
    .snippet-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; margin-bottom: 10px; }

    .snippet-card {
      border-radius: 13px; border: 1px solid var(--border);
      background: var(--panel); overflow: hidden;
      transition: border-color .14s, box-shadow .14s;
    }
    .snippet-card.hov { border-color: rgba(37,99,235,.4); box-shadow: 0 10px 28px rgba(0,0,0,.35); }

    .card-header { display: flex; align-items: center; gap: 9px; padding: 12px 13px; border-bottom: 1px solid var(--border); }
    .card-header.no-border { border-bottom: none; }
    .type-icon { width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .addr-icon   { background: rgba(34,197,94,.16); color: #4ade80; }
    .custom-icon { background: rgba(37,99,235,.16);  color: #60a5fa; }
    .card-meta { flex: 1; min-width: 0; }
    .card-label { font-size: 13.5px; font-weight: 600; color: var(--text); }
    .card-sub   { font-size: 11px; color: var(--muted); margin-top: 1px; }

    .copy-btn {
      display: flex; align-items: center; gap: 6px;
      height: 28px; padding: 0 10px; border-radius: 7px;
      border: 1px solid var(--border); background: var(--hover); color: var(--dim);
      font-size: 12px; font-weight: 600; cursor: pointer; flex-shrink: 0;
      transition: all .12s;
    }
    .copy-btn.copied { border-color: rgba(34,197,94,.5); background: rgba(34,197,94,.15); color: #4ade80; }

    .fields { padding: 6px 7px 8px; }
    .field-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 8px; cursor: pointer;
      border: 1px solid transparent; transition: background .1s, border-color .1s;
    }
    .field-row:hover { background: var(--hover); border-color: var(--border); }
    .field-key { font-size: 11px; font-weight: 600; color: var(--muted); width: 58px; flex-shrink: 0; text-transform: uppercase; letter-spacing: .3px; }
    .field-val { flex: 1; font-size: 13.5px; color: var(--dim); }
    .field-copy { color: var(--muted); opacity: 0; transition: opacity .1s; }
    .field-row:hover .field-copy { opacity: 1; }

    .custom-content {
      margin: 0 10px 10px; padding: 9px 11px;
      font-family: var(--mono); font-size: 12.5px; color: var(--dim);
      background: var(--bg); border: 1px solid var(--border);
      border-radius: 8px; white-space: pre-wrap; line-height: 1.5;
    }

    .section-empty { font-size: 13px; color: var(--muted); padding: 8px 4px; margin: 0; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 14px; text-align: center; }
    .empty-icon { width: 68px; height: 68px; border-radius: 20px; background: rgba(37,99,235,.1); border: 1px solid rgba(37,99,235,.2); display: flex; align-items: center; justify-content: center; }
    .empty-state h2 { margin: 0; font-size: 20px; font-weight: 700; color: var(--text); }
    .empty-state p  { margin: 0; font-size: 14px; color: var(--muted); }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; }
    .modal { background: var(--panel); border: 1px solid var(--border); border-radius: 16px; padding: 24px; width: 380px; box-shadow: 0 32px 80px rgba(0,0,0,.6); }
    .modal-title { margin: 0 0 20px; font-size: 16px; font-weight: 700; color: var(--text); }
    .field-label { display: block; font-size: 11.5px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .3px; margin-bottom: 6px; }
    .field-input { width: 100%; height: 36px; border-radius: 9px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 14px; padding: 0 12px; outline: none; box-sizing: border-box; margin-bottom: 16px; transition: border-color .15s; }
    .field-input:focus { border-color: rgba(37,99,235,.5); }
    .field-textarea { width: 100%; border-radius: 9px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; font-family: var(--mono); padding: 10px 12px; outline: none; box-sizing: border-box; resize: vertical; margin-bottom: 16px; line-height: 1.5; transition: border-color .15s; }
    .field-textarea:focus { border-color: rgba(37,99,235,.5); }
    .type-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
    .type-tab { flex: 1; height: 34px; border-radius: 9px; border: 1px solid var(--border); background: var(--hover); color: var(--dim); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .12s; }
    .type-tab.active { border-color: rgba(37,99,235,.5); background: rgba(37,99,235,.16); color: #60a5fa; }
    .field-row-input { display: flex; gap: 8px; margin-bottom: 8px; }
    .field-input-sm { flex: 1; height: 34px; border-radius: 9px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; padding: 0 10px; outline: none; transition: border-color .15s; }
    .field-input-sm:focus { border-color: rgba(37,99,235,.5); }
    .add-field-btn { display: block; width: 100%; height: 32px; border-radius: 8px; border: 1px dashed var(--border); background: transparent; color: var(--muted); font-size: 13px; cursor: pointer; margin-bottom: 16px; transition: background .1s, color .1s; }
    .add-field-btn:hover { background: var(--hover); color: var(--text); }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
    .btn-secondary { height: 34px; padding: 0 15px; border-radius: 9px; border: 1px solid var(--border); background: transparent; color: var(--dim); font-size: 13px; font-weight: 600; cursor: pointer; transition: background .12s; }
    .btn-secondary:hover { background: var(--hover); }
  `],
})
export class SnippetsComponent implements OnInit {
  readonly snippetService = inject(SnippetService);
  private readonly toast = inject(ToastService);

  searchQuery = signal('');
  hoveredId = signal<string | null>(null);
  copiedId = signal<string | null>(null);

  showModal = signal(false);
  newLabel = '';
  newType: 'address' | 'custom' = 'address';
  newContent = '';
  newFields: SnippetField[] = [];

  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.snippetService.snippets().filter(s =>
      !q || s.label.toLowerCase().includes(q) || (s.content ?? '').toLowerCase().includes(q)
    );
  });

  addresses = computed(() => this.filtered().filter(s => s.type === 'address'));
  customs   = computed(() => this.filtered().filter(s => s.type === 'custom'));

  async ngOnInit(): Promise<void> {
    await this.snippetService.load();
  }

  async copyAll(s: Snippet): Promise<void> {
    const text = s.type === 'address'
      ? (s.fields ?? []).map(f => f.v).join('\n')
      : (s.content ?? '');
    await navigator.clipboard.writeText(text);
    this.copiedId.set(s.id);
    setTimeout(() => this.copiedId.set(null), 1100);
    this.toast.show('Copied to clipboard');
    await this.snippetService.incrementUses(s.id);
  }

  async copyField(s: Snippet, f: SnippetField): Promise<void> {
    await navigator.clipboard.writeText(f.v);
    this.toast.show(`${f.k} copied`);
    await this.snippetService.incrementUses(s.id);
  }

  openNewModal(): void {
    this.newLabel = '';
    this.newType = 'address';
    this.newContent = '';
    this.newFields = [{ k: 'Name', v: '' }, { k: 'Street', v: '' }, { k: 'City', v: '' }, { k: 'Country', v: '' }];
    this.showModal.set(true);
  }

  addField(): void {
    this.newFields = [...this.newFields, { k: '', v: '' }];
  }

  async createSnippet(): Promise<void> {
    const label = this.newLabel.trim();
    if (!label) return;

    if (this.newType === 'address') {
      const fields = this.newFields.filter(f => f.k.trim() && f.v.trim());
      if (!fields.length) return;
      await this.snippetService.create({ label, type: 'address', content: null, fields, category: null });
    } else {
      const content = this.newContent.trim();
      if (!content) return;
      await this.snippetService.create({ label, type: 'custom', content, fields: null, category: null });
    }

    this.showModal.set(false);
    this.toast.show(`Snippet "${label}" saved`);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.showModal()) this.showModal.set(false);
  }
}

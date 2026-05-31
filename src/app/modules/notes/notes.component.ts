import {
  Component, inject, signal, computed, ViewChild, ElementRef,
  AfterViewInit, OnDestroy, OnInit, HostListener, NgZone,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import { NoteService, Folder, Note } from '../../shared/services/note.service';
import { DeepLService } from '../../shared/services/deepl.service';
import { ToastService } from '../../shared/services/toast.service';

interface FolderRow {
  folder: Folder;
  depth: number;
  hasChildren: boolean;
}

type SaveState = 'idle' | 'saving' | 'saved';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [FormsModule],
  template: `
<div class="notes-root" (click)="closeContextMenu()">

  <!-- ── Folder tree ── -->
  <div class="folder-tree">
    <div class="panel-header">
      <span class="panel-label">Folders</span>
      <button class="icon-btn" title="New folder" (click)="openNewFolderModal(); $event.stopPropagation()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    </div>

    <button class="folder-item root-item" [class.active]="selectedFolderId() === '__all__'"
        (click)="selectFolder('__all__')">
      <svg class="fi" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6"/></svg>
      <span>All Notes</span>
      <span class="count">{{ noteService.notes().length }}</span>
    </button>

    <button class="folder-item root-item" [class.active]="selectedFolderId() === '__unfiled__'"
        (click)="selectFolder('__unfiled__')">
      <svg class="fi" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      <span>Unfiled</span>
    </button>

    @for (row of folderRows(); track row.folder.id) {
      <div class="folder-item" [class.active]="selectedFolderId() === row.folder.id"
          [style.padding-left.px]="12 + row.depth * 16"
          (click)="selectFolder(row.folder.id)"
          (contextmenu)="onFolderContextMenu($event, row.folder)">
        <svg class="fi" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        @if (renamingId() === row.folder.id) {
          <input class="rename-input" [(ngModel)]="renameValue"
              (keydown.enter)="commitRename()" (keydown.escape)="cancelRename()"
              (blur)="commitRename()" (click)="$event.stopPropagation()" />
        } @else {
          <span class="folder-name">{{ row.folder.name }}</span>
        }
      </div>
    }

    @if (noteService.folders().length === 0) {
      <div class="tree-empty">No folders yet</div>
    }
  </div>

  <!-- ── Note list ── -->
  <div class="note-list">
    <div class="panel-header">
      <span class="panel-label">{{ listLabel() }}</span>
      <div class="new-note-wrap">
        <button class="icon-btn" title="New blank note (Ctrl+N)" (click)="newNote()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button class="icon-btn tmpl-btn" title="New from template" (click)="templateMenuOpen.update(v=>!v); $event.stopPropagation()">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        @if (templateMenuOpen()) {
          <div class="template-menu an-pop">
            @for (t of noteTemplates; track t.id) {
              <button (click)="newNoteFromTemplate(t); $event.stopPropagation()">{{ t.label }}</button>
            }
          </div>
        }
      </div>
    </div>

    <div class="search-wrap">
      <input class="search-input" placeholder="Search notes…" [(ngModel)]="searchQuery" />
    </div>

    <div class="note-items">
      @for (note of filteredNotes(); track note.id) {
        <div class="note-item" [class.active]="selectedNote()?.id === note.id" (click)="selectNote(note)">
          <div class="ni-header">
            @if (note.pinned) {
              <svg class="pin-icon" width="11" height="11" viewBox="0 0 24 24" fill="var(--accent2)" stroke="none"><path d="M12 2a1 1 0 0 1 1 1v1h5a1 1 0 0 1 .707 1.707L16 8.414V16a1 1 0 0 1-.553.894L12 18.618l-3.447-1.724A1 1 0 0 1 8 16V8.414L5.293 5.707A1 1 0 0 1 6 4h5V3a1 1 0 0 1 1-1zM11 20h2v2h-2z"/></svg>
            }
            <span class="note-title">{{ note.title || 'Untitled' }}</span>
            <button class="pin-btn" [class.pinned]="note.pinned" title="{{ note.pinned ? 'Unpin' : 'Pin' }}"
                (click)="togglePin(note); $event.stopPropagation()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2a1 1 0 0 1 1 1v1h5a1 1 0 0 1 .707 1.707L16 8.414V16a1 1 0 0 1-.553.894L12 18.618l-3.447-1.724A1 1 0 0 1 8 16V8.414L5.293 5.707A1 1 0 0 1 6 4h5V3a1 1 0 0 1 1-1z"/></svg>
            </button>
          </div>
          <div class="note-preview">{{ notePreview(note) }}</div>
          <div class="note-date">{{ relativeDate(note.updated_at) }}</div>
        </div>
      }

      @if (filteredNotes().length === 0 && !loading()) {
        <div class="list-empty">
          @if (searchQuery) {
            No notes match "{{ searchQuery }}"
          } @else {
            No notes yet. Press Ctrl+N.
          }
        </div>
      }

      @if (loading()) {
        <div class="list-empty">Loading…</div>
      }
    </div>
  </div>

  <!-- ── Editor ── -->
  <div class="note-editor">

    @if (selectedNote()) {
      <div class="editor-header">
        <input class="title-input" [(ngModel)]="editorTitle" (input)="onTitleChange()" placeholder="Untitled" />
        <span class="save-indicator" [class.visible]="saveState() !== 'idle'">
          {{ saveState() === 'saving' ? 'Saving…' : 'Saved' }}
        </span>
        <button class="export-btn" title="Export as Markdown" (click)="exportMarkdown()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          .md
        </button>
        <button class="export-btn" title="Export as PDF" (click)="exportPdf()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          .pdf
        </button>
      </div>

      <div class="toolbar">
        <button [class.active]="fmt().bold" title="Bold" (mousedown)="$event.preventDefault(); cmd('toggleBold')"><b>B</b></button>
        <button [class.active]="fmt().italic" title="Italic" (mousedown)="$event.preventDefault(); cmd('toggleItalic')"><i>I</i></button>
        <button [class.active]="fmt().underline" title="Underline" (mousedown)="$event.preventDefault(); cmd('toggleUnderline')"><u>U</u></button>
        <button [class.active]="fmt().strike" title="Strikethrough" (mousedown)="$event.preventDefault(); cmd('toggleStrike')"><s>S</s></button>
        <div class="tb-sep"></div>
        <button [class.active]="fmt().h1" title="Heading 1" (mousedown)="$event.preventDefault(); cmdHeading(1)">H1</button>
        <button [class.active]="fmt().h2" title="Heading 2" (mousedown)="$event.preventDefault(); cmdHeading(2)">H2</button>
        <button [class.active]="fmt().h3" title="Heading 3" (mousedown)="$event.preventDefault(); cmdHeading(3)">H3</button>
        <div class="tb-sep"></div>
        <button [class.active]="fmt().bulletList" title="Bullet list" (mousedown)="$event.preventDefault(); cmd('toggleBulletList')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
        </button>
        <button [class.active]="fmt().orderedList" title="Ordered list" (mousedown)="$event.preventDefault(); cmd('toggleOrderedList')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-2-2-1" stroke-width="1.5"/></svg>
        </button>
        <button [class.active]="fmt().blockquote" title="Blockquote" (mousedown)="$event.preventDefault(); cmd('toggleBlockquote')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
        </button>
        <button [class.active]="fmt().code" title="Code" (mousedown)="$event.preventDefault(); cmd('toggleCode')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </button>
        <div class="tb-spacer"></div>
        <button class="deepl-btn" title="Improve with DeepL" [disabled]="deepLLoading()" (click)="improveWithDeepL()">
          @if (deepLLoading()) { Improving… } @else { DeepL Write }
        </button>
      </div>
    }

    <!-- Editor body — #editorEl always in DOM for TipTap -->
    <div class="editor-body">
      @if (!selectedNote()) {
        <div class="no-note">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <p>Select a note or press <kbd>Ctrl+N</kbd></p>
        </div>
      }
      <div #editorEl class="editor-el" [class.hidden]="!selectedNote()"></div>
    </div>

    @if (selectedNote()) {
      <div class="editor-footer">
        <span class="word-count">{{ wordCount() }} {{ wordCount() === 1 ? 'word' : 'words' }}</span>
      </div>
    }
  </div>

</div>

<!-- Context menu -->
@if (contextMenu()) {
  <div class="context-menu"
      [style.left.px]="contextMenu()!.x"
      [style.top.px]="contextMenu()!.y"
      (click)="$event.stopPropagation()">
    <button (click)="ctxNewSubfolder()">New Folder</button>
    <button (click)="ctxRename()">Rename</button>
    <div class="ctx-sep"></div>
    <button class="danger" (click)="ctxDelete()">Delete</button>
  </div>
}

<!-- New folder modal -->
@if (showFolderModal()) {
  <div class="modal-overlay" (click)="closeFolderModal()">
    <div class="modal" (click)="$event.stopPropagation()">
      <h3>{{ newFolderParentId() ? 'New Subfolder' : 'New Folder' }}</h3>
      <input class="modal-input" [(ngModel)]="newFolderName" placeholder="Folder name"
          (keydown.enter)="createFolder()" autofocus />
      <div class="modal-actions">
        <button (click)="closeFolderModal()">Cancel</button>
        <button class="btn-primary" (click)="createFolder()" [disabled]="!newFolderName.trim()">Create</button>
      </div>
    </div>
  </div>
}

<!-- Save-to-notes floating button -->
@if (saveToNotesText()) {
  <button class="save-selection-btn"
      [style.left.px]="saveToNotesPos().x"
      [style.top.px]="saveToNotesPos().y"
      (click)="saveSelectionToNote()">
    Save to Notes
  </button>
}
  `,
  styles: [`
    .notes-root {
      display: flex;
      height: 100%;
      overflow: hidden;
    }

    /* ── Folder tree ── */
    .folder-tree {
      width: 200px;
      min-width: 200px;
      background: var(--panel-2);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    /* ── Note list ── */
    .note-list {
      width: 260px;
      min-width: 260px;
      background: var(--panel);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .note-items {
      flex: 1;
      overflow-y: auto;
    }

    .search-wrap {
      padding: 8px 10px;
      border-bottom: 1px solid var(--border);
    }

    .search-input {
      width: 100%;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 5px 9px;
      font-size: 12px;
      color: var(--text);
      outline: none;
    }

    .search-input:focus { border-color: var(--accent); }

    /* ── Editor ── */
    .note-editor {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--panel);
    }

    .editor-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
    }

    .title-input {
      flex: 1;
      background: transparent;
      border: none;
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
      outline: none;
    }

    .save-indicator {
      font-size: 11px;
      color: var(--muted);
      opacity: 0;
      transition: opacity .2s;
    }
    .save-indicator.visible { opacity: 1; }

    .export-btn {
      display: flex; align-items: center; gap: 4px;
      padding: 3px 9px; border-radius: 6px;
      border: 1px solid var(--border); background: transparent;
      color: var(--muted); font-size: 11.5px; font-weight: 600;
      cursor: pointer; transition: background .12s, color .12s;
    }
    .export-btn:hover { background: var(--hover); color: var(--text); }

    .new-note-wrap { position: relative; display: flex; gap: 1px; }
    .tmpl-btn { width: 18px !important; }
    .template-menu {
      position: absolute; top: 28px; right: 0;
      background: var(--panel); border: 1px solid var(--border);
      border-radius: 8px; padding: 4px; min-width: 160px;
      z-index: 200; box-shadow: 0 10px 30px rgba(0,0,0,.4);
    }
    .template-menu button {
      display: block; width: 100%; padding: 7px 10px;
      text-align: left; background: transparent; border: none;
      border-radius: 6px; color: var(--text); font-size: 13px;
      cursor: pointer; transition: background .1s;
    }
    .template-menu button:hover { background: var(--hover); }

    @media print {
      body > * { display: none !important; }
      .print-only { display: block !important; }
    }

    /* ── Toolbar ── */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 4px 10px;
      border-bottom: 1px solid var(--border);
      background: var(--panel-2);
      flex-wrap: wrap;
    }

    .toolbar button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 5px;
      border: none;
      background: transparent;
      color: var(--dim);
      font-size: 13px;
      cursor: pointer;
      transition: background .15s, color .15s;
    }
    .toolbar button:hover { background: var(--hover); color: var(--text); }
    .toolbar button.active { background: rgba(37,99,235,.2); color: var(--accent2); }
    .toolbar button:disabled { opacity: .4; cursor: not-allowed; }

    .tb-sep {
      width: 1px;
      height: 18px;
      background: var(--border);
      margin: 0 3px;
    }

    .tb-spacer { flex: 1; }

    .deepl-btn {
      width: auto !important;
      padding: 0 10px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      color: var(--accent2) !important;
      border: 1px solid rgba(96,165,250,.25) !important;
      border-radius: 5px !important;
    }
    .deepl-btn:hover { background: rgba(96,165,250,.1) !important; }

    /* ── Editor body ── */
    .editor-body {
      flex: 1;
      overflow-y: auto;
      position: relative;
    }

    .no-note {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: var(--panel);
      color: var(--muted);
      font-size: 14px;
      pointer-events: none;
    }
    .no-note p { margin: 0; }
    .no-note kbd {
      background: var(--hover);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 11px;
      font-family: var(--mono);
    }

    .editor-el {
      padding: 16px 20px;
      min-height: 100%;
    }
    .editor-el.hidden { display: none; }

    /* TipTap ProseMirror styles */
    :host ::ng-deep .ProseMirror {
      outline: none;
      font-size: 14px;
      line-height: 1.7;
      color: var(--text);
      min-height: 200px;
    }
    :host ::ng-deep .ProseMirror h1 { font-size: 22px; font-weight: 700; margin: 16px 0 8px; }
    :host ::ng-deep .ProseMirror h2 { font-size: 18px; font-weight: 600; margin: 14px 0 6px; }
    :host ::ng-deep .ProseMirror h3 { font-size: 15px; font-weight: 600; margin: 12px 0 4px; }
    :host ::ng-deep .ProseMirror p { margin: 0 0 8px; }
    :host ::ng-deep .ProseMirror ul, :host ::ng-deep .ProseMirror ol { padding-left: 24px; margin: 4px 0 8px; }
    :host ::ng-deep .ProseMirror li { margin-bottom: 3px; }
    :host ::ng-deep .ProseMirror blockquote {
      border-left: 3px solid var(--accent);
      margin: 8px 0;
      padding-left: 12px;
      color: var(--dim);
    }
    :host ::ng-deep .ProseMirror code {
      font-family: var(--mono);
      font-size: 12px;
      background: rgba(255,255,255,.06);
      border-radius: 3px;
      padding: 1px 4px;
    }
    :host ::ng-deep .ProseMirror pre {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 14px;
      margin: 8px 0;
    }
    :host ::ng-deep .ProseMirror pre code { background: none; padding: 0; }
    :host ::ng-deep .ProseMirror p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      color: var(--muted);
      pointer-events: none;
      float: left;
      height: 0;
    }

    /* ── Editor footer ── */
    .editor-footer {
      padding: 5px 16px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
    }

    .word-count {
      font-size: 11px;
      color: var(--muted);
    }

    /* ── Shared panel styles ── */
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px 8px;
      border-bottom: 1px solid var(--border);
    }

    .panel-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .5px;
      text-transform: uppercase;
      color: var(--muted);
    }

    .icon-btn {
      width: 24px;
      height: 24px;
      border-radius: 5px;
      border: none;
      background: transparent;
      color: var(--muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background .15s, color .15s;
    }
    .icon-btn:hover { background: var(--hover); color: var(--text); }

    /* ── Folder items ── */
    .folder-item {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 6px 12px;
      cursor: pointer;
      border: none;
      background: transparent;
      color: var(--dim);
      font-size: 13px;
      width: 100%;
      text-align: left;
      transition: background .12s, color .12s;
      border-radius: 0;
    }
    .folder-item:hover { background: var(--hover); color: var(--text); }
    .folder-item.active { background: rgba(37,99,235,.15); color: var(--text); }

    .root-item { padding-left: 12px; }

    .fi { flex-shrink: 0; color: var(--muted); }
    .folder-item.active .fi { color: var(--accent2); }

    .folder-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .count {
      font-size: 11px;
      color: var(--muted);
      background: var(--hover);
      border-radius: 10px;
      padding: 1px 6px;
    }

    .rename-input {
      flex: 1;
      background: var(--bg);
      border: 1px solid var(--accent);
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 13px;
      color: var(--text);
      outline: none;
    }

    .tree-empty {
      padding: 12px;
      font-size: 12px;
      color: var(--muted);
      text-align: center;
    }

    /* ── Note items ── */
    .note-item {
      padding: 10px 12px;
      cursor: pointer;
      border-bottom: 1px solid var(--border);
      transition: background .12s;
    }
    .note-item:hover { background: var(--hover); }
    .note-item.active { background: rgba(37,99,235,.12); }

    .ni-header {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 3px;
    }

    .note-title {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .pin-icon { flex-shrink: 0; }

    .pin-btn {
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      color: var(--muted);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
      cursor: pointer;
      opacity: 0;
      transition: opacity .15s, color .15s;
    }
    .note-item:hover .pin-btn { opacity: 1; }
    .pin-btn.pinned { opacity: 1; color: var(--accent2); }
    .pin-btn:hover { color: var(--accent2); }

    .note-preview {
      font-size: 12px;
      color: var(--muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 3px;
    }

    .note-date {
      font-size: 11px;
      color: var(--muted);
      opacity: .7;
    }

    .list-empty {
      padding: 20px 12px;
      font-size: 13px;
      color: var(--muted);
      text-align: center;
    }

    /* ── Context menu ── */
    .context-menu {
      position: fixed;
      z-index: 9999;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 4px;
      min-width: 140px;
      box-shadow: 0 8px 24px rgba(0,0,0,.4);
      animation: popIn .12s ease;
    }

    .context-menu button {
      display: block;
      width: 100%;
      padding: 7px 12px;
      text-align: left;
      background: transparent;
      border: none;
      border-radius: 5px;
      color: var(--text);
      font-size: 13px;
      cursor: pointer;
      transition: background .12s;
    }
    .context-menu button:hover { background: var(--hover); }
    .context-menu button.danger { color: #f87171; }
    .context-menu button.danger:hover { background: rgba(248,113,113,.1); }

    .ctx-sep {
      height: 1px;
      background: var(--border);
      margin: 3px 4px;
    }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 9998;
      background: rgba(0,0,0,.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px 24px;
      min-width: 300px;
      animation: popIn .15s ease;
    }

    .modal h3 {
      margin: 0 0 16px;
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
    }

    .modal-input {
      width: 100%;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 7px;
      padding: 8px 11px;
      font-size: 13px;
      color: var(--text);
      outline: none;
      margin-bottom: 16px;
    }
    .modal-input:focus { border-color: var(--accent); }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .modal-actions button {
      padding: 7px 14px;
      border-radius: 7px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text);
      font-size: 13px;
      cursor: pointer;
    }
    .modal-actions button:hover { background: var(--hover); }

    .btn-primary {
      background: var(--accent) !important;
      border-color: var(--accent) !important;
      color: #fff !important;
    }
    .btn-primary:hover { background: #1d4ed8 !important; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed !important; }

    /* ── Save-to-notes button ── */
    .save-selection-btn {
      position: fixed;
      z-index: 9997;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      animation: popIn .12s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,.3);
    }
    .save-selection-btn:hover { background: #1d4ed8; }
  `],
})
export class NotesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('editorEl') editorEl!: ElementRef<HTMLDivElement>;

  noteService = inject(NoteService);
  private deepLService = inject(DeepLService);
  private toast = inject(ToastService);
  private ngZone = inject(NgZone);

  editor: Editor | null = null;

  // UI state
  selectedFolderId = signal<string>('__all__');
  selectedNote = signal<Note | null>(null);
  loading = signal(false);

  // Editor state
  editorTitle = '';
  wordCount = signal(0);
  saveState = signal<SaveState>('idle');
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private savedTimer: ReturnType<typeof setTimeout> | null = null;

  fmt = signal({
    bold: false, italic: false, underline: false, strike: false,
    h1: false, h2: false, h3: false,
    bulletList: false, orderedList: false, blockquote: false, code: false,
  });

  deepLLoading = signal(false);

  // Folder tree
  renamingId = signal<string | null>(null);
  renameValue = '';
  showFolderModal = signal(false);
  newFolderName = '';
  newFolderParentId = signal<string | null>(null);
  contextMenu = signal<{ x: number; y: number; folder: Folder } | null>(null);

  // Templates
  templateMenuOpen = signal(false);
  readonly noteTemplates = [
    { id: 'blank',   label: 'Blank note',    content: null },
    { id: 'meeting', label: 'Meeting notes', content: {
        type: 'doc', content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Meeting Notes' }] },
          { type: 'paragraph', content: [{ type: 'text', text: `Date: ${new Date().toLocaleDateString()}` }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Attendees' }] },
          { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Agenda' }] },
          { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Action Items' }] },
          { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }] },
        ],
      },
    },
    { id: 'daily', label: 'Daily log', content: {
        type: 'doc', content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Today\'s goals' }] },
          { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notes' }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Done today' }] },
          { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }] },
        ],
      },
    },
  ] as const;

  // Save-to-notes
  saveToNotesText = signal('');
  saveToNotesPos = signal({ x: 0, y: 0 });

  // Note list
  searchQuery = '';

  folderRows = computed<FolderRow[]>(() => {
    const rows: FolderRow[] = [];
    const build = (parentId: string | null, depth: number) => {
      const children = this.noteService.folders()
        .filter(f => f.parent_id === parentId)
        .sort((a, b) => a.ord - b.ord);
      for (const f of children) {
        const hasChildren = this.noteService.folders().some(x => x.parent_id === f.id);
        rows.push({ folder: f, depth, hasChildren });
        build(f.id, depth + 1);
      }
    };
    build(null, 0);
    return rows;
  });

  filteredNotes = computed<Note[]>(() => {
    let notes = this.noteService.notes();
    const fid = this.selectedFolderId();
    if (fid === '__unfiled__') {
      notes = notes.filter(n => !n.folder_id);
    } else if (fid !== '__all__') {
      notes = notes.filter(n => n.folder_id === fid);
    }
    const q = this.searchQuery.toLowerCase();
    if (q) {
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.content ? JSON.stringify(n.content).toLowerCase().includes(q) : false)
      );
    }
    return [...notes.filter(n => n.pinned), ...notes.filter(n => !n.pinned)];
  });

  listLabel = computed(() => {
    const fid = this.selectedFolderId();
    if (fid === '__all__') return 'All Notes';
    if (fid === '__unfiled__') return 'Unfiled';
    return this.noteService.folders().find(f => f.id === fid)?.name ?? 'Notes';
  });

  async ngOnInit() {
    this.loading.set(true);
    await this.noteService.load();
    this.loading.set(false);
  }

  ngAfterViewInit() {
    this.editor = new Editor({
      element: this.editorEl.nativeElement,
      extensions: [
        StarterKit,
        Underline,
        CharacterCount,
      ],
      editorProps: {
        attributes: { spellcheck: 'true' },
      },
      onUpdate: ({ editor }) => {
        this.ngZone.run(() => {
          this.wordCount.set(editor.storage.characterCount.words());
          this.scheduleSave(editor.getJSON());
        });
      },
      onSelectionUpdate: ({ editor }) => {
        this.ngZone.run(() => this.refreshFmt(editor));
      },
      onTransaction: ({ editor }) => {
        this.ngZone.run(() => this.refreshFmt(editor));
      },
    });
    this.editor.setEditable(false);
  }

  ngOnDestroy() {
    this.editor?.destroy();
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.savedTimer) clearTimeout(this.savedTimer);
    document.removeEventListener('selectionchange', this.onSelectionChange);
  }

  private onSelectionChange = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';
    if (!text || !sel || sel.rangeCount === 0) {
      this.ngZone.run(() => this.saveToNotesText.set(''));
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    this.ngZone.run(() => {
      this.saveToNotesText.set(text);
      this.saveToNotesPos.set({ x: rect.left, y: rect.top - 36 });
    });
  };

  // Attach selection listener when the component is fully active
  @HostListener('document:selectionchange')
  handleSelectionChange() {
    this.onSelectionChange();
  }

  @HostListener('document:click')
  onDocClick() {
    this.templateMenuOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === 'n' && !e.shiftKey && !e.altKey) {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        this.newNote();
      }
    }
    if (e.key === 'Escape') {
      this.templateMenuOpen.set(false);
      this.closeContextMenu();
      this.closeFolderModal();
    }
  }

  // ── Selection ───────────────────────────────────────────────────────────────

  selectFolder(id: string) {
    this.selectedFolderId.set(id);
  }

  selectNote(note: Note) {
    this.flushSave();
    this.selectedNote.set(note);
    this.editorTitle = note.title;
    if (this.editor) {
      this.editor.setEditable(true);
      this.editor.commands.setContent(note.content ?? '');
      this.wordCount.set(this.editor.storage.characterCount.words());
      this.refreshFmt(this.editor);
      setTimeout(() => this.editor?.commands.focus());
    }
    this.saveState.set('idle');
  }

  // ── Notes CRUD ──────────────────────────────────────────────────────────────

  async newNote() {
    this.flushSave();
    this.templateMenuOpen.set(false);
    const fid = this.selectedFolderId();
    const folderId = fid === '__all__' || fid === '__unfiled__' ? null : fid;
    const note = await this.noteService.createNote(folderId);
    if (note) this.selectNote(note);
  }

  async newNoteFromTemplate(t: { id: string; label: string; content: any }) {
    this.flushSave();
    this.templateMenuOpen.set(false);
    const fid = this.selectedFolderId();
    const folderId = fid === '__all__' || fid === '__unfiled__' ? null : fid;
    const title = t.id === 'blank' ? 'Untitled' : t.id === 'daily'
      ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : t.label;
    const note = await this.noteService.createNote(folderId);
    if (!note) return;
    if (t.content) {
      await this.noteService.updateNote(note.id, { title, content: t.content });
      this.selectNote({ ...note, title, content: t.content });
    } else {
      this.selectNote(note);
    }
  }

  exportMarkdown(): void {
    const note = this.selectedNote();
    if (!note || !this.editor) return;
    const md = this.tiptapToMd(this.editor.getJSON());
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.editorTitle || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.show('Exported as Markdown');
  }

  exportPdf(): void {
    const note = this.selectedNote();
    if (!note || !this.editor) return;
    const html = this.editor.getHTML();
    const title = this.editorTitle || 'note';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>body{font-family:Inter,sans-serif;max-width:720px;margin:40px auto;color:#111;line-height:1.7}
      h1,h2,h3{margin:16px 0 6px}pre,code{background:#f3f4f6;border-radius:4px;padding:2px 6px;font-size:13px}
      blockquote{border-left:3px solid #2563eb;margin:8px 0;padding-left:12px;color:#555}</style>
      </head><body><h1>${title}</h1>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
    this.toast.show('PDF print dialog opened');
  }

  private tiptapToMd(node: any, depth = 0): string {
    if (!node) return '';
    if (node.type === 'text') {
      let t = node.text ?? '';
      if (node.marks) {
        for (const m of node.marks) {
          if (m.type === 'bold') t = `**${t}**`;
          else if (m.type === 'italic') t = `_${t}_`;
          else if (m.type === 'strike') t = `~~${t}~~`;
          else if (m.type === 'code') t = '`' + t + '`';
        }
      }
      return t;
    }
    const kids = (node.content ?? []).map((c: any) => this.tiptapToMd(c, depth)).join('');
    switch (node.type) {
      case 'doc': return kids;
      case 'paragraph': return kids ? `${kids}\n\n` : '\n';
      case 'heading': return `${'#'.repeat(node.attrs?.level ?? 1)} ${kids}\n\n`;
      case 'bulletList': return kids;
      case 'orderedList': return kids;
      case 'listItem': return `${'  '.repeat(depth)}- ${kids.trimEnd()}\n`;
      case 'blockquote': return kids.split('\n').map((l: string) => `> ${l}`).join('\n') + '\n';
      case 'codeBlock': return '```\n' + kids + '\n```\n\n';
      case 'hardBreak': return '\n';
      default: return kids;
    }
  }

  async togglePin(note: Note) {
    await this.noteService.updateNote(note.id, { pinned: !note.pinned });
  }

  // ── Editor ──────────────────────────────────────────────────────────────────

  onTitleChange() {
    const note = this.selectedNote();
    if (!note) return;
    this.scheduleSave(this.editor?.getJSON());
  }

  private scheduleSave(content?: any) {
    this.saveState.set('saving');
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.savedTimer) clearTimeout(this.savedTimer);
    this.saveTimer = setTimeout(() => this.doSave(content), 2000);
  }

  private async doSave(content?: any) {
    const note = this.selectedNote();
    if (!note) return;
    await this.noteService.updateNote(note.id, {
      title: this.editorTitle || 'Untitled',
      content: content ?? this.editor?.getJSON(),
    });
    this.saveState.set('saved');
    this.savedTimer = setTimeout(() => this.saveState.set('idle'), 2000);
  }

  private flushSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
      const note = this.selectedNote();
      if (note) {
        this.noteService.updateNote(note.id, {
          title: this.editorTitle || 'Untitled',
          content: this.editor?.getJSON(),
        });
      }
    }
  }

  private refreshFmt(editor: Editor) {
    this.fmt.set({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      strike: editor.isActive('strike'),
      h1: editor.isActive('heading', { level: 1 }),
      h2: editor.isActive('heading', { level: 2 }),
      h3: editor.isActive('heading', { level: 3 }),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      blockquote: editor.isActive('blockquote'),
      code: editor.isActive('code'),
    });
  }

  cmd(command: string) {
    if (!this.editor) return;
    (this.editor.chain().focus() as any)[command]().run();
  }

  cmdHeading(level: 1 | 2 | 3) {
    this.editor?.chain().focus().toggleHeading({ level }).run();
  }

  async improveWithDeepL() {
    if (!this.editor || !this.selectedNote()) return;
    const text = this.editor.getText();
    if (!text.trim()) return;
    this.deepLLoading.set(true);
    const improved = await this.deepLService.improve(text);
    this.deepLLoading.set(false);
    if (improved) {
      this.editor.commands.setContent(improved);
      this.scheduleSave(this.editor.getJSON());
      this.toast.show('Text improved with DeepL Write');
    } else {
      this.toast.show('DeepL Write failed — check your API key in Settings');
    }
  }

  // ── Save to Notes ────────────────────────────────────────────────────────────

  async saveSelectionToNote() {
    const text = this.saveToNotesText();
    if (!text) return;
    const note = await this.noteService.createNote(null);
    if (note) {
      await this.noteService.updateNote(note.id, { content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] } });
      this.selectNote({ ...note, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] } });
      this.toast.show('Saved to Notes');
    }
    this.saveToNotesText.set('');
    window.getSelection()?.removeAllRanges();
  }

  // ── Folder tree ──────────────────────────────────────────────────────────────

  openNewFolderModal(parentId: string | null = null) {
    this.newFolderParentId.set(parentId);
    this.newFolderName = '';
    this.showFolderModal.set(true);
  }

  closeFolderModal() {
    this.showFolderModal.set(false);
  }

  async createFolder() {
    const name = this.newFolderName.trim();
    if (!name) return;
    await this.noteService.createFolder(name, this.newFolderParentId());
    this.closeFolderModal();
  }

  onFolderContextMenu(e: MouseEvent, folder: Folder) {
    e.preventDefault();
    e.stopPropagation();
    this.contextMenu.set({ x: e.clientX, y: e.clientY, folder });
  }

  closeContextMenu() {
    this.contextMenu.set(null);
  }

  ctxNewSubfolder() {
    const folder = this.contextMenu()?.folder;
    this.contextMenu.set(null);
    if (folder) this.openNewFolderModal(folder.id);
  }

  ctxRename() {
    const folder = this.contextMenu()?.folder;
    this.contextMenu.set(null);
    if (folder) {
      this.renamingId.set(folder.id);
      this.renameValue = folder.name;
    }
  }

  async ctxDelete() {
    const folder = this.contextMenu()?.folder;
    this.contextMenu.set(null);
    if (!folder) return;
    await this.noteService.deleteFolder(folder.id);
    if (this.selectedFolderId() === folder.id) this.selectedFolderId.set('__all__');
    this.toast.show(`Folder "${folder.name}" deleted`);
  }

  async commitRename() {
    const id = this.renamingId();
    if (!id) return;
    const name = this.renameValue.trim();
    if (name) await this.noteService.renameFolder(id, name);
    this.renamingId.set(null);
  }

  cancelRename() {
    this.renamingId.set(null);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  notePreview(note: Note): string {
    if (!note.content) return '';
    const extract = (node: any): string => {
      if (node.type === 'text') return node.text ?? '';
      if (node.content) return node.content.map(extract).join(' ');
      return '';
    };
    return extract(note.content).replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  relativeDate(iso: string): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const s = diff / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return new Date(iso).toLocaleDateString();
  }
}

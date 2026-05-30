import { Injectable, inject } from '@angular/core';
import { BundleService } from './bundle.service';
import { NoteService } from './note.service';
import { SnippetService } from './snippet.service';

export type ResultKind = 'bundle' | 'note' | 'snippet';

export interface SearchResult {
  kind: ResultKind;
  id: string;
  label: string;
  sub: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private bundles = inject(BundleService);
  private notes = inject(NoteService);
  private snippets = inject(SnippetService);

  search(query: string): SearchResult[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results: SearchResult[] = [];

    for (const b of this.bundles.bundles()) {
      if (b.name.toLowerCase().includes(q)) {
        results.push({ kind: 'bundle', id: b.id, label: b.name, sub: 'Bundle' });
      }
    }

    for (const n of this.notes.notes()) {
      if (n.title.toLowerCase().includes(q)) {
        results.push({ kind: 'note', id: n.id, label: n.title, sub: 'Note' });
      }
    }

    for (const s of this.snippets.snippets()) {
      const haystack = (s.label + ' ' + (s.content ?? '') + ' ' + (s.fields?.map(f => f.v).join(' ') ?? '')).toLowerCase();
      if (haystack.includes(q)) {
        results.push({ kind: 'snippet', id: s.id, label: s.label, sub: s.type === 'address' ? 'Address snippet' : 'Custom snippet' });
      }
    }

    return results;
  }
}

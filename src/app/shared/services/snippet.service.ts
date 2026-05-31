import { Injectable, inject, signal, effect } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { ProfileService } from './profile.service';

export interface SnippetField { k: string; v: string; }

export interface Snippet {
  id: string;
  profile_id: string;
  label: string;
  type: 'address' | 'custom';
  content: string | null;
  fields: SnippetField[] | null;
  category: string | null;
  uses: number;
  ord: number;
}

@Injectable({ providedIn: 'root' })
export class SnippetService {
  private db = inject(SupabaseService);
  private profileService = inject(ProfileService);

  private _snippets = signal<Snippet[]>([]);
  private _loading = signal(false);

  readonly snippets = this._snippets.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    effect(() => {
      const id = this.profileService.active().id;
      if (id) this.load();
      else this._snippets.set([]);
    });
  }

  async load(): Promise<void> {
    const profileId = this.profileService.active().id;
    if (!profileId) return;
    this._loading.set(true);
    const { data } = await this.db.client
      .from('snippets')
      .select('*')
      .eq('profile_id', profileId)
      .order('uses', { ascending: false });
    this._snippets.set(data ?? []);
    this._loading.set(false);
  }

  async create(snippet: Omit<Snippet, 'id' | 'profile_id' | 'uses' | 'ord'>): Promise<Snippet | null> {
    const profileId = this.profileService.active().id;
    if (!profileId) return null;
    const { data } = await this.db.client
      .from('snippets')
      .insert({ ...snippet, profile_id: profileId, uses: 0, ord: this._snippets().length })
      .select()
      .single();
    if (data) this._snippets.update(ss => [data, ...ss]);
    return data ?? null;
  }

  async incrementUses(id: string): Promise<void> {
    const snip = this._snippets().find(s => s.id === id);
    if (!snip) return;
    const uses = snip.uses + 1;
    await this.db.client.from('snippets').update({ uses }).eq('id', id);
    this._snippets.update(ss => ss.map(s => s.id === id ? { ...s, uses } : s));
  }

  async delete(id: string): Promise<void> {
    await this.db.client.from('snippets').delete().eq('id', id);
    this._snippets.update(ss => ss.filter(s => s.id !== id));
  }
}

import { Injectable, inject, signal, effect } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { ProfileService } from './profile.service';

export interface Folder {
  id: string;
  profile_id: string;
  name: string;
  parent_id: string | null;
  ord: number;
}

export interface Note {
  id: string;
  profile_id: string;
  folder_id: string | null;
  title: string;
  content: any;
  pinned: boolean;
  updated_at: string;
  tags: string[] | null;
}

@Injectable({ providedIn: 'root' })
export class NoteService {
  private db = inject(SupabaseService);
  private profileService = inject(ProfileService);

  private _folders = signal<Folder[]>([]);
  private _notes = signal<Note[]>([]);

  readonly folders = this._folders.asReadonly();
  readonly notes = this._notes.asReadonly();

  constructor() {
    effect(() => {
      const id = this.profileService.active().id;
      if (id) this.load();
      else { this._folders.set([]); this._notes.set([]); }
    });
  }

  async load(): Promise<void> {
    const profileId = this.profileService.active().id;
    if (!profileId) return;
    const [{ data: folders }, { data: notes }] = await Promise.all([
      this.db.client.from('folders').select('*').eq('profile_id', profileId).order('ord'),
      this.db.client.from('notes').select('*').eq('profile_id', profileId).order('updated_at', { ascending: false }),
    ]);
    this._folders.set(folders ?? []);
    this._notes.set(notes ?? []);
  }

  async createFolder(name: string, parentId: string | null = null): Promise<Folder | null> {
    const profileId = this.profileService.active().id;
    if (!profileId) return null;
    const ord = this._folders().filter(f => f.parent_id === parentId).length;
    const { data } = await this.db.client
      .from('folders')
      .insert({ profile_id: profileId, name, parent_id: parentId, ord })
      .select()
      .single();
    if (data) this._folders.update(fs => [...fs, data]);
    return data ?? null;
  }

  async renameFolder(id: string, name: string): Promise<void> {
    await this.db.client.from('folders').update({ name }).eq('id', id);
    this._folders.update(fs => fs.map(f => f.id === id ? { ...f, name } : f));
  }

  async deleteFolder(id: string): Promise<void> {
    await this.db.client.from('folders').delete().eq('id', id);
    this._folders.update(fs => fs.filter(f => f.id !== id && f.parent_id !== id));
    this._notes.update(ns => ns.map(n => n.folder_id === id ? { ...n, folder_id: null } : n));
  }

  async createNote(folderId: string | null = null): Promise<Note | null> {
    const profileId = this.profileService.active().id;
    if (!profileId) return null;
    const { data } = await this.db.client
      .from('notes')
      .insert({ profile_id: profileId, folder_id: folderId, title: 'Untitled', pinned: false })
      .select()
      .single();
    if (data) this._notes.update(ns => [data, ...ns]);
    return data ?? null;
  }

  async updateNote(id: string, changes: Partial<Pick<Note, 'title' | 'content' | 'pinned' | 'tags'>>): Promise<void> {
    const now = new Date().toISOString();
    await this.db.client.from('notes').update({ ...changes, updated_at: now }).eq('id', id);
    this._notes.update(ns =>
      ns.map(n => n.id === id ? { ...n, ...changes, updated_at: now } : n)
    );
  }

  async deleteNote(id: string): Promise<void> {
    await this.db.client.from('notes').delete().eq('id', id);
    this._notes.update(ns => ns.filter(n => n.id !== id));
  }
}

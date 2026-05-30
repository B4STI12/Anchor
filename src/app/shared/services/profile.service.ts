import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { AuthService } from '../../core/auth/auth.service';

export interface Profile {
  id: string;
  user_id?: string;
  name: string;
  color: string;
  avatar_icon?: string;
}

const DEFAULT: Profile = { id: '', name: 'Personal', color: '#2563eb' };

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private db = inject(SupabaseService);
  private auth = inject(AuthService);

  private _profiles = signal<Profile[]>([DEFAULT]);
  private _active = signal<Profile>(DEFAULT);

  readonly profiles = this._profiles.asReadonly();
  readonly active = this._active.asReadonly();

  async load(): Promise<void> {
    const userId = this.auth.user?.id;
    if (!userId) return;

    const { data } = await this.db.client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');

    const profiles: Profile[] = data ?? [];

    if (profiles.length === 0) {
      const { data: created } = await this.db.client
        .from('profiles')
        .insert({ user_id: userId, name: 'Personal', color: '#2563eb' })
        .select()
        .single();
      if (created) profiles.push(created);
    }

    this._profiles.set(profiles);
    if (profiles.length > 0) this._active.set(profiles[0]);
  }

  switchTo(profile: Profile): void {
    this._active.set(profile);
  }

  async createProfile(name: string, color: string): Promise<Profile | null> {
    const userId = this.auth.user?.id;
    if (!userId) return null;
    const { data } = await this.db.client
      .from('profiles')
      .insert({ user_id: userId, name, color })
      .select()
      .single();
    if (data) this._profiles.update(ps => [...ps, data]);
    return data ?? null;
  }
}

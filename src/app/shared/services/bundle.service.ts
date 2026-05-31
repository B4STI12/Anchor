import { Injectable, inject, signal, effect } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { ProfileService } from './profile.service';

export interface Bundle {
  id: string;
  profile_id: string;
  name: string;
  color: string;
  ord: number;
}

export interface Link {
  id: string;
  bundle_id: string;
  label: string;
  url: string;
  favicon: string | null;
  ord: number;
}

@Injectable({ providedIn: 'root' })
export class BundleService {
  private db = inject(SupabaseService);
  private profileService = inject(ProfileService);

  private _bundles = signal<Bundle[]>([]);
  private _loading = signal(false);

  readonly bundles = this._bundles.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    effect(() => {
      const id = this.profileService.active().id;
      if (id) this.loadBundles();
      else this._bundles.set([]);
    });
  }

  async loadBundles(): Promise<void> {
    const profileId = this.profileService.active().id;
    if (!profileId) return;
    this._loading.set(true);
    const { data } = await this.db.client
      .from('bundles')
      .select('*')
      .eq('profile_id', profileId)
      .order('ord');
    this._bundles.set(data ?? []);
    this._loading.set(false);
  }

  async loadLinks(bundleId: string): Promise<Link[]> {
    const { data } = await this.db.client
      .from('links')
      .select('*')
      .eq('bundle_id', bundleId)
      .order('ord');
    return data ?? [];
  }

  async createBundle(name: string, color: string): Promise<Bundle | null> {
    const profileId = this.profileService.active().id;
    if (!profileId) return null;
    const ord = this._bundles().length;
    const { data } = await this.db.client
      .from('bundles')
      .insert({ profile_id: profileId, name, color, ord })
      .select()
      .single();
    if (data) this._bundles.update(bs => [...bs, data]);
    return data ?? null;
  }

  async updateBundle(id: string, changes: Partial<Pick<Bundle, 'name' | 'color'>>): Promise<void> {
    await this.db.client.from('bundles').update(changes).eq('id', id);
    this._bundles.update(bs => bs.map(b => b.id === id ? { ...b, ...changes } : b));
  }

  async deleteBundle(id: string): Promise<void> {
    await this.db.client.from('bundles').delete().eq('id', id);
    this._bundles.update(bs => bs.filter(b => b.id !== id));
  }

  async createLink(bundleId: string, label: string, url: string): Promise<Link | null> {
    const ord = 0;
    const { data } = await this.db.client
      .from('links')
      .insert({ bundle_id: bundleId, label, url, ord })
      .select()
      .single();
    return data ?? null;
  }

  async updateLink(id: string, changes: Partial<Pick<Link, 'label' | 'url'>>): Promise<void> {
    await this.db.client.from('links').update(changes).eq('id', id);
  }

  async deleteLink(id: string): Promise<void> {
    await this.db.client.from('links').delete().eq('id', id);
  }

  reorderBundlesLocal(bundles: Bundle[]): void {
    this._bundles.set(bundles);
  }

  async persistBundleOrder(bundles: Bundle[]): Promise<void> {
    await Promise.all(
      bundles.map((b, i) => this.db.client.from('bundles').update({ ord: i }).eq('id', b.id))
    );
  }

  async persistLinkOrder(links: Link[]): Promise<void> {
    await Promise.all(
      links.map((l, i) => this.db.client.from('links').update({ ord: i }).eq('id', l.id))
    );
  }

  faviconUrl(url: string): string {
    try {
      const full = url.startsWith('http') ? url : 'https://' + url;
      const domain = new URL(full).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch { return ''; }
  }
}

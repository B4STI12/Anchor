import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _session = signal<Session | null>(null);
  readonly session = this._session.asReadonly();

  constructor(private supabase: SupabaseService, private router: Router) {
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this._session.set(session);
    });
  }

  get user(): User | null {
    return this._session()?.user ?? null;
  }

  get isLoggedIn(): boolean {
    return !!this._session();
  }

  async signIn(email: string, password: string): Promise<string | null> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    await this.router.navigate(['/app']);
    return null;
  }

  async signUp(email: string, password: string): Promise<string | null> {
    const { error } = await this.supabase.client.auth.signUp({ email, password });
    if (error) return error.message;
    // signUp auto-signs-in in Supabase (no email confirmation by default)
    return null;
  }

  async changePassword(newPassword: string): Promise<string | null> {
    const { error } = await this.supabase.client.auth.updateUser({ password: newPassword });
    return error?.message ?? null;
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    await this.router.navigate(['/login']);
  }
}

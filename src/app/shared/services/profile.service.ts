import { Injectable, signal } from '@angular/core';

export interface Profile {
  id: string;
  name: string;
  color: string;
}

const HARDCODED_PROFILES: Profile[] = [
  { id: 'private', name: 'Private', color: '#2563eb' },
  { id: 'work',    name: 'Work',    color: '#10b981' },
];

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private _profiles = signal<Profile[]>(HARDCODED_PROFILES);
  private _active = signal<Profile>(HARDCODED_PROFILES[0]);

  readonly profiles = this._profiles.asReadonly();
  readonly active = this._active.asReadonly();

  switchTo(profile: Profile): void {
    this._active.set(profile);
  }
}

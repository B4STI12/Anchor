import { Injectable, signal } from '@angular/core';

export type Screen = 'bundles' | 'notes' | 'snippets' | 'email' | 'email-triad' | 'settings';

@Injectable({ providedIn: 'root' })
export class NavService {
  private _screen = signal<Screen>('bundles');
  readonly screen = this._screen.asReadonly();

  setScreen(s: Screen): void { this._screen.set(s); }
}

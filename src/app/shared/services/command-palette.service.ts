import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private _open = signal(false);
  readonly open = this._open.asReadonly();

  toggle(): void { this._open.update(v => !v); }
  show(): void   { this._open.set(true); }
  hide(): void   { this._open.set(false); }
}

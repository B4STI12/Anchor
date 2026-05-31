import { Injectable, signal } from '@angular/core';

export interface HistoryEntry { expr: string; result: string; }

@Injectable({ providedIn: 'root' })
export class CalculatorService {
  private _open = signal(false);
  private _history = signal<HistoryEntry[]>([]);

  readonly open = this._open.asReadonly();
  readonly history = this._history.asReadonly();

  toggle(): void { this._open.update(v => !v); }
  show(): void   { this._open.set(true); }
  hide(): void   { this._open.set(false); }

  pushHistory(entry: HistoryEntry): void {
    this._history.update(h => [entry, ...h].slice(0, 12));
  }
}

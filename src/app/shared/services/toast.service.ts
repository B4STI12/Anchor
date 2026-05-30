import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string): void {
    const id = Math.random().toString(36).slice(2);
    this._toasts.update(t => [...t, { id, message }]);
    setTimeout(() => this._toasts.update(t => t.filter(x => x.id !== id)), 2200);
  }
}

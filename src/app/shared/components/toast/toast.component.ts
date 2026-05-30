import { Component, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgFor],
  template: `
    <div class="toast-host">
      <div *ngFor="let t of toast.toasts()" class="toast an-toast">
        {{ t.message }}
      </div>
    </div>
  `,
  styles: [`
    .toast-host {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 9999;
      pointer-events: none;
    }
    .toast {
      background: #1e2840;
      border: 1px solid var(--border);
      color: var(--text);
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 500;
      box-shadow: 0 8px 28px rgba(0,0,0,.5);
      white-space: nowrap;
    }
  `],
})
export class ToastComponent {
  toast = inject(ToastService);
}

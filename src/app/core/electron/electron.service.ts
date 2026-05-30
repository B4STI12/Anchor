import { Injectable } from '@angular/core';

interface ElectronAPI {
  getApiKey(service: string): Promise<string | null>;
  setApiKey(service: string, key: string): Promise<void>;
  minimize(): void;
  maximize(): void;
  close(): void;
}

declare global {
  interface Window { electronAPI?: ElectronAPI; }
}

@Injectable({ providedIn: 'root' })
export class ElectronService {
  private get api(): ElectronAPI | undefined {
    return window.electronAPI;
  }

  get isElectron(): boolean {
    return !!this.api;
  }

  getApiKey(service: string): Promise<string | null> {
    return this.api?.getApiKey(service) ?? Promise.resolve(null);
  }

  setApiKey(service: string, key: string): Promise<void> {
    return this.api?.setApiKey(service, key) ?? Promise.resolve();
  }

  minimize(): void { this.api?.minimize(); }
  maximize(): void { this.api?.maximize(); }
  close(): void    { this.api?.close(); }
}

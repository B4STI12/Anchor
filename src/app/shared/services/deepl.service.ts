import { Injectable, inject } from '@angular/core';
import { ElectronService } from '../../core/electron/electron.service';

@Injectable({ providedIn: 'root' })
export class DeepLService {
  private electron = inject(ElectronService);

  async improve(text: string): Promise<string | null> {
    const apiKey = await this.electron.getApiKey('deepl');
    if (!apiKey) return null;

    try {
      const response = await fetch('https://api.deepl.com/v2/write', {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: [text], language: 'EN' }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.improvements?.[0]?.improved_text ?? null;
    } catch {
      return null;
    }
  }
}

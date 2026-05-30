import { safeStorage } from 'electron';

const store = new Map<string, Buffer>();

export function setApiKey(service: string, key: string): void {
  if (safeStorage.isEncryptionAvailable()) {
    store.set(service, safeStorage.encryptString(key));
  } else {
    store.set(service, Buffer.from(key, 'utf8'));
  }
}

export function getApiKey(service: string): string | null {
  const buf = store.get(service);
  if (!buf) return null;
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(buf);
  }
  return buf.toString('utf8');
}

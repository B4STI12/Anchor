import { Injectable } from '@angular/core';

export interface EmailRecord {
  id: string;
  account_id: string;
  provider_id: string;
  subject: string;
  sender_name: string;
  sender_email: string;
  recipient: string;
  body: string;
  date: number;
  is_read: number;
  is_starred: number;
  is_archived: number;
  is_deleted: number;
  is_sent: number;
  is_kept: number;
  category: string;
  snoozed_until: number | null;
  has_attachment: number;
  list_unsubscribe_header: string | null;
}

export interface AccountRecord {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  display_name: string;
  color: string;
  syncError?: string | null;
}

export interface RuleRecord {
  id: number;
  pattern: string;
  category: string;
  position: number;
}

export interface TemplateRecord {
  id: number;
  name: string;
  body: string;
}

interface EmailAPI {
  listInbox(filter?: string): Promise<EmailRecord[]>;
  listStarred(): Promise<EmailRecord[]>;
  listArchived(): Promise<EmailRecord[]>;
  listSent(): Promise<EmailRecord[]>;
  search(query: string): Promise<EmailRecord[]>;
  open(id: string): Promise<EmailRecord | null>;
  archive(ids: string[]): Promise<void>;
  delete(ids: string[]): Promise<void>;
  markRead(ids: string[], read: boolean): Promise<void>;
  snooze(ids: string[], until: number): Promise<void>;
  keep(id: string): Promise<void>;
  star(id: string, starred: boolean): Promise<void>;
  unsubscribe(id: string): Promise<{ method: string; target: string } | null>;
  blockSender(id: string): Promise<void>;
  quickCleanCandidates(): Promise<{ sender_email: string; sender_name: string; cnt: number; latest_subject: string }[]>;
  deleteAllFromSender(senderEmail: string): Promise<void>;
  composeSend(payload: { fromAccountId: string; to: string[]; cc?: string[]; subject: string; body: string }): Promise<void>;
  composeReply(emailId: string, payload: { fromAccountId?: string; body: string; to?: string[] }): Promise<void>;
  composeForward(emailId: string, payload: { fromAccountId?: string; body: string; to: string[] }): Promise<void>;
  accountsList(): Promise<AccountRecord[]>;
  accountsAddGmail(): Promise<AccountRecord>;
  accountsAddOutlook(): Promise<AccountRecord>;
  accountsRemove(id: string): Promise<void>;
  accountsReconnect(id: string): Promise<void>;
  getSyncErrors(): Promise<Record<string, string>>;
  rulesList(): Promise<RuleRecord[]>;
  rulesAdd(pattern: string, category: string): Promise<RuleRecord>;
  rulesRemove(id: number): Promise<void>;
  rulesReorder(ids: number[]): Promise<void>;
  templatesList(): Promise<TemplateRecord[]>;
  templatesAdd(name: string, body: string): Promise<TemplateRecord>;
  templatesRemove(id: number): Promise<void>;
  settingsGetSyncFreq(): Promise<string>;
  settingsSetSyncFreq(v: string): Promise<void>;
  settingsGetOauthCreds(): Promise<{ gmailClientId: string; gmailClientSecret: string; outlookClientId: string; outlookClientSecret: string }>;
  settingsSetOauthCreds(creds: Partial<{ gmailClientId: string; gmailClientSecret: string; outlookClientId: string; outlookClientSecret: string }>): Promise<void>;
  syncNow(): Promise<void>;
  onSyncTick(cb: (data: any) => void): () => void;
  onNewImportant(cb: (email: EmailRecord) => void): () => void;
  onOpenEmail(cb: (id: string) => void): () => void;
}

interface ElectronAPI {
  getApiKey(service: string): Promise<string | null>;
  setApiKey(service: string, key: string): Promise<void>;
  minimize(): void;
  maximize(): void;
  close(): void;
  getAutoLaunch(): Promise<boolean>;
  setAutoLaunch(enable: boolean): Promise<void>;
  onAppLock(cb: () => void): void;
  email: EmailAPI;
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

  getAutoLaunch(): Promise<boolean> {
    return this.api?.getAutoLaunch() ?? Promise.resolve(false);
  }

  setAutoLaunch(enable: boolean): Promise<void> {
    return this.api?.setAutoLaunch(enable) ?? Promise.resolve();
  }

  onAppLock(cb: () => void): void {
    this.api?.onAppLock(cb);
  }

  get email(): EmailAPI | undefined {
    return this.api?.email;
  }
}

import { Injectable, inject } from '@angular/core';
import { ElectronService } from '../../core/electron/electron.service';
import type { EmailRecord, AccountRecord, RuleRecord, TemplateRecord } from '../../core/electron/electron.service';

export type { EmailRecord, AccountRecord, RuleRecord, TemplateRecord };

@Injectable({ providedIn: 'root' })
export class EmailService {
  private electron = inject(ElectronService);
  private get api() { return this.electron.email; }

  listInbox(filter?: string): Promise<EmailRecord[]> {
    return this.api?.listInbox(filter) ?? Promise.resolve([]);
  }
  listStarred(): Promise<EmailRecord[]> { return this.api?.listStarred() ?? Promise.resolve([]); }
  listArchived(): Promise<EmailRecord[]> { return this.api?.listArchived() ?? Promise.resolve([]); }
  listSent(): Promise<EmailRecord[]> { return this.api?.listSent() ?? Promise.resolve([]); }
  search(query: string): Promise<EmailRecord[]> { return this.api?.search(query) ?? Promise.resolve([]); }
  open(id: string): Promise<EmailRecord | null> { return this.api?.open(id) ?? Promise.resolve(null); }
  archive(ids: string[]): Promise<void> { return this.api?.archive(ids) ?? Promise.resolve(); }
  delete(ids: string[]): Promise<void> { return this.api?.delete(ids) ?? Promise.resolve(); }
  markRead(ids: string[], read: boolean): Promise<void> { return this.api?.markRead(ids, read) ?? Promise.resolve(); }
  snooze(ids: string[], until: number): Promise<void> { return this.api?.snooze(ids, until) ?? Promise.resolve(); }
  keep(id: string): Promise<void> { return this.api?.keep(id) ?? Promise.resolve(); }
  star(id: string, starred: boolean): Promise<void> { return this.api?.star(id, starred) ?? Promise.resolve(); }
  unsubscribe(id: string) { return this.api?.unsubscribe(id) ?? Promise.resolve(null); }
  blockSender(id: string): Promise<void> { return this.api?.blockSender(id) ?? Promise.resolve(); }
  quickCleanCandidates() { return this.api?.quickCleanCandidates() ?? Promise.resolve([]); }
  deleteAllFromSender(senderEmail: string): Promise<void> { return this.api?.deleteAllFromSender(senderEmail) ?? Promise.resolve(); }

  composeSend(payload: { fromAccountId: string; to: string[]; cc?: string[]; subject: string; body: string }): Promise<void> {
    return this.api?.composeSend(payload) ?? Promise.resolve();
  }
  composeReply(emailId: string, payload: { fromAccountId?: string; body: string; to?: string[] }): Promise<void> {
    return this.api?.composeReply(emailId, payload) ?? Promise.resolve();
  }
  composeForward(emailId: string, payload: { fromAccountId?: string; body: string; to: string[] }): Promise<void> {
    return this.api?.composeForward(emailId, payload) ?? Promise.resolve();
  }

  accountsList(): Promise<AccountRecord[]> { return this.api?.accountsList() ?? Promise.resolve([]); }
  accountsAddGmail(): Promise<AccountRecord> {
    if (!this.api) throw new Error('Not in Electron');
    return this.api.accountsAddGmail();
  }
  accountsAddOutlook(): Promise<AccountRecord> {
    if (!this.api) throw new Error('Not in Electron');
    return this.api.accountsAddOutlook();
  }
  accountsRemove(id: string): Promise<void> { return this.api?.accountsRemove(id) ?? Promise.resolve(); }
  accountsReconnect(id: string): Promise<void> { return this.api?.accountsReconnect(id) ?? Promise.resolve(); }
  getSyncErrors(): Promise<Record<string, string>> { return this.api?.getSyncErrors() ?? Promise.resolve({}); }

  rulesList(): Promise<RuleRecord[]> { return this.api?.rulesList() ?? Promise.resolve([]); }
  rulesAdd(pattern: string, category: string): Promise<RuleRecord> {
    if (!this.api) throw new Error('Not in Electron');
    return this.api.rulesAdd(pattern, category);
  }
  rulesRemove(id: number): Promise<void> { return this.api?.rulesRemove(id) ?? Promise.resolve(); }
  rulesReorder(ids: number[]): Promise<void> { return this.api?.rulesReorder(ids) ?? Promise.resolve(); }

  templatesList(): Promise<TemplateRecord[]> { return this.api?.templatesList() ?? Promise.resolve([]); }
  templatesAdd(name: string, body: string): Promise<TemplateRecord> {
    if (!this.api) throw new Error('Not in Electron');
    return this.api.templatesAdd(name, body);
  }
  templatesRemove(id: number): Promise<void> { return this.api?.templatesRemove(id) ?? Promise.resolve(); }

  settingsGetSyncFreq(): Promise<string> { return this.api?.settingsGetSyncFreq() ?? Promise.resolve('5m'); }
  settingsSetSyncFreq(v: string): Promise<void> { return this.api?.settingsSetSyncFreq(v) ?? Promise.resolve(); }
  settingsGetOauthCreds() { return this.api?.settingsGetOauthCreds() ?? Promise.resolve({ gmailClientId: '', gmailClientSecret: '', outlookClientId: '', outlookClientSecret: '' }); }
  settingsSetOauthCreds(creds: any): Promise<void> { return this.api?.settingsSetOauthCreds(creds) ?? Promise.resolve(); }
  syncNow(): Promise<void> { return this.api?.syncNow() ?? Promise.resolve(); }

  onSyncTick(cb: (data: any) => void): () => void {
    return this.api?.onSyncTick(cb) ?? (() => {});
  }
  onNewImportant(cb: (email: EmailRecord) => void): () => void {
    return this.api?.onNewImportant(cb) ?? (() => {});
  }
  onOpenEmail(cb: (id: string) => void): () => void {
    return this.api?.onOpenEmail(cb) ?? (() => {});
  }
}

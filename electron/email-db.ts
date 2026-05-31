/**
 * Email storage backed by electron-store JSON files.
 * Uses in-memory arrays for queries — adequate for personal email volumes (~500 emails).
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Store = require('electron-store');

export interface AccountRecord {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  display_name: string;
  color: string;
  access_token: string;
  refresh_token: string;
  token_expiry: number;
}

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

let _stores: {
  emails: any;
  accounts: any;
  rules: any;
  templates: any;
} | null = null;

function getStores() {
  if (!_stores) {
    _stores = {
      emails: new Store({ name: 'anchor-emails' }),
      accounts: new Store({ name: 'anchor-email-accounts' }),
      rules: new Store({ name: 'anchor-email-rules' }),
      templates: new Store({ name: 'anchor-email-templates' }),
    };
  }
  return _stores;
}

// ─── Emails ──────────────────────────────────────────────────────────────────

function allEmails(): EmailRecord[] {
  return Object.values(getStores().emails.get('data', {}) as Record<string, EmailRecord>);
}

function saveEmail(email: EmailRecord): void {
  const s = getStores().emails;
  const data = s.get('data', {}) as Record<string, EmailRecord>;
  data[email.id] = email;
  s.set('data', data);
}

function updateEmail(id: string, patch: Partial<EmailRecord>): void {
  const s = getStores().emails;
  const data = s.get('data', {}) as Record<string, EmailRecord>;
  if (data[id]) {
    data[id] = { ...data[id], ...patch };
    s.set('data', data);
  }
}

function updateEmailsBatch(ids: string[], patch: Partial<EmailRecord>): void {
  const s = getStores().emails;
  const data = s.get('data', {}) as Record<string, EmailRecord>;
  for (const id of ids) {
    if (data[id]) data[id] = { ...data[id], ...patch };
  }
  s.set('data', data);
}

export function emailExists(accountId: string, providerId: string): boolean {
  return allEmails().some(e => e.account_id === accountId && e.provider_id === providerId);
}

export function insertEmailIfNew(email: EmailRecord): boolean {
  if (emailExists(email.account_id, email.provider_id)) return false;
  saveEmail(email);
  return true;
}

export function listInbox(filter?: string): EmailRecord[] {
  const now = Date.now();
  let emails = allEmails().filter(
    e => !e.is_archived && !e.is_deleted && (!e.snoozed_until || e.snoozed_until < now)
  );
  if (filter && filter !== 'all') {
    emails = emails.filter(e => e.category === filter);
  }
  return emails.sort((a, b) => b.date - a.date).slice(0, 200);
}

export function listStarred(): EmailRecord[] {
  return allEmails()
    .filter(e => e.is_starred && !e.is_deleted)
    .sort((a, b) => b.date - a.date).slice(0, 200);
}

export function listArchived(): EmailRecord[] {
  return allEmails()
    .filter(e => e.is_archived && !e.is_deleted)
    .sort((a, b) => b.date - a.date).slice(0, 200);
}

export function listSent(): EmailRecord[] {
  return allEmails()
    .filter(e => e.is_sent && !e.is_deleted)
    .sort((a, b) => b.date - a.date).slice(0, 200);
}

export function searchEmails(query: string): EmailRecord[] {
  if (!query.trim()) return [];
  const terms = query.trim().toLowerCase().split(/\s+/);
  return allEmails()
    .filter(e => !e.is_deleted && terms.every(t =>
      (e.subject || '').toLowerCase().includes(t) ||
      (e.sender_name || '').toLowerCase().includes(t) ||
      (e.sender_email || '').toLowerCase().includes(t) ||
      (e.body || '').toLowerCase().includes(t)
    ))
    .sort((a, b) => b.date - a.date).slice(0, 100);
}

export function getEmail(id: string): EmailRecord | null {
  const data = getStores().emails.get('data', {}) as Record<string, EmailRecord>;
  return data[id] ?? null;
}

export function archiveEmails(ids: string[]): void {
  updateEmailsBatch(ids, { is_archived: 1 });
}

export function deleteEmails(ids: string[]): void {
  updateEmailsBatch(ids, { is_deleted: 1 });
}

export function markReadEmails(ids: string[], read: boolean): void {
  updateEmailsBatch(ids, { is_read: read ? 1 : 0 });
}

export function snoozeEmails(ids: string[], until: number): void {
  updateEmailsBatch(ids, { snoozed_until: until });
}

export function keepEmail(id: string): void {
  updateEmail(id, { is_kept: 1 });
}

export function starEmail(id: string, starred: boolean): void {
  updateEmail(id, { is_starred: starred ? 1 : 0 });
}

export function getUnsubscribeHeader(id: string): string | null {
  return getEmail(id)?.list_unsubscribe_header ?? null;
}

export function quickCleanCandidates(): { sender_email: string; sender_name: string; cnt: number; latest_subject: string }[] {
  const emails = allEmails().filter(e => !e.is_archived && !e.is_deleted);
  const map = new Map<string, { sender_name: string; cnt: number; latest: number; latest_subject: string }>();
  for (const e of emails) {
    const key = e.sender_email;
    const cur = map.get(key);
    if (!cur || e.date > cur.latest) {
      map.set(key, {
        sender_name: e.sender_name,
        cnt: (cur?.cnt ?? 0) + 1,
        latest: e.date,
        latest_subject: e.subject,
      });
    } else {
      map.set(key, { ...cur, cnt: cur.cnt + 1 });
    }
  }
  return Array.from(map.entries())
    .map(([sender_email, v]) => ({ sender_email, ...v }))
    .sort((a, b) => b.cnt - a.cnt).slice(0, 10);
}

export function deleteAllFromSender(senderEmail: string): void {
  const s = getStores().emails;
  const data = s.get('data', {}) as Record<string, EmailRecord>;
  for (const id of Object.keys(data)) {
    if (data[id].sender_email === senderEmail && !data[id].is_archived && !data[id].is_deleted) {
      data[id] = { ...data[id], is_deleted: 1 };
    }
  }
  s.set('data', data);
}

export function blockSenderDomain(emailId: string): void {
  const email = getEmail(emailId);
  if (!email) return;
  const domain = email.sender_email?.split('@')[1];
  if (!domain) return;
  const pattern = `*@${domain}`;

  const rules = listRules();
  const maxPos = rules.reduce((m, r) => Math.max(m, r.position), -1);
  addRule(pattern, 'spam', maxPos + 1);

  const s = getStores().emails;
  const data = s.get('data', {}) as Record<string, EmailRecord>;
  for (const id of Object.keys(data)) {
    const e = data[id];
    if (e.sender_email?.endsWith(`@${domain}`) && !e.is_archived && !e.is_deleted) {
      data[id] = { ...e, is_archived: 1, category: 'spam' };
    }
  }
  s.set('data', data);
}

export function expireSnooze(): string[] {
  const s = getStores().emails;
  const data = s.get('data', {}) as Record<string, EmailRecord>;
  const now = Date.now();
  const expired: string[] = [];
  for (const id of Object.keys(data)) {
    const e = data[id];
    if (e.snoozed_until && e.snoozed_until < now) {
      data[id] = { ...e, snoozed_until: null, is_read: 0 };
      expired.push(id);
    }
  }
  if (expired.length) s.set('data', data);
  return expired;
}

// ─── Accounts ────────────────────────────────────────────────────────────────

export function listAccounts(): AccountRecord[] {
  return Object.values(getStores().accounts.get('data', {}) as Record<string, AccountRecord>);
}

export function getAccount(id: string): AccountRecord | null {
  const data = getStores().accounts.get('data', {}) as Record<string, AccountRecord>;
  return data[id] ?? null;
}

export function upsertAccount(account: AccountRecord): void {
  const s = getStores().accounts;
  const data = s.get('data', {}) as Record<string, AccountRecord>;
  data[account.id] = account;
  s.set('data', data);
}

export function removeAccount(id: string): void {
  const s = getStores().accounts;
  const data = s.get('data', {}) as Record<string, AccountRecord>;
  delete data[id];
  s.set('data', data);
}

// ─── Rules ───────────────────────────────────────────────────────────────────

export function listRules(): RuleRecord[] {
  return (getStores().rules.get('data', []) as RuleRecord[]).sort((a, b) => a.position - b.position);
}

export function addRule(pattern: string, category: string, position: number): RuleRecord {
  const s = getStores().rules;
  const rules = s.get('data', []) as RuleRecord[];
  const maxId = rules.reduce((m, r) => Math.max(m, r.id), 0);
  const rule: RuleRecord = { id: maxId + 1, pattern, category, position };
  rules.push(rule);
  s.set('data', rules);

  // Backfill existing emails
  const es = getStores().emails;
  const emails = es.get('data', {}) as Record<string, EmailRecord>;
  let changed = false;
  for (const id of Object.keys(emails)) {
    if (matchesRule(pattern, emails[id].sender_email)) {
      emails[id] = { ...emails[id], category };
      changed = true;
    }
  }
  if (changed) es.set('data', emails);

  return rule;
}

export function removeRule(id: number): void {
  const s = getStores().rules;
  const rules = (s.get('data', []) as RuleRecord[]).filter(r => r.id !== id);
  s.set('data', rules);
}

export function reorderRules(ids: number[]): void {
  const s = getStores().rules;
  const rules = s.get('data', []) as RuleRecord[];
  const map = new Map(rules.map(r => [r.id, r]));
  const reordered = ids.map((id, i) => ({ ...map.get(id)!, position: i })).filter(Boolean);
  s.set('data', reordered);
}

export function applyRules(rules: RuleRecord[], senderEmail: string): string {
  for (const rule of rules) {
    if (matchesRule(rule.pattern, senderEmail)) return rule.category;
  }
  return 'other';
}

export function matchesRule(pattern: string, senderEmail: string): boolean {
  if (!senderEmail) return false;
  const email = senderEmail.toLowerCase();
  const pat = pattern.toLowerCase();
  if (pat.startsWith('*@')) return email.endsWith(pat.slice(1));
  if (pat.endsWith('@*')) return email.startsWith(pat.slice(0, -1));
  if (pat.includes('*')) {
    const escaped = pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`).test(email);
  }
  return email === pat;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function listTemplates(): TemplateRecord[] {
  return getStores().templates.get('data', []) as TemplateRecord[];
}

export function addTemplate(name: string, body: string): TemplateRecord {
  const s = getStores().templates;
  const templates = s.get('data', []) as TemplateRecord[];
  const maxId = templates.reduce((m, t) => Math.max(m, t.id), 0);
  const tmpl: TemplateRecord = { id: maxId + 1, name, body };
  templates.push(tmpl);
  s.set('data', templates);
  return tmpl;
}

export function removeTemplate(id: number): void {
  const s = getStores().templates;
  const templates = (s.get('data', []) as TemplateRecord[]).filter(t => t.id !== id);
  s.set('data', templates);
}

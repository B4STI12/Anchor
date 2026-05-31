import { v4 as uuidv4 } from 'uuid';
import { refreshGmailToken } from './email-oauth-gmail';
import { refreshOutlookToken } from './email-oauth-outlook';
import type { AccountRecord, RuleRecord, EmailRecord } from './email-db';
import { applyRules, emailExists, insertEmailIfNew } from './email-db';

const SYNC_ERRORS = new Map<string, string>();

export function getSyncErrors(): Record<string, string> {
  return Object.fromEntries(SYNC_ERRORS);
}

async function getValidToken(account: AccountRecord, store: any): Promise<string> {
  const stored = store.get(`accounts.${account.id}`, {}) as any;
  const expiry = stored.expiry || account.token_expiry;

  if (expiry - Date.now() > 60000) {
    return (stored.access || account.access_token) as string;
  }

  try {
    if (account.provider === 'gmail') {
      const refreshed = await refreshGmailToken(account, store);
      return refreshed.access_token;
    } else {
      const refreshed = await refreshOutlookToken(account, store);
      return refreshed.access_token;
    }
  } catch (err: any) {
    SYNC_ERRORS.set(account.id, err.message);
    throw err;
  }
}

export async function syncGmail(
  account: AccountRecord,
  store: any,
  rules: RuleRecord[],
  onNewImportant: (email: EmailRecord) => void
): Promise<{ synced: number }> {
  try {
    const token = await getValidToken(account, store);

    const [inboxRes, sentRes] = await Promise.all([
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=newer_than:7d&maxResults=100`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=SENT&maxResults=50`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (!inboxRes.ok) {
      const err = await inboxRes.text();
      throw new Error(`Gmail list failed: ${err}`);
    }

    const inboxData = await inboxRes.json() as any;
    const sentData = sentRes.ok ? await sentRes.json() as any : { messages: [] };

    const seen = new Set<string>();
    const messages: Array<{ id: string }> = [];
    for (const msg of [...(inboxData.messages || []), ...(sentData.messages || [])]) {
      if (!seen.has(msg.id)) { seen.add(msg.id); messages.push(msg); }
    }

    const newEmails: EmailRecord[] = [];
    const batchSize = 10;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      await Promise.all(batch.map(async (msg) => {
        try {
          if (emailExists(account.id, msg.id)) return;

          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!msgRes.ok) return;
          const msgData = await msgRes.json() as any;
          const parsed = parseGmailMessage(msgData, account.id, rules);
          newEmails.push(parsed);
        } catch {}
      }));
    }

    let inserted = 0;
    for (const email of newEmails) {
      if (insertEmailIfNew(email)) {
        inserted++;
        if (email.category === 'important') onNewImportant(email);
      }
    }

    SYNC_ERRORS.delete(account.id);
    return { synced: inserted };
  } catch (err: any) {
    SYNC_ERRORS.set(account.id, err.message);
    throw err;
  }
}

function parseGmailMessage(msg: any, accountId: string, rules: RuleRecord[]): EmailRecord {
  const headers = msg.payload?.headers || [];
  const get = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const subject = get('Subject');
  const from = get('From');
  const to = get('To');
  const dateStr = get('Date');
  const listUnsub = get('List-Unsubscribe');

  const senderMatch = from.match(/^(?:"?([^"<]+)"?\s*)?<?([^>]+)>?$/);
  const senderName = senderMatch?.[1]?.trim() || from;
  const senderEmail = senderMatch?.[2]?.trim() || from;

  const date = dateStr ? new Date(dateStr).getTime() : Date.now();
  const isRead = !msg.labelIds?.includes('UNREAD') ? 1 : 0;
  const isSent = msg.labelIds?.includes('SENT') ? 1 : 0;
  const hasAttachment = (msg.payload?.parts || []).some((p: any) => p.filename) ? 1 : 0;

  const body = extractGmailBody(msg.payload);
  const category = applyRules(rules, senderEmail);

  return {
    id: uuidv4(),
    account_id: accountId,
    provider_id: msg.id,
    subject,
    sender_name: senderName,
    sender_email: senderEmail,
    recipient: to,
    body,
    date,
    is_read: isRead,
    is_starred: 0,
    is_archived: 0,
    is_deleted: 0,
    is_sent: isSent,
    is_kept: 0,
    category,
    snoozed_until: null,
    has_attachment: hasAttachment,
    list_unsubscribe_header: listUnsub || null,
  };
}

function extractGmailBody(payload: any): string {
  if (!payload) return '';
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf8');
  }
  const parts = payload.parts || [];
  const textPlain = parts.find((p: any) => p.mimeType === 'text/plain');
  if (textPlain?.body?.data) {
    return Buffer.from(textPlain.body.data, 'base64url').toString('utf8');
  }
  for (const part of parts) {
    const nested = extractGmailBody(part);
    if (nested) return nested;
  }
  return '';
}

export async function syncOutlook(
  account: AccountRecord,
  store: any,
  rules: RuleRecord[],
  onNewImportant: (email: EmailRecord) => void
): Promise<{ synced: number }> {
  try {
    const token = await getValidToken(account, store);

    const res = await fetch(
      'https://graph.microsoft.com/v1.0/me/messages?$top=100&$orderby=receivedDateTime%20desc&$select=id,subject,from,toRecipients,body,receivedDateTime,isRead,hasAttachments,internetMessageHeaders',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Outlook list failed: ${err}`);
    }

    const data = await res.json() as any;
    const messages = data.value || [];

    let inserted = 0;
    for (const msg of messages) {
      if (emailExists(account.id, msg.id)) continue;

      const senderName = msg.from?.emailAddress?.name || '';
      const senderEmail = msg.from?.emailAddress?.address || '';
      const recipient = msg.toRecipients?.[0]?.emailAddress?.address || '';
      const body = (msg.body?.content || '').replace(/<[^>]*>/g, '').trim();
      const date = new Date(msg.receivedDateTime).getTime();
      const isRead = msg.isRead ? 1 : 0;
      const hasAttachment = msg.hasAttachments ? 1 : 0;

      const headers = msg.internetMessageHeaders || [];
      const listUnsub = headers.find((h: any) => h.name.toLowerCase() === 'list-unsubscribe')?.value || null;

      const category = applyRules(rules, senderEmail);

      const email: EmailRecord = {
        id: uuidv4(),
        account_id: account.id,
        provider_id: msg.id,
        subject: msg.subject || '',
        sender_name: senderName,
        sender_email: senderEmail,
        recipient,
        body,
        date,
        is_read: isRead,
        is_starred: 0,
        is_archived: 0,
        is_deleted: 0,
        is_sent: 0,
        is_kept: 0,
        category,
        snoozed_until: null,
        has_attachment: hasAttachment,
        list_unsubscribe_header: listUnsub,
      };

      if (insertEmailIfNew(email)) {
        inserted++;
        if (email.category === 'important') onNewImportant(email);
      }
    }

    SYNC_ERRORS.delete(account.id);
    return { synced: inserted };
  } catch (err: any) {
    SYNC_ERRORS.set(account.id, err.message);
    throw err;
  }
}

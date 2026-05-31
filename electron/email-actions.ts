import { refreshGmailToken } from './email-oauth-gmail';
import { refreshOutlookToken } from './email-oauth-outlook';
import type { AccountRecord, EmailRecord } from './email-db';

async function getValidToken(account: AccountRecord, store: any): Promise<string> {
  const stored = store.get(`accounts.${account.id}`, {}) as any;
  const expiry = stored.expiry || account.token_expiry;

  if (expiry - Date.now() > 60000) {
    return (stored.access || account.access_token) as string;
  }

  if (account.provider === 'gmail') {
    const refreshed = await refreshGmailToken(account, store);
    return refreshed.access_token;
  } else {
    const refreshed = await refreshOutlookToken(account, store);
    return refreshed.access_token;
  }
}

export async function archiveEmail(email: EmailRecord, account: AccountRecord, store: any): Promise<void> {
  const token = await getValidToken(account, store);

  if (account.provider === 'gmail') {
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.provider_id}/modify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
    });
  } else {
    const archiveFolderId = await getOutlookFolderId(token, 'Archive');
    if (archiveFolderId) {
      await fetch(`https://graph.microsoft.com/v1.0/me/messages/${email.provider_id}/move`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationId: archiveFolderId }),
      });
    }
  }
}

export async function deleteEmail(email: EmailRecord, account: AccountRecord, store: any): Promise<void> {
  const token = await getValidToken(account, store);

  if (account.provider === 'gmail') {
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.provider_id}/trash`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } else {
    await fetch(`https://graph.microsoft.com/v1.0/me/messages/${email.provider_id}/move`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId: 'deleteditems' }),
    });
  }
}

export async function markReadEmail(email: EmailRecord, account: AccountRecord, store: any, read: boolean): Promise<void> {
  const token = await getValidToken(account, store);

  if (account.provider === 'gmail') {
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.provider_id}/modify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(read ? { removeLabelIds: ['UNREAD'] } : { addLabelIds: ['UNREAD'] }),
    });
  } else {
    await fetch(`https://graph.microsoft.com/v1.0/me/messages/${email.provider_id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: read }),
    });
  }
}

export async function sendEmail(account: AccountRecord, store: any, payload: {
  to: string[]; subject: string; body: string; cc?: string[];
}): Promise<void> {
  const token = await getValidToken(account, store);
  const { to, subject, body, cc } = payload;

  if (account.provider === 'gmail') {
    const mime = buildMimeMessage({ from: account.email, to, cc, subject, body });
    const encoded = Buffer.from(mime).toString('base64url');
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded }),
    });
    if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`);
  } else {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: 'Text', content: body },
          toRecipients: to.map(addr => ({ emailAddress: { address: addr } })),
          ccRecipients: (cc || []).map(addr => ({ emailAddress: { address: addr } })),
        },
      }),
    });
    if (!res.ok) throw new Error(`Outlook send failed: ${await res.text()}`);
  }
}

export async function replyEmail(email: EmailRecord, account: AccountRecord, store: any, payload: {
  body: string; to?: string[];
}): Promise<void> {
  const token = await getValidToken(account, store);
  const { body, to } = payload;

  if (account.provider === 'gmail') {
    const mime = buildMimeMessage({
      from: account.email,
      to: to || [email.sender_email],
      subject: `Re: ${email.subject}`,
      body,
      inReplyTo: email.provider_id,
    });
    const encoded = Buffer.from(mime).toString('base64url');
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded, threadId: email.provider_id }),
    });
    if (!res.ok) throw new Error(`Gmail reply failed: ${await res.text()}`);
  } else {
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${email.provider_id}/reply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: body }),
    });
    if (!res.ok) throw new Error(`Outlook reply failed: ${await res.text()}`);
  }
}

export async function forwardEmail(email: EmailRecord, account: AccountRecord, store: any, payload: {
  body: string; to: string[];
}): Promise<void> {
  const token = await getValidToken(account, store);
  const { body, to } = payload;

  if (account.provider === 'gmail') {
    const mime = buildMimeMessage({
      from: account.email,
      to,
      subject: `Fwd: ${email.subject}`,
      body: body + `\n\n---------- Forwarded message ----------\nFrom: ${email.sender_email}\nSubject: ${email.subject}\n\n${email.body}`,
    });
    const encoded = Buffer.from(mime).toString('base64url');
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded }),
    });
    if (!res.ok) throw new Error(`Gmail forward failed: ${await res.text()}`);
  } else {
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${email.provider_id}/forward`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: body,
        toRecipients: to.map(addr => ({ emailAddress: { address: addr } })),
      }),
    });
    if (!res.ok) throw new Error(`Outlook forward failed: ${await res.text()}`);
  }
}

function buildMimeMessage(opts: {
  from: string; to: string | string[]; cc?: string[]; subject: string; body: string; inReplyTo?: string;
}): string {
  const lines = [
    `From: ${opts.from}`,
    `To: ${Array.isArray(opts.to) ? opts.to.join(', ') : opts.to}`,
  ];
  if (opts.cc?.length) lines.push(`Cc: ${opts.cc.join(', ')}`);
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  lines.push(`Subject: ${opts.subject}`);
  lines.push('Content-Type: text/plain; charset=UTF-8');
  lines.push('MIME-Version: 1.0');
  lines.push('');
  lines.push(opts.body);
  return lines.join('\r\n');
}

async function getOutlookFolderId(token: string, folderName: string): Promise<string | null> {
  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders?$filter=displayName eq '${folderName}'`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as any;
    return data.value?.[0]?.id || null;
  } catch {
    return null;
  }
}

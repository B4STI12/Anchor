import { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, Notification, protocol } from 'electron';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: path.join(app.getAppPath(), '.env') });
import { getApiKey, setApiKey } from './safe-storage';
import { startGmailOAuth, refreshGmailToken } from './email-oauth-gmail';
import { startOutlookOAuth, refreshOutlookToken } from './email-oauth-outlook';
import { syncGmail, syncOutlook, getSyncErrors } from './email-sync';
import { archiveEmail, deleteEmail, markReadEmail, sendEmail, replyEmail, forwardEmail } from './email-actions';
import {
  listAccounts, getAccount, upsertAccount, removeAccount,
  listInbox, listStarred, listArchived, listSent, searchEmails, getEmail,
  archiveEmails, deleteEmails, markReadEmails, snoozeEmails, keepEmail, starEmail,
  getUnsubscribeHeader, quickCleanCandidates, deleteAllFromSender, blockSenderDomain,
  expireSnooze, listRules, addRule, removeRule, reorderRules,
  listTemplates, addTemplate, removeTemplate,
  matchesRule,
} from './email-db';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Store = require('electron-store');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AutoLaunch = require('auto-launch');

const isDev = !app.isPackaged;
const store = new Store();
const emailStore = new Store({ name: 'anchor-email-settings' });

const autoLauncher = new AutoLaunch({ name: 'Anchor' });

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let syncInterval: ReturnType<typeof setInterval> | null = null;

// Register anchor:// protocol for Outlook OAuth redirect
protocol.registerSchemesAsPrivileged([
  { scheme: 'anchor', privileges: { secure: true, standard: true } },
]);
app.setAsDefaultProtocolClient('anchor');

function createTray(): void {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Anchor');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Anchor',
      click: () => {
        if (win) { win.show(); win.focus(); }
      },
    },
    {
      label: 'Lock',
      click: () => {
        if (win) {
          win.show();
          win.focus();
          win.webContents.send('app-lock');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (win) { win.show(); win.focus(); }
  });
}

function createWindow(): void {
  const bounds = store.get('windowBounds', { width: 1280, height: 840, x: undefined, y: undefined });

  win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 },
    frame: false,
    backgroundColor: '#0e1118',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false,
    },
  });

  const saveBounds = () => {
    if (win && !win.isMaximized() && !win.isMinimized()) {
      store.set('windowBounds', win.getBounds());
    }
  };
  win.on('resized', saveBounds);
  win.on('moved', saveBounds);

  if (isDev) {
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../dist/anchor/browser/index.html'));
  }

  // Window controls
  ipcMain.on('window-minimize', () => win?.minimize());
  ipcMain.on('window-maximize', () => {
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on('window-close', () => win?.close());

  // API key storage
  ipcMain.handle('get-api-key', (_e, service: string) => getApiKey(service));
  ipcMain.handle('set-api-key', (_e, service: string, key: string) => setApiKey(service, key));

  // Auto-launch
  ipcMain.handle('get-auto-launch', async () => autoLauncher.isEnabled());
  ipcMain.handle('set-auto-launch', async (_e, enable: boolean) => {
    if (enable) await autoLauncher.enable();
    else await autoLauncher.disable();
  });

  // Open links externally
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.on('closed', () => { win = null; });
}

// ─── Email sync loop ──────────────────────────────────────────────────────────

function startEmailSyncLoop(): void {
  if (syncInterval) clearInterval(syncInterval);

  const freq = emailStore.get('syncFreq', '5m') as string;
  if (freq === 'manual') return;

  const ms = freq === '1m' ? 60000 : freq === '15m' ? 900000 : 300000;
  syncInterval = setInterval(() => runEmailSync(), ms);
  setTimeout(() => runEmailSync(), 3000);
}

async function runEmailSync(): Promise<void> {
  const accounts = listAccounts();
  const rules = listRules();

  const results: Array<{ accountId: string; synced: number; error: string | null }> = [];

  for (const account of accounts) {
    try {
      const onNewImportant = (email: any) => {
        const notification = new Notification({
          title: email.sender_name || email.sender_email,
          body: email.subject || '(no subject)',
        });
        notification.on('click', () => {
          if (win) {
            win.focus();
            win.webContents.send('email:open', email.id);
          }
        });
        notification.show();
        if (win) win.webContents.send('email:newImportant', email);
      };

      let result: { synced: number };
      if (account.provider === 'gmail') {
        result = await syncGmail(account, store, rules, onNewImportant);
      } else {
        result = await syncOutlook(account, store, rules, onNewImportant);
      }
      results.push({ accountId: account.id, synced: result.synced, error: null });
    } catch (err: any) {
      results.push({ accountId: account.id, synced: 0, error: err.message });
    }
  }

  if (win) win.webContents.send('email:syncTick', { results, timestamp: Date.now() });
}

// Snooze wakeup — check every minute
setInterval(() => {
  try {
    const expired = expireSnooze();
    if (expired.length && win) {
      win.webContents.send('email:syncTick', { results: [], timestamp: Date.now() });
    }
  } catch {}
}, 60000);

// ─── Email IPC: Emails ────────────────────────────────────────────────────────

ipcMain.handle('email:listInbox', (_e, filter?: string) => listInbox(filter));
ipcMain.handle('email:listStarred', () => listStarred());
ipcMain.handle('email:listArchived', () => listArchived());
ipcMain.handle('email:listSent', () => listSent());
ipcMain.handle('email:search', (_e, query: string) => searchEmails(query));
ipcMain.handle('email:open', (_e, id: string) => getEmail(id));

ipcMain.handle('email:archive', async (_e, ids: string[]) => {
  archiveEmails(ids);
  for (const id of ids) {
    const email = getEmail(id);
    const account = email ? getAccount(email.account_id) : null;
    if (email && account) try { await archiveEmail(email, account, store); } catch {}
  }
});

ipcMain.handle('email:delete', async (_e, ids: string[]) => {
  deleteEmails(ids);
  for (const id of ids) {
    const email = getEmail(id);
    const account = email ? getAccount(email.account_id) : null;
    if (email && account) try { await deleteEmail(email, account, store); } catch {}
  }
});

ipcMain.handle('email:markRead', async (_e, ids: string[], read: boolean) => {
  markReadEmails(ids, read);
  for (const id of ids) {
    const email = getEmail(id);
    const account = email ? getAccount(email.account_id) : null;
    if (email && account) try { await markReadEmail(email, account, store, read); } catch {}
  }
});

ipcMain.handle('email:snooze', (_e, ids: string[], until: number) => snoozeEmails(ids, until));
ipcMain.handle('email:keep', (_e, id: string) => keepEmail(id));
ipcMain.handle('email:star', (_e, id: string, starred: boolean) => starEmail(id, starred));
ipcMain.handle('email:quickCleanCandidates', () => quickCleanCandidates());
ipcMain.handle('email:deleteAllFromSender', (_e, senderEmail: string) => deleteAllFromSender(senderEmail));
ipcMain.handle('email:blockSender', (_e, id: string) => blockSenderDomain(id));

ipcMain.handle('email:unsubscribe', (_e, id: string) => {
  const header = getUnsubscribeHeader(id);
  if (!header) return null;

  const urls = header.match(/<([^>]+)>/g) || [];
  let httpTarget: string | null = null;
  let mailtoTarget: string | null = null;

  for (const match of urls) {
    const url = match.slice(1, -1).trim();
    if (url.startsWith('https://') || url.startsWith('http://')) httpTarget = url;
    else if (url.startsWith('mailto:')) mailtoTarget = url;
  }

  if (httpTarget) { shell.openExternal(httpTarget); return { method: 'http', target: httpTarget }; }
  if (mailtoTarget) { shell.openExternal(mailtoTarget); return { method: 'mailto', target: mailtoTarget }; }
  return null;
});

// ─── Email IPC: Compose ───────────────────────────────────────────────────────

ipcMain.handle('email:composeSend', async (_e, payload: any) => {
  const account = getAccount(payload.fromAccountId);
  if (!account) throw new Error('Account not found');
  await sendEmail(account, store, payload);
});

ipcMain.handle('email:composeReply', async (_e, emailId: string, payload: any) => {
  const email = getEmail(emailId);
  if (!email) throw new Error('Email not found');
  const account = getAccount(payload.fromAccountId || email.account_id);
  if (!account) throw new Error('Account not found');
  await replyEmail(email, account, store, payload);
});

ipcMain.handle('email:composeForward', async (_e, emailId: string, payload: any) => {
  const email = getEmail(emailId);
  if (!email) throw new Error('Email not found');
  const account = getAccount(payload.fromAccountId || email.account_id);
  if (!account) throw new Error('Account not found');
  await forwardEmail(email, account, store, payload);
});

// ─── Email IPC: Accounts ──────────────────────────────────────────────────────

ipcMain.handle('email:accountsList', () => {
  const accounts = listAccounts();
  const errors = getSyncErrors();
  return accounts.map(a => ({
    id: a.id,
    provider: a.provider,
    email: a.email,
    display_name: a.display_name,
    color: a.color,
    syncError: errors[a.id] || null,
  }));
});

ipcMain.handle('email:accountsAddGmail', async () => {
  const account = await startGmailOAuth(store);
  upsertAccount(account);
  setTimeout(() => runEmailSync(), 500);
  return { id: account.id, provider: account.provider, email: account.email, display_name: account.display_name, color: account.color };
});

ipcMain.handle('email:accountsAddOutlook', async () => {
  const account = await startOutlookOAuth(store);
  upsertAccount(account);
  setTimeout(() => runEmailSync(), 500);
  return { id: account.id, provider: account.provider, email: account.email, display_name: account.display_name, color: account.color };
});

ipcMain.handle('email:accountsRemove', (_e, id: string) => {
  removeAccount(id);
  store.delete(`accounts.${id}`);
});

ipcMain.handle('email:accountsReconnect', async (_e, id: string) => {
  const account = getAccount(id);
  if (!account) throw new Error('Account not found');
  if (account.provider === 'gmail') {
    await refreshGmailToken(account, store);
  } else {
    await refreshOutlookToken(account, store);
  }
});

// ─── Email IPC: Rules ─────────────────────────────────────────────────────────

ipcMain.handle('email:rulesList', () => listRules());
ipcMain.handle('email:rulesAdd', (_e, pattern: string, category: string) => {
  const rules = listRules();
  const maxPos = rules.reduce((m, r) => Math.max(m, r.position), -1);
  return addRule(pattern, category, maxPos + 1);
});
ipcMain.handle('email:rulesRemove', (_e, id: number) => removeRule(id));
ipcMain.handle('email:rulesReorder', (_e, ids: number[]) => reorderRules(ids));

// ─── Email IPC: Templates ─────────────────────────────────────────────────────

ipcMain.handle('email:templatesList', () => listTemplates());
ipcMain.handle('email:templatesAdd', (_e, name: string, body: string) => addTemplate(name, body));
ipcMain.handle('email:templatesRemove', (_e, id: number) => removeTemplate(id));

// ─── Email IPC: Settings ──────────────────────────────────────────────────────

ipcMain.handle('email:settingsGetSyncFreq', () => emailStore.get('syncFreq', '5m'));
ipcMain.handle('email:settingsSetSyncFreq', (_e, v: string) => {
  emailStore.set('syncFreq', v);
  startEmailSyncLoop();
});
ipcMain.handle('email:settingsGetOauthCreds', () => ({
  gmailClientId: store.get('gmail.clientId', process.env['GMAIL_CLIENT_ID'] || '') as string,
  gmailClientSecret: store.get('gmail.clientSecret', process.env['GMAIL_CLIENT_SECRET'] || '') as string,
  outlookClientId: store.get('outlook.clientId', process.env['OUTLOOK_CLIENT_ID'] || '') as string,
  outlookClientSecret: store.get('outlook.clientSecret', process.env['OUTLOOK_CLIENT_SECRET'] || '') as string,
}));
ipcMain.handle('email:settingsSetOauthCreds', (_e, creds: any) => {
  if (creds.gmailClientId !== undefined) store.set('gmail.clientId', creds.gmailClientId);
  if (creds.gmailClientSecret !== undefined) store.set('gmail.clientSecret', creds.gmailClientSecret);
  if (creds.outlookClientId !== undefined) store.set('outlook.clientId', creds.outlookClientId);
  if (creds.outlookClientSecret !== undefined) store.set('outlook.clientSecret', creds.outlookClientSecret);
});
ipcMain.handle('email:syncNow', async () => { await runEmailSync(); });
ipcMain.handle('email:getSyncErrors', () => getSyncErrors());

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();
  createTray();
  startEmailSyncLoop();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('open-url', (event, _url) => {
  event.preventDefault();
  // Outlook OAuth redirect is handled directly in email-oauth-outlook.ts via will-redirect
});

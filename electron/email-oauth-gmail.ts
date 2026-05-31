import { BrowserWindow } from 'electron';
import * as http from 'http';
import { v4 as uuidv4 } from 'uuid';
import type { AccountRecord } from './email-db';

const GMAIL_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GMAIL_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

const ACCOUNT_COLORS = ['#6366F1', '#F59E0B', '#22C55E', '#3B82F6', '#EC4899', '#8B5CF6'];

function getCredentials(store: any): { clientId: string; clientSecret: string } {
  return {
    clientId: store.get('gmail.clientId', process.env['GMAIL_CLIENT_ID'] || '') as string,
    clientSecret: store.get('gmail.clientSecret', process.env['GMAIL_CLIENT_SECRET'] || '') as string,
  };
}

function startLocalServer(): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({ server, port });
    });
    server.on('error', reject);
  });
}

export async function startGmailOAuth(store: any): Promise<AccountRecord> {
  const { clientId, clientSecret } = getCredentials(store);
  if (!clientId || !clientSecret) {
    throw new Error('Gmail OAuth credentials not configured. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your .env file.');
  }

  const state = uuidv4();
  const { server, port } = await startLocalServer();
  const redirectUri = `http://127.0.0.1:${port}`;

  const authUrl = new URL(GMAIL_AUTH_URL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  return new Promise((resolve, reject) => {
    let codeReceived = false;

    const win = new BrowserWindow({
      width: 500,
      height: 660,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
      title: 'Connect Gmail',
    });

    win.loadURL(authUrl.toString());

    server.on('request', async (req: http.IncomingMessage, res: http.ServerResponse) => {
      if (!req.url?.startsWith('/?') && req.url !== '/') {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = new URL(req.url!, redirectUri);
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body style="font-family:sans-serif;text-align:center;padding-top:80px"><h2>Authentication complete.</h2><p>You can close this window.</p></body></html>');
      server.close();

      if (error || returnedState !== state) {
        if (!win.isDestroyed()) win.close();
        reject(new Error(error || 'OAuth state mismatch'));
        return;
      }

      codeReceived = true;
      if (!win.isDestroyed()) win.close();

      try {
        const tokens = await exchangeGmailCode(code!, clientId, clientSecret, redirectUri);
        const userInfo = await fetchGmailUserInfo(tokens.access_token);

        const accountId = uuidv4();
        const color = ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)];

        const account: AccountRecord = {
          id: accountId,
          provider: 'gmail',
          email: userInfo.email,
          display_name: userInfo.name || userInfo.email,
          color,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || '',
          token_expiry: Date.now() + (tokens.expires_in * 1000),
        };

        store.set(`accounts.${accountId}`, {
          access: tokens.access_token,
          refresh: tokens.refresh_token || '',
          expiry: account.token_expiry,
        });

        resolve(account);
      } catch (err) {
        reject(err);
      }
    });

    win.on('closed', () => {
      server.close();
      if (!codeReceived) reject(new Error('OAuth window closed by user'));
    });
  });
}

async function exchangeGmailCode(code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<any> {
  const res = await fetch(GMAIL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

async function fetchGmailUserInfo(accessToken: string): Promise<any> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user info');
  return res.json();
}

export async function refreshGmailToken(account: AccountRecord, store: any): Promise<{ access_token: string; token_expiry: number }> {
  const { clientId, clientSecret } = getCredentials(store);
  const stored = store.get(`accounts.${account.id}`, {}) as any;
  const refreshToken = stored.refresh || account.refresh_token;
  if (!refreshToken) throw new Error('No refresh token available');

  const res = await fetch(GMAIL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token' }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const tokens = await res.json() as any;

  const newExpiry = Date.now() + (tokens.expires_in * 1000);
  store.set(`accounts.${account.id}.access`, tokens.access_token);
  store.set(`accounts.${account.id}.expiry`, newExpiry);
  return { access_token: tokens.access_token, token_expiry: newExpiry };
}

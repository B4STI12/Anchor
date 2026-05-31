import { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import { getApiKey, setApiKey } from './safe-storage';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Store = require('electron-store');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AutoLaunch = require('auto-launch');

const isDev = !app.isPackaged;
const store = new Store();

const autoLauncher = new AutoLaunch({ name: 'Anchor' });

let win: BrowserWindow | null = null;
let tray: Tray | null = null;

function createTray(): void {
  // Use a blank 16x16 image as placeholder tray icon
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

  // Save window position/size on move or resize
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

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

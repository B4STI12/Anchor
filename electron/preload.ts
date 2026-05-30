import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getApiKey: (service: string) => ipcRenderer.invoke('get-api-key', service),
  setApiKey: (service: string, key: string) => ipcRenderer.invoke('set-api-key', service, key),

  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close:    () => ipcRenderer.send('window-close'),
});

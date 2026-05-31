import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getApiKey: (service: string) => ipcRenderer.invoke('get-api-key', service),
  setApiKey: (service: string, key: string) => ipcRenderer.invoke('set-api-key', service, key),

  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close:    () => ipcRenderer.send('window-close'),

  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enable: boolean) => ipcRenderer.invoke('set-auto-launch', enable),

  onAppLock: (cb: () => void) => ipcRenderer.on('app-lock', cb),

  email: {
    // Emails
    listInbox:    (filter?: string) => ipcRenderer.invoke('email:listInbox', filter),
    listStarred:  () => ipcRenderer.invoke('email:listStarred'),
    listArchived: () => ipcRenderer.invoke('email:listArchived'),
    listSent:     () => ipcRenderer.invoke('email:listSent'),
    search:       (query: string) => ipcRenderer.invoke('email:search', query),
    open:         (id: string) => ipcRenderer.invoke('email:open', id),
    archive:      (ids: string[]) => ipcRenderer.invoke('email:archive', ids),
    delete:       (ids: string[]) => ipcRenderer.invoke('email:delete', ids),
    markRead:     (ids: string[], read: boolean) => ipcRenderer.invoke('email:markRead', ids, read),
    snooze:       (ids: string[], until: number) => ipcRenderer.invoke('email:snooze', ids, until),
    keep:         (id: string) => ipcRenderer.invoke('email:keep', id),
    star:         (id: string, starred: boolean) => ipcRenderer.invoke('email:star', id, starred),
    unsubscribe:  (id: string) => ipcRenderer.invoke('email:unsubscribe', id),
    blockSender:  (id: string) => ipcRenderer.invoke('email:blockSender', id),
    quickCleanCandidates: () => ipcRenderer.invoke('email:quickCleanCandidates'),
    deleteAllFromSender:  (senderEmail: string) => ipcRenderer.invoke('email:deleteAllFromSender', senderEmail),

    // Compose
    composeSend:    (payload: any) => ipcRenderer.invoke('email:composeSend', payload),
    composeReply:   (emailId: string, payload: any) => ipcRenderer.invoke('email:composeReply', emailId, payload),
    composeForward: (emailId: string, payload: any) => ipcRenderer.invoke('email:composeForward', emailId, payload),

    // Accounts
    accountsList:       () => ipcRenderer.invoke('email:accountsList'),
    accountsAddGmail:   () => ipcRenderer.invoke('email:accountsAddGmail'),
    accountsAddOutlook: () => ipcRenderer.invoke('email:accountsAddOutlook'),
    accountsRemove:     (id: string) => ipcRenderer.invoke('email:accountsRemove', id),
    accountsReconnect:  (id: string) => ipcRenderer.invoke('email:accountsReconnect', id),
    getSyncErrors:      () => ipcRenderer.invoke('email:getSyncErrors'),

    // Rules
    rulesList:    () => ipcRenderer.invoke('email:rulesList'),
    rulesAdd:     (pattern: string, category: string) => ipcRenderer.invoke('email:rulesAdd', pattern, category),
    rulesRemove:  (id: number) => ipcRenderer.invoke('email:rulesRemove', id),
    rulesReorder: (ids: number[]) => ipcRenderer.invoke('email:rulesReorder', ids),

    // Templates
    templatesList:   () => ipcRenderer.invoke('email:templatesList'),
    templatesAdd:    (name: string, body: string) => ipcRenderer.invoke('email:templatesAdd', name, body),
    templatesRemove: (id: number) => ipcRenderer.invoke('email:templatesRemove', id),

    // Settings
    settingsGetSyncFreq: () => ipcRenderer.invoke('email:settingsGetSyncFreq'),
    settingsSetSyncFreq: (v: string) => ipcRenderer.invoke('email:settingsSetSyncFreq', v),
    settingsGetOauthCreds: () => ipcRenderer.invoke('email:settingsGetOauthCreds'),
    settingsSetOauthCreds: (creds: any) => ipcRenderer.invoke('email:settingsSetOauthCreds', creds),
    syncNow: () => ipcRenderer.invoke('email:syncNow'),

    // Events
    onSyncTick: (cb: (data: any) => void) => {
      const handler = (_: any, data: any) => cb(data);
      ipcRenderer.on('email:syncTick', handler);
      return () => ipcRenderer.removeListener('email:syncTick', handler);
    },
    onNewImportant: (cb: (email: any) => void) => {
      const handler = (_: any, email: any) => cb(email);
      ipcRenderer.on('email:newImportant', handler);
      return () => ipcRenderer.removeListener('email:newImportant', handler);
    },
    onOpenEmail: (cb: (id: string) => void) => {
      const handler = (_: any, id: string) => cb(id);
      ipcRenderer.on('email:open', handler);
      return () => ipcRenderer.removeListener('email:open', handler);
    },
  },
});

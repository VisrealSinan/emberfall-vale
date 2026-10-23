const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcher', {
  getState: () => ipcRenderer.invoke('get-state'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  play: () => ipcRenderer.invoke('play'),
  win: (cmd) => ipcRenderer.send('win', cmd),
  open: (url) => ipcRenderer.send('open', url),
  onProgress: (cb) => ipcRenderer.on('update-progress', (_e, d) => cb(d)),
});

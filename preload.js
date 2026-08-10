const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  readDir: (dirPath) => ipcRenderer.invoke('read-dir', dirPath),
  getAssetPath: (filename) => `assets/${filename}`,
  getMusicPath: (filename) => `music/${filename}`,
  logError: (err) => ipcRenderer.invoke('log-error', err)
})

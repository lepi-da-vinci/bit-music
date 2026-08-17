const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  readDir: (dirPath) => ipcRenderer.invoke('read-dir', dirPath),
  getAssetPath: (filename) => `assets/${filename}`,
  getMusicPath: (filename) => `music/${filename}`,
  logError: (err) => ipcRenderer.invoke('log-error', err),
  readLyric: (filename) => ipcRenderer.invoke('read-lyric', filename),
  saveLyric: (data) => ipcRenderer.invoke('save-lyric', data),
  fetchOnlineLyrics: (query) => ipcRenderer.invoke('fetch-online-lyrics', query)
})

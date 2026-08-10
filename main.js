const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets/vinyl_red.png')
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('read-dir', async (event, dirPath) => {
  try {
    const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(process.resourcesPath, dirPath)
    
    // In dev, use local path. In prod, use resourcesPath.
    const searchPath = app.isPackaged ? fullPath : path.join(__dirname, dirPath)
    
    if (fs.existsSync(searchPath)) {
      const files = fs.readdirSync(searchPath)
      return { success: true, files: files, basePath: searchPath }
    }
    return { success: true, files: [], basePath: searchPath }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('log-error', (event, err) => {
  fs.writeFileSync('error_log.txt', err);
})

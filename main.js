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
    const searchPath = app.isPackaged ? fullPath : path.join(__dirname, dirPath)
    
    if (fs.existsSync(searchPath)) {
      const files = fs.readdirSync(searchPath)
      const musicFiles = files.filter(f => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.ogg'))
      
      let mm;
      try {
        mm = await import('music-metadata');
      } catch (e) {
        try {
          mm = require('music-metadata');
        } catch (e2) {
          console.log("music-metadata not installed");
        }
      }

      const results = [];
      for (const f of musicFiles) {
        const filePath = path.join(searchPath, f);
        let metadata = null;
        if (mm) {
          try {
            metadata = await mm.parseFile(filePath, { duration: true });
          } catch (err) {
            console.error("Error parsing", f, err);
          }
        }
        
        let coverBase64 = null;
        let title = f.replace(/\.[^/.]+$/, "");
        let artist = "Unknown Artist";
        let genre = "Unknown";
        
        if (metadata && metadata.common) {
          if (metadata.common.title) title = metadata.common.title;
          if (metadata.common.artist) artist = metadata.common.artist;
          if (metadata.common.genre && metadata.common.genre.length > 0) {
            genre = metadata.common.genre[0]; // Take the primary genre
          }
          
          if (metadata.common.picture && metadata.common.picture.length > 0) {
            const pic = metadata.common.picture[0];
            coverBase64 = `data:${pic.format};base64,${pic.data.toString('base64')}`;
          }
        }
        
        results.push({
          filename: f,
          title: title,
          artist: artist,
          genre: genre,
          coverBase64: coverBase64
        });
      }
      
      return { success: true, files: results, basePath: searchPath }
    }
    return { success: true, files: [], basePath: searchPath }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('log-error', (event, err) => {
  fs.writeFileSync('error_log.txt', err);
})

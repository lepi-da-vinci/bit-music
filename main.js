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

function parseFilenameFallback(filename) {
  let clean = filename.replace(/\.[^/.]+$/, ""); // remove extension
  clean = clean.replace(/\[[a-zA-Z0-9_\-]+\]/g, ""); // remove YouTube IDs like [Go0_9DTaOM8]
  clean = clean.replace(/\(Official[^\)]*\)/gi, "");
  clean = clean.replace(/\(feat[^\)]*\)/gi, "");
  clean = clean.replace(/_ Lyrics[^\)]*/gi, "");
  clean = clean.trim();

  let artist = "Unknown Artist";
  let title = clean;

  if (clean.includes(" - ")) {
    const parts = clean.split(" - ");
    artist = parts[0].trim();
    title = parts.slice(1).join(" - ").trim();
  }

  return { artist, title };
}

// IPC Handlers
ipcMain.handle('read-dir', async (event, dirPath) => {
  try {
    const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(process.resourcesPath, dirPath)
    const searchPath = app.isPackaged ? fullPath : path.join(__dirname, dirPath)
    
    if (fs.existsSync(searchPath)) {
      const files = fs.readdirSync(searchPath)
      const musicFiles = files.filter(f => /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(f))
      
      let mm;
      try {
        mm = await import('music-metadata');
      } catch (e) {
        try {
          mm = require('music-metadata');
        } catch (e2) {
          // music-metadata not available
        }
      }

      const results = await Promise.all(musicFiles.map(async (f) => {
        const filePath = path.join(searchPath, f);
        let metadata = null;
        if (mm) {
          try {
            // Fast parse with 500ms timeout per file
            const parsePromise = mm.parseFile(filePath, { duration: false, skipCovers: true });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500));
            metadata = await Promise.race([parsePromise, timeoutPromise]);
          } catch (err) {
            // ignore timeout and use fallback
          }
        }
        
        const fallback = parseFilenameFallback(f);
        let title = fallback.title;
        let artist = fallback.artist;
        let genre = "Pop";
        let album = "Unknown Album";
        
        if (metadata && metadata.common) {
          if (metadata.common.title) title = metadata.common.title;
          if (metadata.common.artist) artist = metadata.common.artist;
          if (metadata.common.album) album = metadata.common.album;
          if (metadata.common.genre && metadata.common.genre.length > 0) {
            genre = metadata.common.genre[0];
          }
        }
        
        return {
          filename: f,
          title: title || f.replace(/\.[^/.]+$/, ""),
          artist: artist || "Unknown Artist",
          album: album,
          genre: genre
        };
      }));
      
      return { success: true, files: results, basePath: searchPath }
    }
    return { success: true, files: [], basePath: searchPath }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Read Lyric File (.lrc)
ipcMain.handle('read-lyric', async (event, filename) => {
  try {
    const lyricsDir = path.join(__dirname, 'lyrics');
    if (!fs.existsSync(lyricsDir)) {
      fs.mkdirSync(lyricsDir, { recursive: true });
      return { success: false, message: 'Directory created' };
    }

    const files = fs.readdirSync(lyricsDir);
    const cleanFn = (filename || '').toLowerCase().replace(/\.[^/.]+$/, '').trim();
    const cleanAlpha = cleanFn.replace(/[^a-z0-9]/g, '');

    // 1. Exact match (e.g. "Song.lrc" or "Song.mp3.lrc")
    let target = files.find(f => {
      const base = f.toLowerCase().replace(/\.lrc$/, '');
      return base === cleanFn || f.toLowerCase() === (filename || '').toLowerCase() + '.lrc';
    });

    // 2. Fuzzy match without special characters / tags
    if (!target && cleanAlpha.length >= 3) {
      target = files.find(f => {
        const fAlpha = f.toLowerCase().replace(/\.lrc$/, '').replace(/[^a-z0-9]/g, '');
        return fAlpha === cleanAlpha || fAlpha.includes(cleanAlpha) || cleanAlpha.includes(fAlpha);
      });
    }

    if (target) {
      const content = fs.readFileSync(path.join(lyricsDir, target), 'utf8');
      return { success: true, content, filename: target };
    }

    return { success: false, message: 'No local lyric file found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Save Lyric File (.lrc)
ipcMain.handle('save-lyric', async (event, data) => {
  try {
    const { filename, content } = data;
    const lyricsDir = path.join(__dirname, 'lyrics');
    if (!fs.existsSync(lyricsDir)) {
      fs.mkdirSync(lyricsDir, { recursive: true });
    }
    const safeName = (filename || 'lyric').replace(/\.[^/.]+$/, '') + '.lrc';
    const filePath = path.join(lyricsDir, safeName);
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('log-error', (event, err) => {
  fs.writeFileSync('error_log.txt', err);
})

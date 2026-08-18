const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

// Ensure 512x512 app icon exists in assets/
const srcIcon = "C:\\Users\\muham\\.gemini\\antigravity-ide\\brain\\d32b0767-6ff0-4cf6-a140-cabc35221915\\app_icon_1787052794642.jpg";
const destIcon = path.join(__dirname, 'assets/app_icon.png');
if (fs.existsSync(srcIcon) && !fs.existsSync(destIcon)) {
  try { fs.copyFileSync(srcIcon, destIcon); } catch (e) {}
}

function createWindow () {
  const iconPath = fs.existsSync(destIcon) ? destIcon : path.join(__dirname, 'assets/vinyl_red.png');
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
    icon: iconPath
  })

  win.loadFile('index.html')

  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Browser Console]: ${message}`);
  });

  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      win.webContents.toggleDevTools();
    }
  });
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

// Safe IPC Handler to avoid duplicate handler exceptions
function safeHandle(channel, handler) {
  try {
    ipcMain.removeHandler(channel);
  } catch (e) {}
  ipcMain.handle(channel, handler);
}

// IPC Handlers
safeHandle('read-dir', async (event, dirPath) => {
  try {
    const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(process.resourcesPath, dirPath);
    const searchPath = app.isPackaged ? fullPath : path.join(__dirname, dirPath);
    const cacheFile = path.join(__dirname, 'library_cache.json');
    
    if (fs.existsSync(searchPath)) {
      const files = fs.readdirSync(searchPath);
      const musicFiles = files.filter(f => /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(f));
      
      // 1. Try reading from library_cache.json for instant zero-latency startup
      let cachedMap = {};
      if (fs.existsSync(cacheFile)) {
        try {
          const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          if (Array.isArray(cacheData)) {
            cacheData.forEach(item => { if (item.filename) cachedMap[item.filename] = item; });
          }
        } catch (e) {}
      }

      // 2. Build results instantly
      const results = musicFiles.map(f => {
        if (cachedMap[f] && cachedMap[f].title && cachedMap[f].artist) {
          return cachedMap[f];
        }
        const fallback = parseFilenameFallback(f);
        return {
          filename: f,
          title: fallback.title || f.replace(/\.[^/.]+$/, ""),
          artist: fallback.artist || "Unknown Artist",
          album: fallback.title || "Unknown Album",
          genre: "Pop"
        };
      });

      // Save / update cache file
      try {
        fs.writeFileSync(cacheFile, JSON.stringify(results, null, 2), 'utf8');
      } catch (e) {}

      return { success: true, files: results, basePath: searchPath };
    }
    return { success: true, files: [], basePath: searchPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Read Lyric File (.lrc)
safeHandle('read-lyric', async (event, filename) => {
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
safeHandle('save-lyric', async (event, data) => {
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

// Convert seconds to [mm:ss.xx] format
function secToLrcTag(seconds) {
  const s = parseFloat(seconds) || 0;
  const m = Math.floor(s / 60);
  const remSec = (s % 60).toFixed(2);
  const mStr = m.toString().padStart(2, '0');
  const sStr = remSec.padStart(5, '0');
  return `[${mStr}:${sStr}]`;
}

function decodeHtmlEntities(str) {
  return (str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n/g, ' ')
    .trim();
}

// Multi-Source Online Lyrics Engine (YouTube Captions / LRCLIB / Lyrist)
safeHandle('fetch-online-lyrics', async (event, query) => {
  const { title, artist, filename } = query;
  
  let cleanTitle = (title || '').replace(/\.[^/.]+$/, '');
  cleanTitle = cleanTitle.replace(/\[[a-zA-Z0-9_\-]+\]/g, '');
  cleanTitle = cleanTitle.replace(/\(Official[^\)]*\)/gi, '');
  cleanTitle = cleanTitle.replace(/\(feat[^\)]*\)/gi, '');
  cleanTitle = cleanTitle.replace(/_ Lyrics[^\)]*/gi, '');
  cleanTitle = cleanTitle.replace(/– Twin Ver\./gi, '');
  cleanTitle = cleanTitle.replace(/\(Spider-Man[^\)]*\)/gi, '');
  cleanTitle = cleanTitle.trim();

  let cleanArtist = (artist || '').replace(/- Topic/gi, '').trim();
  if (cleanArtist === 'Unknown Artist' || cleanArtist === 'Berkas Lokal') cleanArtist = '';

  // Extract potential YouTube Video ID from filename or title
  const ytMatch = (filename || title || '').match(/(?:\[|v=|_)([a-zA-Z0-9_-]{11})(?:\]|\&|$)/);
  const ytVideoId = ytMatch ? ytMatch[1] : null;

  // 1. ENGINE 1: YouTube Timed Subtitles (Direct from YouTube captions)
  if (ytVideoId) {
    try {
      const langCodes = ['en', 'id', 'en-US', 'a.en', ''];
      for (const lang of langCodes) {
        const ytUrl = lang 
          ? `https://www.youtube.com/api/timedtext?v=${ytVideoId}&lang=${lang}`
          : `https://www.youtube.com/api/timedtext?v=${ytVideoId}`;
        
        const ytRes = await fetch(ytUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (ytRes.ok) {
          const xml = await ytRes.text();
          if (xml && xml.includes('<text start=')) {
            const matches = [...xml.matchAll(/<text start="([^"]+)"(?: dur="[^"]+")?>([^<]+)<\/text>/g)];
            if (matches.length > 5) {
              const lrcLines = matches.map(m => {
                const tag = secToLrcTag(m[1]);
                const text = decodeHtmlEntities(m[2]);
                return `${tag} ${text}`;
              }).filter(l => l.trim().length > 10);

              if (lrcLines.length > 5) {
                const fullLrc = `[ti:${cleanTitle}]\n[ar:${cleanArtist || 'YouTube Music'}]\n[by:YouTube Music Subtitles]\n` + lrcLines.join('\n');
                // Auto-save to local lyrics/
                try {
                  const lyricsDir = path.join(__dirname, 'lyrics');
                  if (!fs.existsSync(lyricsDir)) fs.mkdirSync(lyricsDir, { recursive: true });
                  const safeName = (filename || cleanTitle).replace(/\.[^/.]+$/, '') + '.lrc';
                  fs.writeFileSync(path.join(lyricsDir, safeName), fullLrc, 'utf8');
                } catch (e) {}

                return { success: true, synced: true, content: fullLrc, source: '📺 YOUTUBE MUSIC CAPTIONS' };
              }
            }
          }
        }
      }
    } catch (e) {}
  }

  // 2. ENGINE 2: LRCLIB API (Direct Get & Broad Search)
  try {
    let getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}`;
    if (cleanArtist) getUrl += `&artist_name=${encodeURIComponent(cleanArtist)}`;
    const lrcRes = await fetch(getUrl);
    if (lrcRes.ok) {
      const data = await lrcRes.json();
      if (data.syncedLyrics && data.syncedLyrics.length > 30) {
        try {
          const lyricsDir = path.join(__dirname, 'lyrics');
          if (!fs.existsSync(lyricsDir)) fs.mkdirSync(lyricsDir, { recursive: true });
          const safeName = (filename || cleanTitle).replace(/\.[^/.]+$/, '') + '.lrc';
          fs.writeFileSync(path.join(lyricsDir, safeName), data.syncedLyrics, 'utf8');
        } catch (e) {}
        return { success: true, synced: true, content: data.syncedLyrics, source: '🌐 LRCLIB SINKRON' };
      }
      if (data.plainLyrics && data.plainLyrics.length > 30) {
        return { success: true, synced: false, content: data.plainLyrics, source: '📄 LRCLIB TEKS' };
      }
    }
  } catch (e) {}

  try {
    const searchQuery = cleanArtist ? `${cleanTitle} ${cleanArtist}` : cleanTitle;
    const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`);
    if (searchRes.ok) {
      const list = await searchRes.json();
      if (Array.isArray(list) && list.length > 0) {
        const syncedItem = list.find(item => item.syncedLyrics && item.syncedLyrics.length > 30);
        if (syncedItem) {
          try {
            const lyricsDir = path.join(__dirname, 'lyrics');
            if (!fs.existsSync(lyricsDir)) fs.mkdirSync(lyricsDir, { recursive: true });
            const safeName = (filename || cleanTitle).replace(/\.[^/.]+$/, '') + '.lrc';
            fs.writeFileSync(path.join(lyricsDir, safeName), syncedItem.syncedLyrics, 'utf8');
          } catch (e) {}
          return { success: true, synced: true, content: syncedItem.syncedLyrics, source: '🌐 LRCLIB SINKRON' };
        }
        if (list[0].plainLyrics && list[0].plainLyrics.length > 30) {
          return { success: true, synced: false, content: list[0].plainLyrics, source: '📄 LRCLIB TEKS' };
        }
      }
    }
  } catch (e) {}

  // 3. ENGINE 3: Lyrist Web Lyrics API (Complete Formatted Text Lyrics)
  try {
    const lyristQuery = cleanArtist 
      ? `https://lyrist.vercel.app/api/${encodeURIComponent(cleanTitle)}/${encodeURIComponent(cleanArtist)}`
      : `https://lyrist.vercel.app/api/${encodeURIComponent(cleanTitle)}`;
    
    const lyristRes = await fetch(lyristQuery);
    if (lyristRes.ok) {
      const lyristData = await lyristRes.json();
      if (lyristData && lyristData.lyrics && lyristData.lyrics.length > 30) {
        return { success: true, synced: false, content: lyristData.lyrics, source: '📖 WEB LYRICS (GENIUS/SPOTIFY)' };
      }
    }
  } catch (e) {}

  return { success: false, message: 'Lirik tidak ditemukan di semua sumber online' };
});

safeHandle('log-error', (event, err) => {
  console.error('[Renderer Error]:', err);
  try {
    fs.appendFileSync(path.join(__dirname, 'error_log.txt'), `${new Date().toISOString()}: ${err}\n`);
  } catch (e) {}
  return true;
});

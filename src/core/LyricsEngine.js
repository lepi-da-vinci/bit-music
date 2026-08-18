// Multi-Source Lyrics & Karaoke Synchronization Engine

import { BUILTIN_LRC } from '../data/builtinLyrics.js';
import { state } from './StateManager.js';
import { sfx } from '../ui/SFXEngine.js';

export class LyricsEngine {
  constructor() {
    this.currentLyrics = [];
    this.currentLyricsData = { list: [], sourceBadge: '', isSynced: false, rawText: '' };
    this.currentTrackKey = '';
    this.currentOffset = 0.0;
    this.currentMode = localStorage.getItem('preferred_lyric_mode') || 'karaoke';
    this.fontSizes = ['font-sm', 'font-md', 'font-lg'];
    this.fontSizeIdx = parseInt(localStorage.getItem('lyric_font_size_idx') || '1', 10);
    this.isFullscreen = false;
  }

  parseLRC(lrcText) {
    if (!lrcText || typeof lrcText !== 'string') return [];
    const lines = lrcText.split('\n');
    const result = [];
    const timeRegex = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;

      const matches = [...line.matchAll(timeRegex)];
      if (matches.length > 0) {
        const text = line.replace(timeRegex, '').trim();
        if (text) {
          matches.forEach(m => {
            const min = parseInt(m[1], 10);
            const sec = parseInt(m[2], 10);
            const msStr = m[3] || '0';
            const ms = msStr.length === 2 ? parseInt(msStr, 10) / 100 : parseInt(msStr, 10) / 1000;
            const totalSeconds = min * 60 + sec + ms;
            result.push({ time: totalSeconds, text });
          });
        }
      }
    });

    result.sort((a, b) => a.time - b.time);

    // If first lyric is after 3.5s, prepend an intro marker
    if (result.length > 0 && result[0].time > 3.5) {
      result.unshift({ time: 0, text: '🎵 [Intro Instrumental]' });
    }

    return result;
  }

  loadTrackOffset(trackKey) {
    const saved = localStorage.getItem(`lyric_offset_${trackKey}`);
    this.currentOffset = saved ? parseFloat(saved) : 0.0;
    this.updateOffsetDisplay();
  }

  updateOffsetDisplay() {
    const valEl = document.getElementById('lyric-offset-val');
    if (valEl) {
      valEl.innerText = `${this.currentOffset >= 0 ? '+' : ''}${this.currentOffset.toFixed(1)}s`;
      valEl.style.color = this.currentOffset === 0 ? '#00ffcc' : (this.currentOffset > 0 ? '#ffeb3b' : '#ff007f');
    }
  }

  setOffset(delta) {
    this.currentOffset = Math.round((this.currentOffset + delta) * 10) / 10;
    this.updateOffsetDisplay();
    if (this.currentTrackKey) {
      localStorage.setItem(`lyric_offset_${this.currentTrackKey}`, this.currentOffset.toString());
    }
    state.emit('lyricOffsetChanged', this.currentOffset);
  }

  resetOffset() {
    this.currentOffset = 0.0;
    this.updateOffsetDisplay();
    if (this.currentTrackKey) {
      localStorage.removeItem(`lyric_offset_${this.currentTrackKey}`);
    }
    state.emit('lyricOffsetChanged', 0);
  }

  setMode(mode) {
    this.currentMode = mode;
    localStorage.setItem('preferred_lyric_mode', mode);
    state.emit('lyricModeChanged', mode);
  }

  setFontSize(delta) {
    this.fontSizeIdx = Math.max(0, Math.min(this.fontSizes.length - 1, this.fontSizeIdx + delta));
    localStorage.setItem('lyric_font_size_idx', this.fontSizeIdx.toString());
    state.emit('lyricFontSizeChanged', this.fontSizes[this.fontSizeIdx]);
  }

  async fetchLyrics(track, forceReload = false) {
    if (!track) return { list: [], isSynced: false };
    const trackKey = track.filename || track.title;

    if (!forceReload && this.currentTrackKey === trackKey && this.currentLyrics.length > 0) {
      return this.currentLyricsData;
    }

    this.currentTrackKey = trackKey;
    this.loadTrackOffset(trackKey);

    const cleanFn = (track.filename || track.title || '').toLowerCase().replace(/\.[^/.]+$/, '').trim();
    const cleanAlpha = cleanFn.replace(/[^a-z0-9]/g, '');

    // 1. Check local lyrics/ folder via direct fetch and IPC
    try {
      const directRes = await fetch(`lyrics/${encodeURIComponent(track.filename.replace(/\.[^/.]+$/, ''))}.lrc`);
      if (directRes.ok) {
        const txt = await directRes.text();
        if (txt && txt.length > 30) {
          this.currentLyrics = this.parseLRC(txt);
          this.currentLyricsData = {
            list: this.currentLyrics,
            sourceBadge: '📁 LIRIK LOKAL (lyrics/)',
            isSynced: true,
            rawText: this.currentLyrics.map(l => l.text).join('\n')
          };
          return this.currentLyricsData;
        }
      }
    } catch (e) {}

    if (window.api && window.api.readLyric) {
      try {
        const localRes = await window.api.readLyric(track.filename);
        if (localRes && localRes.success && localRes.content && localRes.content.length > 30) {
          this.currentLyrics = this.parseLRC(localRes.content);
          if (this.currentLyrics.length > 0) {
            this.currentLyricsData = {
              list: this.currentLyrics,
              sourceBadge: '📁 LIRIK LOKAL (lyrics/)',
              isSynced: true,
              rawText: this.currentLyrics.map(l => l.text).join('\n')
            };
            return this.currentLyricsData;
          }
        }
      } catch (e) {}
    }

    // 2. Check built-in memory map
    for (const [key, lrcVal] of Object.entries(BUILTIN_LRC)) {
      const keyAlpha = key.replace(/[^a-z0-9]/g, '');
      if (cleanAlpha.includes(keyAlpha) || keyAlpha.includes(cleanAlpha)) {
        this.currentLyrics = this.parseLRC(lrcVal);
        this.currentLyricsData = {
          list: this.currentLyrics,
          sourceBadge: '📁 LIRIK LOKAL (lyrics/)',
          isSynced: true,
          rawText: this.currentLyrics.map(l => l.text).join('\n')
        };
        return this.currentLyricsData;
      }
    }

    // 3. Check online search via Electron main IPC
    if (window.api && window.api.fetchOnlineLyrics) {
      try {
        const res = await window.api.fetchOnlineLyrics({
          title: track.title,
          artist: track.artist,
          filename: track.filename
        });

        if (res && res.success && res.content) {
          if (res.synced) {
            this.currentLyrics = this.parseLRC(res.content);
            this.currentLyricsData = {
              list: this.currentLyrics,
              sourceBadge: res.source || '🌐 LRCLIB SINKRON',
              isSynced: true,
              rawText: this.currentLyrics.map(l => l.text).join('\n')
            };
            return this.currentLyricsData;
          } else {
            const plainLines = res.content.split('\n').filter(l => l.trim().length > 0);
            this.currentLyrics = plainLines.map((text, i) => ({
              time: i * 5,
              text: text.trim()
            }));
            this.currentLyricsData = {
              list: this.currentLyrics,
              sourceBadge: res.source || '📖 LIRIK TEKS',
              isSynced: false,
              rawText: res.content
            };
            return this.currentLyricsData;
          }
        }
      } catch (e) {}
    }

    // 4. Fallback: Not found
    this.currentLyrics = [];
    this.currentLyricsData = { list: [], sourceBadge: '', isSynced: false, rawText: '' };
    return this.currentLyricsData;
  }
}

export const lyricsEngine = new LyricsEngine();

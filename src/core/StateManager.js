// Central Reactive State Store for Retro Groove Music Player

const STORAGE_KEYS = {
  FAVORITES: 'retro_groove_favorites',
  CUSTOM_PLAYLISTS: 'retro_groove_custom_playlists',
  PLAY_HISTORY: 'retro_groove_play_history',
  PLAY_COUNTS: 'retro_groove_play_counts',
  PLAYBACK_STATE: 'retro_groove_playback_state',
  SETTINGS: 'retro_groove_settings'
};

class StateManager {
  constructor() {
    this.masterPlaylist = [];
    this.playlist = [];
    this.albumMap = {};
    this.currentIndex = -1;
    this.currentActiveAlbum = 'all';
    this.isPlaying = false;
    this.isShuffled = false;
    this.isRepeat = false;
    this.previousView = 'home';
    this.currentView = 'home';
    
    // Playback state & history
    this.favorites = this._loadJson(STORAGE_KEYS.FAVORITES, []);
    this.customPlaylists = this._loadJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, []);
    this.playHistory = this._loadJson(STORAGE_KEYS.PLAY_HISTORY, []);
    this.playCounts = this._loadJson(STORAGE_KEYS.PLAY_COUNTS, {});
    
    // Settings
    this.settings = this._loadJson(STORAGE_KEYS.SETTINGS, {
      crossfade: true,
      crossfadeDuration: 3, // seconds
      normalization: true,
      sfxEnabled: true,
      darkMode: true,
      lofiNoise: false,
      autoMix: false,
      preferredLyricMode: 'karaoke'
    });

    this.listeners = new Map();
  }

  _loadJson(key, defaultValue) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  _saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }

  // Event Subscription System
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try { cb(data); } catch (err) { console.error(`Error in event listener for ${event}:`, err); }
      });
    }
  }

  // Current Track Helper
  getCurrentTrack() {
    if (this.currentIndex >= 0 && this.currentIndex < this.playlist.length) {
      return this.playlist[this.currentIndex];
    }
    return null;
  }

  // Favorites Management
  isFavorite(filename) {
    if (!filename) return false;
    return this.favorites.includes(filename);
  }

  toggleFavorite(track) {
    if (!track || !track.filename) return false;
    let added = false;
    if (this.favorites.includes(track.filename)) {
      this.favorites = this.favorites.filter(f => f !== track.filename);
      added = false;
    } else {
      this.favorites.push(track.filename);
      added = true;
    }
    this._saveJson(STORAGE_KEYS.FAVORITES, this.favorites);
    this.emit('favoritesChanged', { track, isFavorite: added, favorites: this.favorites });
    return added;
  }

  // Custom Playlists Management
  createCustomPlaylist(name) {
    if (!name || !name.trim()) return null;
    const newPl = {
      id: 'pl_' + Date.now(),
      name: name.trim(),
      trackFilenames: []
    };
    this.customPlaylists.push(newPl);
    this._saveJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, this.customPlaylists);
    this.emit('playlistsChanged', this.customPlaylists);
    return newPl;
  }

  addTrackToCustomPlaylist(playlistId, filename) {
    const pl = this.customPlaylists.find(p => p.id === playlistId);
    if (!pl) return false;
    if (!pl.trackFilenames.includes(filename)) {
      pl.trackFilenames.push(filename);
      this._saveJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, this.customPlaylists);
      this.emit('playlistsChanged', this.customPlaylists);
      return true;
    }
    return false;
  }

  removeTrackFromCustomPlaylist(playlistId, filename) {
    const pl = this.customPlaylists.find(p => p.id === playlistId);
    if (!pl) return false;
    pl.trackFilenames = pl.trackFilenames.filter(f => f !== filename);
    this._saveJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, this.customPlaylists);
    this.emit('playlistsChanged', this.customPlaylists);
    return true;
  }

  renameCustomPlaylist(playlistId, newName) {
    if (!newName || !newName.trim()) return null;
    const pl = this.customPlaylists.find(p => p.id === playlistId);
    if (!pl) return null;
    pl.name = newName.trim();
    this._saveJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, this.customPlaylists);
    this.emit('playlistsChanged', this.customPlaylists);
    return pl;
  }

  deleteCustomPlaylist(playlistId) {
    this.customPlaylists = this.customPlaylists.filter(p => p.id !== playlistId);
    this._saveJson(STORAGE_KEYS.CUSTOM_PLAYLISTS, this.customPlaylists);
    this.emit('playlistsChanged', this.customPlaylists);
  }

  // Play History & Analytics
  recordPlayHistory(track) {
    if (!track || !track.filename) return;

    // 1. Update play count
    const count = (this.playCounts[track.filename] || 0) + 1;
    this.playCounts[track.filename] = count;
    this._saveJson(STORAGE_KEYS.PLAY_COUNTS, this.playCounts);

    // 2. Add to history (remove previous duplicates and put at start)
    this.playHistory = this.playHistory.filter(h => h.filename !== track.filename);
    this.playHistory.unshift({
      filename: track.filename,
      title: track.title,
      artist: track.artist,
      album: track.album,
      genre: track.genre,
      coverBase64: track.coverBase64,
      vinylColor: track.vinylColor,
      timestamp: Date.now()
    });

    // Keep last 100 entries
    if (this.playHistory.length > 100) {
      this.playHistory = this.playHistory.slice(0, 100);
    }
    this._saveJson(STORAGE_KEYS.PLAY_HISTORY, this.playHistory);
    this.emit('historyUpdated', { history: this.playHistory, track });
  }

  getRecentlyPlayed(limit = 12) {
    return this.playHistory.slice(0, limit);
  }

  getMostPlayed(limit = 12) {
    const sorted = [...this.masterPlaylist].sort((a, b) => {
      const countA = this.playCounts[a.filename] || 0;
      const countB = this.playCounts[b.filename] || 0;
      return countB - countA;
    });
    return sorted.filter(t => (this.playCounts[t.filename] || 0) > 0).slice(0, limit);
  }

  // Settings Management
  updateSetting(key, value) {
    this.settings[key] = value;
    this._saveJson(STORAGE_KEYS.SETTINGS, this.settings);
    this.emit('settingChanged', { key, value, settings: this.settings });
  }

  // Persistent Playback State (Resume feature)
  savePlaybackState(currentTime = 0, volume = 0.5) {
    const currentTrack = this.getCurrentTrack();
    if (!currentTrack) return;

    const state = {
      filename: currentTrack.filename,
      currentTime: currentTime || 0,
      volume: volume,
      currentActiveAlbum: this.currentActiveAlbum,
      isShuffled: this.isShuffled,
      isRepeat: this.isRepeat,
      timestamp: Date.now()
    };
    this._saveJson(STORAGE_KEYS.PLAYBACK_STATE, state);
  }

  loadPlaybackState() {
    return this._loadJson(STORAGE_KEYS.PLAYBACK_STATE, null);
  }
}

export const state = new StateManager();

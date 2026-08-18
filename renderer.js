// Retro Groove Music Player — Main Application Orchestrator
window.onerror = function(msg, url, line, col, error) {
  console.error("Global Renderer Error:", msg, url, line, col, error);
  if (window.api && window.api.logError) {
    window.api.logError(`Global Error: ${msg} at ${url}:${line}:${col}\n${error ? error.stack : ''}`);
  }
};
window.onunhandledrejection = function(event) {
  console.error("Unhandled Rejection:", event.reason);
  if (window.api && window.api.logError) {
    window.api.logError(`Unhandled Rejection: ${event.reason ? (event.reason.stack || event.reason) : ''}`);
  }
};

import { state } from './src/core/StateManager.js';
import { AudioEngine } from './src/core/AudioEngine.js';
import { lyricsEngine } from './src/core/LyricsEngine.js';
import { ViewRouter } from './src/ui/ViewRouter.js';
import { sfx } from './src/ui/SFXEngine.js';
import {
  generateProceduralCover,
  generatePixelHeartCover,
  generatePixelPlaylistCover,
  generateArtistPixelAvatar,
  getThemeColor
} from './src/ui/PixelArtGenerator.js';
import {
  SMART_ALBUM_DEFS,
  FEATURED_MIX_DEFS,
  MOOD_KEYWORDS,
  RETRO_GENRES
} from './src/data/smartAlbumDefs.js';
import { PRELOADED_TRACKS } from './src/data/preloadedTracks.js';
import {
  showToast,
  showCreatePlaylistModal,
  showRenamePlaylistModal,
  showAddToPlaylistModal,
  showPlaylistOptionsMenu,
  showSelectTracksModal,
  showRetroConfirmModal,
  showSettingsModal,
  showCommandPalette
} from './src/ui/ComponentRenderer.js';

try {
  // Icons Constants
  const ICONS = {
    play: '<img class="pixel-icon" src="assets/icons/icon_play.bmp">',
    pause: '<img class="pixel-icon" src="assets/icons/icon_pause.bmp">',
    up: '<img class="pixel-icon" src="assets/icons/icon_up.bmp">',
    down: '<img class="pixel-icon" src="assets/icons/icon_down.bmp">'
  };

  const vinylColors = ['red', 'blue', 'green', 'purple', 'orange', 'teal'];

  // DOM Elements
  const audioEl = document.getElementById('audio-player');
  const audioEngine = new AudioEngine(audioEl);
  const router = new ViewRouter();

  const vinylContainer = document.getElementById('vinyl-container');
  const vinylDisc = document.getElementById('vinyl-disc');
  const toneArm = document.getElementById('tone-arm');
  const playBtnIcon = document.getElementById('icon-play');
  const timeDisplay = document.getElementById('time-display');
  const progressBg = document.getElementById('progress-bg');
  const progressFill = document.getElementById('progress-fill');
  const progressThumb = document.getElementById('progress-thumb');
  const volSlider = document.getElementById('vol-slider');
  const lcdTitle = document.getElementById('lcd-title');
  const lcdArtist = document.getElementById('lcd-artist');
  const playlistContainer = document.getElementById('playlist-list');

  // Bottom Player Elements
  const bpPrev = document.getElementById('bp-prev');
  const bpPlay = document.getElementById('bp-play');
  const bpNext = document.getElementById('bp-next');
  const bpTime = document.getElementById('bp-time');
  const bpTitle = document.getElementById('bp-title');
  const bpArtist = document.getElementById('bp-artist');
  const bpArt = document.getElementById('bp-album-art');
  const bpLike = document.getElementById('bp-like');
  const bpDislike = document.getElementById('bp-dislike');
  const bpRepeat = document.getElementById('bp-repeat');
  const bpShuffle = document.getElementById('bp-shuffle');
  const bpQueueBtn = document.getElementById('bp-queue-btn');
  const bpLyricsBtn = document.getElementById('bp-lyrics-btn');
  const bpMiniBtn = document.getElementById('bp-mini-btn');
  const bpSfxToggle = document.getElementById('bp-sfx-toggle');

  // Format seconds to mm:ss
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Tone Arm Physics Animation
  function updateToneArm() {
    if (!toneArm) return;
    if (!state.isPlaying && !audioEngine.isToneArmDragging) {
      toneArm.style.transform = 'rotate(-32deg) scale(0.8)';
      return;
    }
    const current = audioEngine.getCurrentTime();
    const duration = audioEngine.getDuration();
    const pct = (current && duration) ? (current / duration) : 0;
    const targetAngle = -14 + (pct * 16);
    toneArm.style.transform = `rotate(${targetAngle}deg) scale(0.8)`;
  }

  // Dynamic Theme & Ambient Background Lighting
  function updateAmbientTheme(track) {
    const ambientGlow = document.getElementById('ambient-glow');
    if (!ambientGlow || !track) return;
    const theme = getThemeColor(track.vinylColor || 'teal');
    ambientGlow.style.background = `radial-gradient(circle at 60% 40%, rgba(${theme.rgb}, 0.25) 0%, transparent 70%)`;
  }

  // Auto-generate Curated Smart Albums
  function autoGenerateSmartAlbums(force = false) {
    let list = state.customPlaylists;
    if (!force && list.length >= 4) return 0;

    let createdCount = 0;
    const existingNames = new Set(list.map(p => p.name.toLowerCase()));

    SMART_ALBUM_DEFS.forEach(def => {
      const matchingTracks = state.masterPlaylist.filter(t =>
        def.pattern.test(t.title + ' ' + t.artist + ' ' + t.filename)
      );
      if (matchingTracks.length > 0 && !existingNames.has(def.name.toLowerCase())) {
        const newPl = {
          id: 'pl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: def.name,
          trackFilenames: matchingTracks.map(t => t.filename)
        };
        list.push(newPl);
        createdCount++;
      }
    });

    const allAssigned = new Set();
    list.forEach(pl => pl.trackFilenames.forEach(f => allAssigned.add(f)));
    const unassigned = state.masterPlaylist.filter(t => !allAssigned.has(t.filename));
    if (unassigned.length > 0 && !existingNames.has('koleksi lagu lainnya')) {
      list.push({
        id: 'pl_' + Date.now() + '_other',
        name: 'Koleksi Lagu Lainnya',
        trackFilenames: unassigned.map(t => t.filename)
      });
      createdCount++;
    }

    state.customPlaylists = list;
    state._saveJson('retro_groove_custom_playlists', list);
    return createdCount;
  }

  // Track Loading & UI State Sync
  function loadTrack(index) {
    if (!state.playlist || state.playlist.length === 0) return;
    state.currentIndex = Math.max(0, Math.min(state.playlist.length - 1, index));
    const track = state.getCurrentTrack();
    if (!track) return;

    if (lcdTitle) lcdTitle.innerText = track.title;
    if (lcdArtist) lcdArtist.innerText = track.artist;

    // Scrolling Marquee on LCD
    if (lcdTitle) {
      lcdTitle.classList.remove('scrolling');
      setTimeout(() => {
        if (lcdTitle.scrollWidth > lcdTitle.parentElement.clientWidth) {
          lcdTitle.classList.add('scrolling');
        }
      }, 50);
    }

    // Center Album Art
    const albumArt = document.getElementById('album-art');
    if (albumArt) {
      if (track.coverBase64) {
        albumArt.style.backgroundImage = `url('${track.coverBase64}')`;
        albumArt.style.display = 'block';
      } else {
        albumArt.style.backgroundImage = 'none';
        albumArt.style.display = 'none';
      }
    }

    // Bottom Player Now Playing
    if (bpTitle) bpTitle.innerText = track.title;
    if (bpArtist) bpArtist.innerText = track.artist;
    if (bpArt) {
      bpArt.style.backgroundImage = track.coverBase64 ? `url('${track.coverBase64}')` : 'none';
    }

    // Vinyl Disc Image Switch
    if (vinylDisc) {
      vinylDisc.style.opacity = 0;
      setTimeout(() => {
        vinylDisc.src = window.api ? window.api.getAssetPath(`vinyl_${track.vinylColor}.png`) : `assets/vinyl_${track.vinylColor}.png`;
        vinylDisc.style.opacity = 1;
      }, 150);
    }

    updateFavoritesUI();
    updatePlaylistUI();
    updateQueueDrawer();
    updateMiniPlayerUI();
    updateLyricsDrawer();
    updateAmbientTheme(track);
    updateMediaSession(track);

    // Save resume state
    state.savePlaybackState(0, audioEngine.getVolume());
  }

  // Playback Control Functions
  function playTrack() {
    const track = state.getCurrentTrack();
    if (!track) return;

    audioEngine.playDirect(track.path).then(() => {
      state.isPlaying = true;
      state.recordPlayHistory(track);
      if (playBtnIcon) playBtnIcon.src = window.api ? window.api.getAssetPath('btn_start_stop_active.png') : 'assets/btn_start_stop_active.png';
      if (bpPlay) bpPlay.innerHTML = ICONS.pause;
      updateToneArm();
      updateMiniPlayerUI();
      sfx.play('play');
      refreshHistorySections();
    }).catch(err => console.warn("Play error:", err));
  }

  function pauseTrack() {
    state.isPlaying = false;
    audioEngine.pause();
    if (playBtnIcon) playBtnIcon.src = window.api ? window.api.getAssetPath('btn_start_stop.png') : 'assets/btn_start_stop.png';
    if (bpPlay) bpPlay.innerHTML = ICONS.play;
    updateToneArm();
    updateMiniPlayerUI();
    sfx.play('pause');
  }

  function togglePlay() {
    if (state.isPlaying) {
      pauseTrack();
    } else {
      if (state.currentIndex === -1 && state.playlist.length > 0) {
        loadTrack(0);
      }
      playTrack();
    }
  }

  function playNextTrack() {
    if (!state.playlist || state.playlist.length === 0) return;

    if (state.isRepeat) {
      audioEngine.seek(0);
      playTrack();
      return;
    }

    let nextIdx = state.currentIndex + 1;
    if (state.isShuffled && state.playlist.length > 1) {
      let randIdx = Math.floor(Math.random() * state.playlist.length);
      if (randIdx === state.currentIndex) {
        randIdx = (randIdx + 1) % state.playlist.length;
      }
      nextIdx = randIdx;
    }

    if (nextIdx < state.playlist.length) {
      loadTrack(nextIdx);
      playTrack();
    } else {
      loadTrack(0);
      playTrack();
    }
  }

  function playPrevTrack() {
    if (!state.playlist || state.playlist.length === 0) return;

    if (audioEngine.getCurrentTime() > 3) {
      audioEngine.seek(0);
      playTrack();
      return;
    }

    let prevIdx = state.currentIndex - 1;
    if (prevIdx < 0) {
      prevIdx = state.playlist.length - 1;
    }
    loadTrack(prevIdx);
    playTrack();
  }

  // Shuffle & Repeat Unified State
  function setShuffleState(active, notify = true) {
    state.isShuffled = !!active;

    const btnShuffle = document.getElementById('btn-shuffle');
    const iconShuffle = document.getElementById('icon-shuffle');
    const ledTtShuffle = document.getElementById('led-tt-shuffle');
    const bpShuffleEl = document.getElementById('bp-shuffle');
    const ledBpShuffle = document.getElementById('led-bp-shuffle');
    const btnAlbumShuffle = document.getElementById('btn-album-shuffle');

    if (btnShuffle) btnShuffle.classList.toggle('active', state.isShuffled);
    if (iconShuffle) iconShuffle.style.opacity = state.isShuffled ? '1' : '0.4';
    if (ledTtShuffle) ledTtShuffle.classList.toggle('active', state.isShuffled);
    if (bpShuffleEl) bpShuffleEl.classList.toggle('active', state.isShuffled);
    if (ledBpShuffle) ledBpShuffle.classList.toggle('active', state.isShuffled);
    if (btnAlbumShuffle) btnAlbumShuffle.classList.toggle('active', state.isShuffled);

    if (notify) {
      showToast(state.isShuffled ? '🔀 Putar Acak (Shuffle): AKTIF' : '▶️ Putar Berurutan: AKTIF');
      sfx.play(state.isShuffled ? 'powerup' : 'click');
    }
  }

  function setRepeatState(active, notify = true) {
    state.isRepeat = !!active;

    const btnRepeat = document.getElementById('btn-repeat');
    const iconRepeat = document.getElementById('icon-repeat');
    const ledTtRepeat = document.getElementById('led-tt-repeat');
    const bpRepeatEl = document.getElementById('bp-repeat');
    const ledBpRepeat = document.getElementById('led-bp-repeat');

    if (btnRepeat) btnRepeat.classList.toggle('active', state.isRepeat);
    if (iconRepeat) iconRepeat.style.opacity = state.isRepeat ? '1' : '0.4';
    if (ledTtRepeat) ledTtRepeat.classList.toggle('active', state.isRepeat);
    if (bpRepeatEl) bpRepeatEl.classList.toggle('active', state.isRepeat);
    if (ledBpRepeat) ledBpRepeat.classList.toggle('active', state.isRepeat);

    if (notify) {
      showToast(state.isRepeat ? '🔁 Ulangi Lagu (Repeat): AKTIF' : '➡️ Ulangi Lagu: NONAKTIF');
      sfx.play(state.isRepeat ? 'like' : 'click');
    }
  }

  // Favorites UI Sync
  function updateFavoritesUI() {
    const currentTrack = state.getCurrentTrack();
    if (bpLike && currentTrack) {
      const isFav = state.isFavorite(currentTrack.filename);
      bpLike.classList.toggle('icon-active', isFav);
    }
    document.querySelectorAll('.library-track-item, .quick-pick-item').forEach(el => {
      const filename = el.getAttribute('data-filename');
      const likeBtn = el.querySelector('.track-like, .qp-like');
      if (likeBtn && filename) {
        likeBtn.classList.toggle('icon-active', state.isFavorite(filename));
      }
    });
  }

  // Turntable Left Pillar Album List
  function renderPlayerAlbumList() {
    const albumContainer = document.getElementById('album-list');
    if (!albumContainer) return;

    let html = `
      <div class="album-item ${state.currentActiveAlbum === 'all' ? 'active' : ''}" data-album="all">
        <div class="album-title">All Tracks</div>
        <div class="album-tracks">${state.masterPlaylist.length} tracks</div>
      </div>
      <div class="album-item ${state.currentActiveAlbum === '__LIKED_SONGS__' ? 'active' : ''}" data-album="__LIKED_SONGS__">
        <div class="album-title">❤️ Lagu Disukai</div>
        <div class="album-tracks">${state.masterPlaylist.filter(t => state.isFavorite(t.filename)).length} tracks</div>
      </div>
    `;

    state.customPlaylists.forEach(pl => {
      html += `
        <div class="album-item ${state.currentActiveAlbum === 'CUSTOM_' + pl.id ? 'active' : ''}" data-album="CUSTOM_${pl.id}">
          <div class="album-title">📀 ${pl.name}</div>
          <div class="album-tracks">${pl.trackFilenames.length} tracks</div>
        </div>
      `;
    });

    albumContainer.innerHTML = html;

    albumContainer.querySelectorAll('.album-item').forEach(el => {
      el.onclick = () => {
        const selected = el.getAttribute('data-album');
        state.currentActiveAlbum = selected;
        albumContainer.querySelectorAll('.album-item').forEach(a => a.classList.remove('active'));
        el.classList.add('active');

        if (selected === 'all') {
          state.playlist = [...state.masterPlaylist];
        } else if (selected === '__LIKED_SONGS__') {
          state.playlist = state.masterPlaylist.filter(t => state.isFavorite(t.filename));
        } else if (selected.startsWith('CUSTOM_')) {
          const plId = selected.replace('CUSTOM_', '');
          const pl = state.customPlaylists.find(p => p.id === plId);
          state.playlist = pl ? state.masterPlaylist.filter(t => pl.trackFilenames.includes(t.filename)) : [];
        } else {
          state.playlist = state.albumMap[selected] || [];
        }

        renderPlaylist();
        if (state.playlist.length > 0) {
          loadTrack(0);
          playTrack();
        } else {
          showToast('Album/Playlist ini belum memiliki lagu');
        }
      };
    });
  }

  // Playlist Items Rendering
  function renderPlaylist() {
    if (!playlistContainer) return;
    playlistContainer.innerHTML = '';
    const rgbColors = {
      'red': '255, 80, 100', 'blue': '80, 150, 255', 'green': '80, 220, 100',
      'purple': '180, 80, 220', 'orange': '255, 170, 60', 'teal': '60, 200, 180'
    };

    state.playlist.forEach((track, index) => {
      const el = document.createElement('div');
      el.className = `track-item ${index === state.currentIndex ? 'active' : ''}`;
      el.innerHTML = `
        <div class="track-dot" style="background: rgb(${rgbColors[track.vinylColor] || '0, 255, 204'})"></div>
        <div class="track-info">
          <div class="track-title">${track.title}</div>
          <div class="track-artist">${track.artist}</div>
        </div>
      `;
      el.onclick = () => {
        loadTrack(index);
        playTrack();
      };
      playlistContainer.appendChild(el);
    });
  }

  function updatePlaylistUI() {
    document.querySelectorAll('.track-item').forEach((el, idx) => {
      el.classList.toggle('active', idx === state.currentIndex);
    });
    document.querySelectorAll('.album-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-album') === state.currentActiveAlbum);
    });
  }

  // Refresh Recently Played & Most Played Sections on Home
  function refreshHistorySections() {
    const recSection = document.getElementById('section-recently-played');
    const recContainer = document.getElementById('home-recently-played');
    const mostSection = document.getElementById('section-most-played');
    const mostContainer = document.getElementById('home-most-played');

    const recentList = state.getRecentlyPlayed(12);
    if (recentList.length > 0 && recSection && recContainer) {
      recSection.style.display = 'block';
      recContainer.innerHTML = '';
      recentList.forEach(track => {
        const cover = track.coverBase64 ? `url('${track.coverBase64}')` : '#222';
        const card = document.createElement('div');
        card.className = 'album-card track-card';
        card.innerHTML = `
          <div class="album-card-art" style="background: ${cover}; background-size: cover; background-position: center;"></div>
          <div class="album-card-title">${track.title}</div>
          <div class="album-card-artist">${track.artist}</div>
        `;
        card.onclick = () => {
          const idx = state.masterPlaylist.findIndex(t => t.filename === track.filename);
          state.playlist = [...state.masterPlaylist];
          loadTrack(idx >= 0 ? idx : 0);
          playTrack();
          router.navigate('player');
        };
        recContainer.appendChild(card);
      });
    }

    const mostList = state.getMostPlayed(12);
    if (mostList.length > 0 && mostSection && mostContainer) {
      mostSection.style.display = 'block';
      mostContainer.innerHTML = '';
      mostList.forEach(track => {
        const cover = track.coverBase64 ? `url('${track.coverBase64}')` : '#222';
        const card = document.createElement('div');
        card.className = 'album-card track-card';
        card.innerHTML = `
          <div class="album-card-art" style="background: ${cover}; background-size: cover; background-position: center;"></div>
          <div class="album-card-title">${track.title}</div>
          <div class="album-card-artist">${track.artist} (${state.playCounts[track.filename]}x)</div>
        `;
        card.onclick = () => {
          const idx = state.masterPlaylist.findIndex(t => t.filename === track.filename);
          state.playlist = [...state.masterPlaylist];
          loadTrack(idx >= 0 ? idx : 0);
          playTrack();
          router.navigate('player');
        };
        mostContainer.appendChild(card);
      });
    }
  }

  // Home Screen Sections
  function renderHomeSections() {
    const quickPicksContainer = document.getElementById('home-quick-picks');
    const quickPicksList = state.masterPlaylist.slice(0, 24);
    if (quickPicksContainer) {
      let qpHtml = '';
      quickPicksList.forEach((track, idx) => {
        const cover = track.coverBase64 ? `url('${track.coverBase64}')` : '#222';
        const isFav = state.isFavorite(track.filename);
        qpHtml += `
          <div class="quick-pick-item" data-filename="${track.filename}" data-index="${idx}">
            <div class="quick-pick-art" style="background-image: ${cover};"></div>
            <div class="quick-pick-info">
              <div class="quick-pick-title">${track.title}</div>
              <div class="quick-pick-artist">${track.artist}</div>
            </div>
            <div class="quick-pick-actions">
              <span class="qp-like ${isFav ? 'icon-active' : ''}" style="cursor: pointer;"><img class="pixel-icon" src="assets/icons/icon_like.bmp" width="16" height="16"></span>
              <span class="qp-more" style="cursor: pointer;" title="Opsi"><img class="pixel-icon" src="assets/icons/icon_more.bmp" width="16" height="16"></span>
            </div>
          </div>
        `;
      });
      quickPicksContainer.innerHTML = qpHtml;

      quickPicksContainer.querySelectorAll('.quick-pick-item').forEach(el => {
        el.onclick = (e) => {
          if (e.target.closest('.qp-like') || e.target.closest('.qp-more')) return;
          const filename = el.getAttribute('data-filename');
          const trackIdx = state.masterPlaylist.findIndex(t => t.filename === filename);
          state.playlist = [...state.masterPlaylist];
          loadTrack(trackIdx >= 0 ? trackIdx : 0);
          playTrack();
          router.navigate('player');
        };

        const likeBtn = el.querySelector('.qp-like');
        if (likeBtn) {
          likeBtn.onclick = (e) => {
            e.stopPropagation();
            const filename = el.getAttribute('data-filename');
            const track = state.masterPlaylist.find(t => t.filename === filename);
            if (track) state.toggleFavorite(track);
          };
        }

        const moreBtn = el.querySelector('.qp-more');
        if (moreBtn) {
          moreBtn.onclick = (e) => {
            e.stopPropagation();
            const filename = el.getAttribute('data-filename');
            const track = state.masterPlaylist.find(t => t.filename === filename);
            if (track) showAddToPlaylistModal(track);
          };
        }
      });
    }

    const btnQpPlayAll = document.getElementById('btn-quick-picks-play-all');
    if (btnQpPlayAll) {
      btnQpPlayAll.onclick = () => {
        if (quickPicksList.length === 0) return;
        state.playlist = [...quickPicksList];
        loadTrack(0);
        playTrack();
        router.navigate('player');
      };
    }

    // Featured Mixes
    const featuredContainer = document.getElementById('home-featured-mixes');
    if (featuredContainer) {
      let mixesHtml = '';
      FEATURED_MIX_DEFS.forEach((mix, mIdx) => {
        let matching = state.masterPlaylist.filter(mix.filter);
        if (matching.length < 2) matching = state.masterPlaylist.slice(mIdx * 5, (mIdx + 1) * 5);
        const cover = generatePixelPlaylistCover(mix.name, mix.id);
        mixesHtml += `
          <div class="mix-card" data-mix-id="${mix.id}">
            <div class="mix-card-art" style="background-image: url('${cover}');"></div>
            <div class="mix-card-title">${mix.name}</div>
            <div class="mix-card-desc">${mix.desc}</div>
          </div>
        `;
      });
      featuredContainer.innerHTML = mixesHtml;

      featuredContainer.querySelectorAll('.mix-card').forEach((el, mIdx) => {
        el.onclick = () => {
          const mix = FEATURED_MIX_DEFS[mIdx];
          let matching = state.masterPlaylist.filter(mix.filter);
          if (matching.length < 2) matching = state.masterPlaylist.slice(mIdx * 5, (mIdx + 1) * 5);
          state.playlist = matching.length > 0 ? [...matching] : [...state.masterPlaylist];
          loadTrack(0);
          playTrack();
          showToast(`Memutar: ${mix.name}`);
          router.navigate('player');
        };
      });
    }

    // Artists Carousel (Click opens Artist Profile!)
    const artistsContainer = document.getElementById('home-artists');
    if (artistsContainer) {
      const artistCounts = {};
      state.masterPlaylist.forEach(t => {
        const art = t.artist && t.artist !== 'Unknown Artist' ? t.artist : 'Unknown';
        artistCounts[art] = (artistCounts[art] || 0) + 1;
      });
      const topArtists = Object.keys(artistCounts).sort((a, b) => artistCounts[b] - artistCounts[a]);

      let artistsHtml = '';
      topArtists.slice(0, 15).forEach(artistName => {
        const count = artistCounts[artistName];
        const avatar = generateArtistPixelAvatar(artistName);
        artistsHtml += `
          <div class="artist-card" data-artist="${artistName}">
            <div class="artist-card-art" style="background-image: url('${avatar}');"></div>
            <div class="artist-card-name">${artistName}</div>
            <div class="artist-card-count">${count} lagu</div>
          </div>
        `;
      });
      artistsContainer.innerHTML = artistsHtml;

      artistsContainer.querySelectorAll('.artist-card').forEach(el => {
        el.onclick = () => {
          const artistName = el.getAttribute('data-artist');
          showArtistDetail(artistName);
        };
      });
    }

    // Listen Again (All tracks carousel)
    const homeAlbums = document.getElementById('home-albums');
    if (homeAlbums) {
      homeAlbums.innerHTML = '';
      state.masterPlaylist.forEach((track, trackIdx) => {
        const cover = track.coverBase64 ? `url('${track.coverBase64}')` : '#222';
        homeAlbums.innerHTML += `
          <div class="album-card track-card" data-filename="${track.filename}" data-index="${trackIdx}">
            <div class="album-card-art" style="background: ${cover}; background-size: cover; background-position: center;"></div>
            <div class="album-card-title">${track.title}</div>
            <div class="album-card-artist">${track.artist}</div>
          </div>
        `;
      });

      homeAlbums.querySelectorAll('.album-card').forEach(el => {
        el.onclick = () => {
          const filename = el.getAttribute('data-filename');
          const trackIdx = state.masterPlaylist.findIndex(t => t.filename === filename);
          state.playlist = [...state.masterPlaylist];
          loadTrack(trackIdx >= 0 ? trackIdx : 0);
          playTrack();
          router.navigate('player');
        };
      });
    }

    // Carousel < and > buttons
    document.querySelectorAll('.carousel-nav-btn').forEach(btn => {
      btn.onclick = () => {
        const targetId = btn.getAttribute('data-target');
        const dir = parseInt(btn.getAttribute('data-dir') || '1', 10);
        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.scrollBy({ left: dir * 420, behavior: 'smooth' });
      };
    });

    refreshHistorySections();
  }

  // Library View & Custom Playlist Detail
  function renderLibraryGrid() {
    const libraryAlbumsGrid = document.getElementById('library-albums-grid');
    const libraryAlbumsContainer = document.getElementById('library-albums-container');
    const libraryAlbumDetail = document.getElementById('library-album-detail');
    const btnBackLibrary = document.getElementById('btn-back-library');

    if (!libraryAlbumsGrid) return;

    const likedCount = state.masterPlaylist.filter(t => state.isFavorite(t.filename)).length;
    let gridHtml = `
      <div class="library-album-card liked-songs-card" data-album="__LIKED_SONGS__">
        <div class="library-album-art" style="background-image: url('${generatePixelHeartCover()}'); background-size: cover; background-position: center; border-radius: 8px;"></div>
        <div class="library-album-title" style="color: #ff77c6;">Lagu Disukai</div>
        <div class="library-album-artist">${likedCount} lagu favorit</div>
      </div>
    `;

    state.customPlaylists.forEach(pl => {
      const plCover = generatePixelPlaylistCover(pl.name, pl.id);
      gridHtml += `
        <div class="library-album-card custom-playlist-card" data-album="CUSTOM_${pl.id}">
          <div class="library-album-art" style="background-image: url('${plCover}'); background-size: cover; background-position: center; border-radius: 8px;"></div>
          <div class="library-album-title" style="color: #00ffcc;">${pl.name}</div>
          <div class="library-album-artist">${pl.trackFilenames.length} lagu kustom</div>
        </div>
      `;
    });

    libraryAlbumsGrid.innerHTML = gridHtml;

    libraryAlbumsGrid.querySelectorAll('.library-album-card').forEach(el => {
      el.onclick = () => {
        const selectedAlbum = el.getAttribute('data-album');
        let tracks = [];
        let albumTitle = '';
        let albumArtist = '';
        let albumMeta = '';
        const isLikedAlbum = (selectedAlbum === '__LIKED_SONGS__');
        const isCustomPl = selectedAlbum.startsWith('CUSTOM_');
        let activeCustomPlId = null;

        if (isLikedAlbum) {
          tracks = state.masterPlaylist.filter(t => state.isFavorite(t.filename));
          albumTitle = 'Lagu Disukai';
          albumArtist = 'Koleksi Favorit Kamu';
          albumMeta = `Koleksi Pribadi • ${tracks.length} lagu`;
        } else if (isCustomPl) {
          activeCustomPlId = selectedAlbum.replace('CUSTOM_', '');
          const pl = state.customPlaylists.find(p => p.id === activeCustomPlId);
          if (pl) {
            tracks = state.masterPlaylist.filter(t => pl.trackFilenames.includes(t.filename));
            albumTitle = pl.name;
            albumArtist = 'Playlist Kustom Kamu';
            albumMeta = `Playlist Kustom • ${tracks.length} lagu`;
          }
        }

        if (libraryAlbumsContainer) libraryAlbumsContainer.classList.add('hidden');
        if (libraryAlbumDetail) libraryAlbumDetail.classList.remove('hidden');

        const detailArt = document.getElementById('library-detail-art');
        if (detailArt) {
          if (isLikedAlbum) {
            detailArt.style.backgroundImage = `url('${generatePixelHeartCover()}')`;
          } else if (isCustomPl) {
            detailArt.style.backgroundImage = `url('${generatePixelPlaylistCover(albumTitle, activeCustomPlId)}')`;
          }
        }

        const titleEl = document.getElementById('library-detail-title');
        const artistTextEl = document.getElementById('library-detail-artist-text');
        const metaEl = document.getElementById('library-detail-meta');
        if (titleEl) titleEl.innerText = albumTitle;
        if (artistTextEl) artistTextEl.innerText = albumArtist;
        if (metaEl) metaEl.innerHTML = albumMeta;

        const btnAddSongs = document.getElementById('btn-playlist-add-songs');
        if (btnAddSongs) {
          btnAddSongs.style.display = isCustomPl ? 'block' : 'none';
          btnAddSongs.onclick = () => {
            showSelectTracksModal(activeCustomPlId, albumTitle, () => el.click());
          };
        }

        const tracklistContainer = document.getElementById('library-tracklist');
        if (tracklistContainer) {
          tracklistContainer.innerHTML = '';
          if (tracks.length === 0) {
            tracklistContainer.innerHTML = `
              <div style="padding: 50px 20px; text-align: center; color: #888;">
                <div style="font-size: 20px; margin-bottom: 10px; color: #00ffcc;">Belum ada lagu di playlist ini</div>
                <button id="btn-empty-add" class="retro-btn primary" style="font-size: 14px; padding: 10px 20px;">+ Tambah Lagu Sekarang</button>
              </div>
            `;
            const emptyAdd = document.getElementById('btn-empty-add');
            if (emptyAdd) emptyAdd.onclick = () => showSelectTracksModal(activeCustomPlId, albumTitle, () => el.click());
          } else {
            tracks.forEach((track, idx) => {
              const cover = track.coverBase64 ? `url('${track.coverBase64}')` : 'none';
              const isFav = state.isFavorite(track.filename);
              const item = document.createElement('div');
              item.className = 'library-track-item';
              item.innerHTML = `
                <div class="library-track-art" style="background-image: ${cover}; width: 40px; height: 40px; border-radius: 4px; margin-right: 15px; background-size: cover; background-position: center; background-color: #222;"></div>
                <div class="library-track-info" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
                  <div class="library-track-title">${track.title}</div>
                  <div class="library-track-artist" style="font-size: 18px; color: var(--text-dim);">${track.artist} • ${track.album}</div>
                </div>
                <div class="library-track-actions" style="display: flex; gap: 10px;">
                  <span class="track-like ${isFav ? 'icon-active' : ''}" style="cursor: pointer;"><img class="pixel-icon" src="assets/icons/icon_like.bmp"></span>
                  <span class="track-more" style="cursor: pointer;" title="Opsi"><img class="pixel-icon" src="assets/icons/icon_more.bmp"></span>
                </div>
              `;
              item.onclick = (e) => {
                if (e.target.closest('.track-like') || e.target.closest('.track-more')) return;
                state.playlist = [...tracks];
                state.currentActiveAlbum = selectedAlbum;
                renderPlaylist();
                loadTrack(idx);
                playTrack();
                router.navigate('player');
              };

              const likeBtn = item.querySelector('.track-like');
              if (likeBtn) {
                likeBtn.onclick = (e) => {
                  e.stopPropagation();
                  state.toggleFavorite(track);
                };
              }

              const moreBtn = item.querySelector('.track-more');
              if (moreBtn) {
                moreBtn.onclick = (e) => {
                  e.stopPropagation();
                  showAddToPlaylistModal(track);
                };
              }

              tracklistContainer.appendChild(item);
            });
          }
        }

        const btnPlay = document.getElementById('library-detail-play');
        if (btnPlay) {
          btnPlay.onclick = () => {
            if (tracks.length === 0) return;
            state.playlist = [...tracks];
            state.currentActiveAlbum = selectedAlbum;
            renderPlaylist();
            loadTrack(0);
            playTrack();
            router.navigate('player');
          };
        }

        const btnShuffle = document.getElementById('btn-album-shuffle');
        if (btnShuffle) {
          btnShuffle.onclick = () => {
            if (tracks.length === 0) return;
            state.playlist = [...tracks];
            state.currentActiveAlbum = selectedAlbum;
            renderPlaylist();
            setShuffleState(true, false);
            loadTrack(Math.floor(Math.random() * tracks.length));
            playTrack();
            router.navigate('player');
          };
        }

        const btnDownload = document.getElementById('btn-album-download');
        if (btnDownload) {
          btnDownload.onclick = () => {
            if (tracks.length === 0) return;
            let m3u = '#EXTM3U\n';
            tracks.forEach(t => { m3u += `#EXTINF:-1,${t.artist} - ${t.title}\n${t.filename}\n`; });
            const blob = new Blob([m3u], { type: 'audio/x-mpegurl' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${albumTitle.replace(/[/\\?%*:|"<>]/g, '_')}.m3u`;
            a.click();
            showToast(`💾 Playlist "${albumTitle}.m3u" berhasil diekspor!`);
          };
        }

        const btnShare = document.getElementById('btn-album-share');
        if (btnShare) {
          btnShare.onclick = () => {
            let txt = `🎵 Playlist: ${albumTitle} (${tracks.length} lagu)\n\n`;
            tracks.forEach((t, i) => { txt += `${i + 1}. ${t.title} - ${t.artist}\n`; });
            if (navigator.clipboard) {
              navigator.clipboard.writeText(txt);
              showToast('📋 Daftar lagu disalin ke clipboard!');
            }
          };
        }

        const btnMore = document.getElementById('btn-album-more');
        if (btnMore) {
          btnMore.onclick = () => {
            if (isCustomPl && activeCustomPlId) {
              showPlaylistOptionsMenu(activeCustomPlId, albumTitle, {
                onRename: () => {
                  showRenamePlaylistModal(activeCustomPlId, albumTitle, (newName) => {
                    albumTitle = newName;
                    if (titleEl) titleEl.innerText = newName;
                    renderLibraryGrid();
                  });
                },
                onManageSongs: () => showSelectTracksModal(activeCustomPlId, albumTitle, () => el.click()),
                onDelete: () => {
                  showRetroConfirmModal(
                    'HAPUS PLAYLIST',
                    `Hapus playlist <b>"${albumTitle}"</b> secara permanen?`,
                    '🗑️ HAPUS SEKARANG',
                    () => {
                      state.deleteCustomPlaylist(activeCustomPlId);
                      libraryAlbumDetail.classList.add('hidden');
                      libraryAlbumsContainer.classList.remove('hidden');
                      renderLibraryGrid();
                    }
                  );
                }
              });
            }
          };
        }
      };
    });

    if (btnBackLibrary) {
      btnBackLibrary.onclick = () => {
        if (libraryAlbumDetail) libraryAlbumDetail.classList.add('hidden');
        if (libraryAlbumsContainer) libraryAlbumsContainer.classList.remove('hidden');
      };
    }
  }

  // Artist Detail View (YouTube Music Style)
  function showArtistDetail(artistName) {
    if (!artistName) return;
    const cleanArt = artistName.replace(/\s*-\s*Topic$/i, '').trim();
    if (cleanArt === 'Unknown Artist' || cleanArt === 'Berkas Lokal') {
      showToast(`Artis "${cleanArt}" tidak memiliki profil publik.`);
      return;
    }

    const tracks = state.masterPlaylist.filter(t => t.artist.toLowerCase().trim() === cleanArt.toLowerCase());
    if (tracks.length === 0) {
      showToast(`Tidak ditemukan lagu dari ${cleanArt}`);
      return;
    }

    const artistAvatar = document.getElementById('artist-view-avatar');
    const artistNameEl = document.getElementById('artist-view-name');
    const artistCountEl = document.getElementById('artist-view-count');
    const tracklistEl = document.getElementById('artist-view-tracklist');
    const btnPlayAll = document.getElementById('btn-artist-play-all');
    const btnShuffle = document.getElementById('btn-artist-shuffle');
    const btnBack = document.getElementById('btn-back-artist');

    if (artistAvatar) {
      const avatarUrl = generateArtistPixelAvatar(cleanArt);
      artistAvatar.style.backgroundImage = `url('${avatarUrl}')`;
    }
    if (artistNameEl) artistNameEl.innerText = cleanArt;
    if (artistCountEl) artistCountEl.innerText = `${tracks.length} Lagu di Koleksi`;

    if (btnPlayAll) {
      btnPlayAll.onclick = () => {
        state.playlist = [...tracks];
        renderPlaylist();
        loadTrack(0);
        playTrack();
        router.navigate('player');
        showToast(`▶ Memutar semua lagu dari ${cleanArt}`);
      };
    }

    if (btnShuffle) {
      btnShuffle.onclick = () => {
        state.playlist = [...tracks];
        setShuffleState(true, false);
        renderPlaylist();
        loadTrack(Math.floor(Math.random() * tracks.length));
        playTrack();
        router.navigate('player');
        showToast(`🔀 Memutar acak lagu dari ${cleanArt}`);
      };
    }

    if (btnBack) {
      btnBack.onclick = () => {
        router.back();
      };
    }

    if (tracklistEl) {
      tracklistEl.innerHTML = '';
      tracks.forEach((track, idx) => {
        const item = document.createElement('div');
        item.className = 'library-track-item';
        const isFav = state.isFavorite(track.filename);
        item.innerHTML = `
          <div style="width: 25px; text-align: center; color: #888; font-size: 13px;">${idx + 1}</div>
          <div class="library-track-art" style="background-image: ${track.coverBase64 ? `url('${track.coverBase64}')` : '#222'}; width: 42px; height: 42px; border-radius: 4px; background-size: cover; background-position: center; margin: 0 12px;"></div>
          <div class="library-track-info" style="flex: 1; min-width: 0;">
            <div class="library-track-title" style="font-weight: bold; color: #fff; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.title}</div>
            <div class="library-track-artist" style="font-size: 12px; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.album || cleanArt}</div>
          </div>
          <div class="library-track-actions" style="display: flex; gap: 10px; align-items: center;">
            <span class="track-like ${isFav ? 'icon-active' : ''}" style="cursor: pointer;"><img class="pixel-icon" src="assets/icons/icon_like.bmp"></span>
            <span class="track-more" style="cursor: pointer;" title="Opsi"><img class="pixel-icon" src="assets/icons/icon_more.bmp"></span>
          </div>
        `;

        item.onclick = (e) => {
          if (e.target.closest('.track-like') || e.target.closest('.track-more')) return;
          state.playlist = [...tracks];
          renderPlaylist();
          loadTrack(idx);
          playTrack();
          router.navigate('player');
        };

        const likeBtn = item.querySelector('.track-like');
        if (likeBtn) {
          likeBtn.onclick = (e) => {
            e.stopPropagation();
            state.toggleFavorite(track);
            const fav = state.isFavorite(track.filename);
            likeBtn.classList.toggle('icon-active', fav);
            updateFavoritesUI();
          };
        }

        const moreBtn = item.querySelector('.track-more');
        if (moreBtn) {
          moreBtn.onclick = (e) => {
            e.stopPropagation();
            showAddToPlaylistModal(track);
          };
        }

        tracklistEl.appendChild(item);
      });
    }

    router.navigate('artist');
    sfx.play('tab');
  }

  // Queue Drawer Update (With Drag & Drop Reordering and 'Play Next')
  function updateQueueDrawer() {
    const queueNowPlaying = document.getElementById('queue-now-playing');
    const queueList = document.getElementById('queue-list');
    const queueCount = document.getElementById('queue-count');
    if (!queueList || !queueNowPlaying) return;

    const currentTrack = state.getCurrentTrack();
    if (currentTrack) {
      const cover = currentTrack.coverBase64 ? `url('${currentTrack.coverBase64}')` : 'none';
      queueNowPlaying.innerHTML = `
        <div class="queue-item active">
          <div class="queue-art" style="background-image: ${cover};"></div>
          <div class="queue-info">
            <div class="queue-title">${currentTrack.title}</div>
            <div class="queue-artist">${currentTrack.artist} • ${currentTrack.album}</div>
          </div>
          <span style="font-size: 11px; color: #00ffcc; font-weight: bold;">DIPUTAR</span>
        </div>
      `;
    } else {
      queueNowPlaying.innerHTML = `<div style="color: #666; font-size: 13px; padding: 5px;">Tidak ada lagu yang sedang diputar</div>`;
    }

    const upcoming = state.playlist.slice(state.currentIndex + 1);
    if (queueCount) queueCount.innerText = upcoming.length;

    if (upcoming.length === 0) {
      queueList.innerHTML = `<div style="color: #666; font-size: 13px; padding: 20px 0; text-align: center;">Akhir antrean lagu</div>`;
    } else {
      queueList.innerHTML = '';
      upcoming.forEach((track, offset) => {
        const actualIdx = state.currentIndex + 1 + offset;
        const cover = track.coverBase64 ? `url('${track.coverBase64}')` : 'none';
        const item = document.createElement('div');
        item.className = 'queue-item';
        item.draggable = true;
        item.setAttribute('data-index', actualIdx);
        item.innerHTML = `
          <span style="color: #666; cursor: grab; font-size: 14px; margin-right: 4px;">☰</span>
          <div class="queue-art" style="background-image: ${cover};"></div>
          <div class="queue-info">
            <div class="queue-title">${track.title}</div>
            <div class="queue-artist">${track.artist}</div>
          </div>
          <button class="bp-btn" style="font-size: 14px; color: #666; padding: 4px;" title="Hapus">✕</button>
        `;

        item.onclick = (e) => {
          if (e.target.tagName === 'BUTTON') {
            e.stopPropagation();
            state.playlist.splice(actualIdx, 1);
            renderPlaylist();
            updateQueueDrawer();
            showToast(`Lagu "${track.title}" dihapus dari antrean`);
          } else {
            loadTrack(actualIdx);
            playTrack();
          }
        };

        // Drag & Drop Reordering
        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', actualIdx.toString());
          item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => item.classList.remove('dragging'));
        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          item.classList.add('drag-over');
        });
        item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
        item.addEventListener('drop', (e) => {
          e.preventDefault();
          item.classList.remove('drag-over');
          const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
          const toIdx = actualIdx;
          if (fromIdx !== toIdx) {
            const moved = state.playlist.splice(fromIdx, 1)[0];
            state.playlist.splice(toIdx, 0, moved);
            renderPlaylist();
            updateQueueDrawer();
            showToast('Antrean lagu diperbarui 🔀');
          }
        });

        queueList.appendChild(item);
      });
    }
  }

  // Lyrics Drawer & Fullscreen Karaoke View
  async function updateLyricsDrawer(forceReload = false) {
    const lyricsContent = document.getElementById('lyrics-content');
    const lyricsTitle = document.getElementById('lyrics-title');
    const lyricsArtist = document.getElementById('lyrics-artist');
    const fsContainer = document.getElementById('fs-lyrics-container');
    const fsTitle = document.getElementById('fs-lyrics-title');
    const fsArtist = document.getElementById('fs-lyrics-artist');
    const fsArt = document.getElementById('fs-lyrics-art');

    const track = state.getCurrentTrack();
    if (!track) {
      if (lyricsContent) lyricsContent.innerHTML = `<div style="color: #666; text-align: center; padding: 40px 0;">Pilih lagu untuk melihat lirik</div>`;
      return;
    }

    if (lyricsTitle) lyricsTitle.innerText = track.title;
    if (lyricsArtist) lyricsArtist.innerText = `${track.artist} • ${track.album}`;
    if (fsTitle) fsTitle.innerText = track.title;
    if (fsArtist) fsArtist.innerText = track.artist;
    if (fsArt && track.coverBase64) fsArt.style.backgroundImage = `url('${track.coverBase64}')`;

    if (lyricsContent) {
      lyricsContent.innerHTML = `
        <div style="color: #00ffcc; text-align: center; padding: 40px 0;">
          <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
          <div>Mencari lirik sinkron di database...</div>
        </div>
      `;
    }

    const data = await lyricsEngine.fetchLyrics(track, forceReload);
    renderLyricsUI(data);
  }

  function renderLyricsUI(data) {
    const lyricsContent = document.getElementById('lyrics-content');
    const fsContainer = document.getElementById('fs-lyrics-container');
    if (!lyricsContent) return;

    lyricsContent.innerHTML = '';
    if (fsContainer) fsContainer.innerHTML = '';

    const { list, sourceBadge, isSynced, rawText } = data;
    if (!list || list.length === 0) {
      const track = state.getCurrentTrack();
      const emptyHtml = `
        <div style="color: #aaa; padding: 40px 15px; text-align: center; line-height: 1.6;">
          <div style="font-size: 36px; margin-bottom: 12px;">🎵</div>
          <div style="color: #fff; font-size: 15px; font-weight: bold; margin-bottom: 4px;">${track ? track.title : ''}</div>
          <div style="color: #888; font-size: 12px; margin-bottom: 16px;">${track ? track.artist : ''}</div>
          <div style="display: inline-block; padding: 6px 16px; border-radius: 6px; background: rgba(255, 71, 87, 0.15); border: 1px solid rgba(255, 71, 87, 0.4); color: #ff4757; font-size: 12px; font-weight: bold; margin-bottom: 16px;">
            LIRIK TIDAK ADA
          </div>
          <br>
          <button id="btn-retry-lyrics-ui" class="retro-btn primary" style="font-size: 11px; padding: 6px 14px;">🔄 Cari Ulang Lirik</button>
        </div>
      `;
      lyricsContent.innerHTML = emptyHtml;
      if (fsContainer) fsContainer.innerHTML = emptyHtml;
      const retryBtn = document.getElementById('btn-retry-lyrics-ui');
      if (retryBtn) retryBtn.onclick = () => updateLyricsDrawer(true);
      return;
    }

    if (sourceBadge) {
      const badge = document.createElement('div');
      badge.style.cssText = 'font-size: 10px; color: #00ffcc; text-align: center; margin-bottom: 12px; font-weight: bold;';
      badge.innerText = sourceBadge;
      lyricsContent.appendChild(badge);
    }

    // Drawer Lyric Lines
    list.forEach((item, idx) => {
      const lineEl = document.createElement('div');
      lineEl.className = 'lyrics-line';
      lineEl.id = `lyric-line-${idx}`;
      lineEl.innerText = item.text;
      lineEl.onclick = () => {
        audioEngine.seek(Math.max(0, item.time - lyricsEngine.currentOffset));
        sfx.play('click');
      };
      lyricsContent.appendChild(lineEl);

      // Fullscreen line
      if (fsContainer) {
        const fsLine = document.createElement('div');
        fsLine.className = 'fs-lyric-line';
        fsLine.id = `fs-lyric-line-${idx}`;
        fsLine.innerText = item.text;
        fsLine.onclick = () => {
          audioEngine.seek(Math.max(0, item.time - lyricsEngine.currentOffset));
          sfx.play('click');
        };
        fsContainer.appendChild(fsLine);
      }
    });

    syncLyricsTime(audioEngine.getCurrentTime());
  }

  function syncLyricsTime(currentTime) {
    if (!lyricsEngine.currentLyrics || lyricsEngine.currentLyrics.length === 0) return;
    const effectiveTime = currentTime + lyricsEngine.currentOffset;
    let activeIdx = -1;

    for (let i = 0; i < lyricsEngine.currentLyrics.length; i++) {
      if (effectiveTime >= lyricsEngine.currentLyrics[i].time) {
        activeIdx = i;
      }
    }

    // Update Drawer Lines
    document.querySelectorAll('.lyrics-line').forEach((el, idx) => {
      if (idx === activeIdx && activeIdx >= 0) {
        if (!el.classList.contains('active')) {
          el.classList.add('active');
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        el.classList.remove('active');
      }
    });

    // Update Fullscreen Lines
    document.querySelectorAll('.fs-lyric-line').forEach((el, idx) => {
      if (idx === activeIdx && activeIdx >= 0) {
        if (!el.classList.contains('active')) {
          el.classList.add('active');
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        el.classList.remove('active');
      }
    });
  }

  // Mini Player UI Update
  function updateMiniPlayerUI() {
    const miniWidget = document.getElementById('mini-player-widget');
    const miniTitle = document.getElementById('mini-title');
    const miniArtist = document.getElementById('mini-artist');
    const miniArt = document.getElementById('mini-art');
    const miniPlay = document.getElementById('mini-play');
    if (!miniWidget) return;

    const track = state.getCurrentTrack();
    if (track) {
      if (miniTitle) miniTitle.innerText = track.title;
      if (miniArtist) miniArtist.innerText = track.artist;
      if (miniArt) {
        miniArt.style.backgroundImage = track.coverBase64 ? `url('${track.coverBase64}')` : 'none';
        miniArt.classList.toggle('spinning', state.isPlaying);
      }
    }
    if (miniPlay) {
      miniPlay.innerHTML = state.isPlaying ? ICONS.pause : ICONS.play;
    }
  }

  // Live Instant Search with Category Tabs (YouTube Music Style)
  function setupLiveSearch(inputId, resultsId) {
    const input = document.getElementById(inputId);
    const resultsContainer = document.getElementById(resultsId);
    if (!input || !resultsContainer) return;

    let activeFilter = 'all'; // 'all' | 'songs' | 'artists' | 'albums'
    let debounceTimer;

    function renderResults(query) {
      const q = (query || '').trim().toLowerCase();
      if (!q) {
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
        return;
      }

      const songMatches = state.masterPlaylist.filter(t => t.title.toLowerCase().includes(q));
      const artistMatches = [...new Set(state.masterPlaylist.map(t => t.artist))].filter(a => a.toLowerCase().includes(q));
      const albumMatches = [...new Set(state.masterPlaylist.map(t => t.album))].filter(a => a.toLowerCase().includes(q));

      let html = `
        <div class="search-tab-bar">
          <button class="search-tab-chip ${activeFilter === 'all' ? 'active' : ''}" data-tab="all">Semua</button>
          <button class="search-tab-chip ${activeFilter === 'songs' ? 'active' : ''}" data-tab="songs">Lagu (${songMatches.length})</button>
          <button class="search-tab-chip ${activeFilter === 'artists' ? 'active' : ''}" data-tab="artists">Artis (${artistMatches.length})</button>
          <button class="search-tab-chip ${activeFilter === 'albums' ? 'active' : ''}" data-tab="albums">Album (${albumMatches.length})</button>
        </div>
        <div class="search-results-list" style="max-height: 320px; overflow-y: auto;">
      `;

      let totalResults = 0;

      if ((activeFilter === 'all' || activeFilter === 'songs') && songMatches.length > 0) {
        songMatches.slice(0, 8).forEach(track => {
          totalResults++;
          const cover = track.coverBase64 ? `url('${track.coverBase64}')` : 'none';
          html += `
            <div class="search-result-item" data-action="play" data-filename="${track.filename}">
              <div class="search-result-art" style="background-image: ${cover};"></div>
              <div class="search-result-info">
                <div class="search-result-title">${track.title}</div>
                <div class="search-result-artist">${track.artist} • ${track.album}</div>
              </div>
            </div>
          `;
        });
      }

      if ((activeFilter === 'all' || activeFilter === 'artists') && artistMatches.length > 0) {
        artistMatches.slice(0, 5).forEach(artist => {
          totalResults++;
          const avatar = generateArtistPixelAvatar(artist);
          html += `
            <div class="search-result-item" data-action="artist" data-artist="${artist}">
              <div class="search-result-art" style="background-image: url('${avatar}'); border-radius: 50%;"></div>
              <div class="search-result-info">
                <div class="search-result-title" style="color: #00ffcc;">${artist}</div>
                <div class="search-result-artist">Artis</div>
              </div>
            </div>
          `;
        });
      }

      if ((activeFilter === 'all' || activeFilter === 'albums') && albumMatches.length > 0) {
        albumMatches.slice(0, 4).forEach(album => {
          totalResults++;
          html += `
            <div class="search-result-item" data-action="album" data-album="${album}">
              <div class="search-result-art" style="background: #222; border-radius: 4px;">📀</div>
              <div class="search-result-info">
                <div class="search-result-title" style="color: #ffaa00;">${album}</div>
                <div class="search-result-artist">Album</div>
              </div>
            </div>
          `;
        });
      }

      if (totalResults === 0) {
        html += `<div class="search-no-result">Tidak ada hasil yang cocok</div>`;
      }

      html += `</div>`;
      resultsContainer.innerHTML = html;
      resultsContainer.classList.remove('hidden');

      // Bind search tabs
      resultsContainer.querySelectorAll('.search-tab-chip').forEach(chip => {
        chip.onclick = (e) => {
          e.stopPropagation();
          activeFilter = chip.getAttribute('data-tab');
          renderResults(input.value);
        };
      });

      // Bind item clicks
      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.onclick = () => {
          const action = item.getAttribute('data-action');
          if (action === 'play') {
            const fn = item.getAttribute('data-filename');
            const idx = state.masterPlaylist.findIndex(t => t.filename === fn);
            state.playlist = [...state.masterPlaylist];
            loadTrack(idx >= 0 ? idx : 0);
            playTrack();
            router.navigate('player');
          } else if (action === 'artist') {
            const art = item.getAttribute('data-artist');
            showArtistDetail(art);
          }
          resultsContainer.classList.add('hidden');
          input.value = '';
        };
      });
    }

    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => renderResults(e.target.value), 100);
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.classList.add('hidden');
      }
    });
  }

  // Windows MediaSession API
  function updateMediaSession(track) {
    if (!('mediaSession' in navigator) || !track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: [{ src: track.coverBase64 || 'assets/vinyl_red.png', sizes: '256x256', type: 'image/png' }]
    });
  }

  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => playTrack());
    navigator.mediaSession.setActionHandler('pause', () => pauseTrack());
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime) audioEngine.seek(details.seekTime);
    });
  }

  // Global Keyboard Shortcuts
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Command Palette (Ctrl+K or Cmd+K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        showCommandPalette(router, (idx) => {
          loadTrack(idx);
          playTrack();
          router.navigate('player');
        });
        return;
      }

      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') {
          document.activeElement.blur();
          const modal = document.getElementById('retro-modal-container');
          if (modal) modal.classList.add('hidden');
        }
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        togglePlay();
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          audioEngine.seek(audioEngine.getCurrentTime() - 5);
          showToast(`⏪ -5s (${formatTime(audioEngine.getCurrentTime())})`);
          break;
        case 'ArrowRight':
          e.preventDefault();
          audioEngine.seek(audioEngine.getCurrentTime() + 5);
          showToast(`⏩ +5s (${formatTime(audioEngine.getCurrentTime())})`);
          break;
        case 'ArrowUp':
          e.preventDefault();
          audioEngine.setVolume(audioEngine.getVolume() + 0.05);
          showToast(`Volume: ${Math.round(audioEngine.getVolume() * 100)}% 🔊`);
          break;
        case 'ArrowDown':
          e.preventDefault();
          audioEngine.setVolume(audioEngine.getVolume() - 0.05);
          showToast(`Volume: ${Math.round(audioEngine.getVolume() * 100)}% 🔉`);
          break;
        case 'KeyN':
          playNextTrack();
          break;
        case 'KeyP':
          playPrevTrack();
          break;
        case 'KeyS':
          setShuffleState(!state.isShuffled, true);
          break;
        case 'KeyR':
          setRepeatState(!state.isRepeat, true);
          break;
        case 'KeyL':
          if (state.getCurrentTrack()) state.toggleFavorite(state.getCurrentTrack());
          break;
        case 'KeyQ':
          const qDrawer = document.getElementById('queue-drawer');
          if (qDrawer) {
            qDrawer.classList.toggle('hidden');
            if (!qDrawer.classList.contains('hidden')) updateQueueDrawer();
          }
          break;
        case 'KeyK':
          const lDrawer = document.getElementById('lyrics-drawer');
          if (lDrawer) {
            lDrawer.classList.toggle('hidden');
            if (!lDrawer.classList.contains('hidden')) updateLyricsDrawer();
          }
          break;
        case 'Escape':
          const fsLyrics = document.getElementById('fullscreen-lyrics-view');
          if (fsLyrics && !fsLyrics.classList.contains('hidden')) {
            fsLyrics.classList.add('hidden');
            router.navigate('player');
          }
          break;
      }
    });
  }

  // Load Music Library Files
  async function loadMusic() {
    try {
      let rawFiles = (Array.isArray(PRELOADED_TRACKS) && PRELOADED_TRACKS.length > 0) ? [...PRELOADED_TRACKS] : [];
      // 1. Try reading from window.api
      if (window.api && window.api.readDir) {
        try {
          const result = await window.api.readDir('music');
          if (result && result.success && Array.isArray(result.files) && result.files.length > 0) {
            rawFiles = result.files;
          }
        } catch (ipcErr) {
          console.warn("IPC readDir notice:", ipcErr);
        }
      }

      if (rawFiles && rawFiles.length > 0) {
        state.masterPlaylist = rawFiles.map((f, idx) => {
          const albumName = (f.album && f.album !== "Unknown Album") ? f.album : f.title;
          const fallbackSeed = f.title + "_" + f.artist + "_" + idx;
          const cover = generateProceduralCover(fallbackSeed);

          return {
            filename: f.filename,
            path: (window.api && window.api.getMusicPath) ? window.api.getMusicPath(f.filename) : `music/${encodeURIComponent(f.filename)}`,
            title: f.title || f.filename.replace(/\.[^/.]+$/, ""),
            artist: f.artist || "Unknown Artist",
            genre: f.genre || "Pop",
            album: albumName,
            coverBase64: cover,
            vinylColor: vinylColors[idx % vinylColors.length]
          };
        });

        state.playlist = [...state.masterPlaylist];
        autoGenerateSmartAlbums(false);

        // Group by album
        state.albumMap = {};
        state.masterPlaylist.forEach(t => {
          if (!state.albumMap[t.album]) state.albumMap[t.album] = [];
          state.albumMap[t.album].push(t);
        });

        renderPlayerAlbumList();
        renderHomeSections();
        renderLibraryGrid();
        renderPlaylist();

        // Populate Explore View
        const expNew = document.getElementById('explore-new-releases');
        const expTrend = document.getElementById('explore-trending');
        if (expNew && expTrend) {
          expNew.innerHTML = '';
          expTrend.innerHTML = '';
          state.masterPlaylist.slice(0, 16).forEach(track => {
            const cover = track.coverBase64 ? `url('${track.coverBase64}')` : '#222';
            expNew.innerHTML += `
              <div class="album-card track-card" data-filename="${track.filename}">
                <div class="album-card-art" style="background: ${cover}; background-size: cover; background-position: center;"></div>
                <div class="album-card-title">${track.title}</div>
                <div class="album-card-artist">${track.artist}</div>
              </div>
            `;
          });
          [...state.masterPlaylist].sort(() => Math.random() - 0.5).slice(0, 16).forEach(track => {
            const cover = track.coverBase64 ? `url('${track.coverBase64}')` : '#222';
            expTrend.innerHTML += `
              <div class="album-card track-card" data-filename="${track.filename}">
                <div class="album-card-art" style="background: ${cover}; background-size: cover; background-position: center;"></div>
                <div class="album-card-title">${track.title}</div>
                <div class="album-card-artist">${track.artist}</div>
              </div>
            `;
          });
          document.querySelectorAll('#explore-view .album-card').forEach(el => {
            el.onclick = () => {
              const fn = el.getAttribute('data-filename');
              const idx = state.masterPlaylist.findIndex(t => t.filename === fn);
              state.playlist = [...state.masterPlaylist];
              loadTrack(idx >= 0 ? idx : 0);
              playTrack();
              router.navigate('player');
            };
          });
        }

        // Restore Saved Playback State
        const savedState = state.loadPlaybackState();
        if (savedState && savedState.filename) {
          const matchIdx = state.masterPlaylist.findIndex(t => t.filename === savedState.filename);
          if (matchIdx >= 0) {
            loadTrack(matchIdx);
            if (savedState.volume) audioEngine.setVolume(savedState.volume);
            if (savedState.isShuffled) setShuffleState(true, false);
            if (savedState.isRepeat) setRepeatState(true, false);
          } else {
            loadTrack(0);
          }
        } else if (state.playlist.length > 0) {
          loadTrack(0);
        }
      }
    } catch (e) {
      console.error("loadMusic error:", e);
      if (window.api && window.api.logError) {
        window.api.logError("loadMusic Error: " + e.message + "\n" + e.stack);
      }
    }
  }

  // Setup Global Event Handlers
  function setupEventHandlers() {
    // Timeupdate
    audioEl.addEventListener('timeupdate', () => {
      const cur = audioEngine.getCurrentTime();
      const dur = audioEngine.getDuration();
      if (!dur) return;

      const pct = cur / dur;
      if (progressFill) progressFill.style.width = `${pct * 100}%`;
      if (progressThumb) progressThumb.style.left = `${pct * 100}%`;
      if (timeDisplay) timeDisplay.innerText = formatTime(cur);

      const timeDuration = document.getElementById('time-duration');
      if (timeDuration) timeDuration.innerText = formatTime(dur);
      if (bpTime) bpTime.innerText = `${formatTime(cur)} / ${formatTime(dur)}`;

      updateToneArm();
      syncLyricsTime(cur);
    });

    state.on('trackEnded', () => playNextTrack());
    state.on('crossfadeTriggered', () => {
      let nextIdx = state.currentIndex + 1;
      if (state.isShuffled && state.playlist.length > 1) {
        nextIdx = Math.floor(Math.random() * state.playlist.length);
      }
      if (nextIdx < state.playlist.length) {
        const nextTrack = state.playlist[nextIdx];
        state.currentIndex = nextIdx;
        loadTrack(nextIdx);
        audioEngine.playWithCrossfade(nextTrack.path);
        state.recordPlayHistory(nextTrack);
        refreshHistorySections();
      }
    });

    state.on('favoritesChanged', () => {
      updateFavoritesUI();
      renderLibraryGrid();
      renderPlayerAlbumList();
    });

    // Controls
    const btnPlay = document.getElementById('btn-play');
    if (btnPlay) btnPlay.onclick = togglePlay;
    if (bpPlay) bpPlay.onclick = togglePlay;
    if (bpPrev) bpPrev.onclick = playPrevTrack;
    if (bpNext) bpNext.onclick = playNextTrack;

    const btnPrev = document.getElementById('btn-prev');
    if (btnPrev) btnPrev.onclick = playPrevTrack;
    const btnNext = document.getElementById('btn-next');
    if (btnNext) btnNext.onclick = playNextTrack;

    const btnShuffle = document.getElementById('btn-shuffle');
    if (btnShuffle) btnShuffle.onclick = () => setShuffleState(!state.isShuffled, true);
    if (bpShuffle) bpShuffle.onclick = () => setShuffleState(!state.isShuffled, true);

    const btnRepeat = document.getElementById('btn-repeat');
    if (btnRepeat) btnRepeat.onclick = () => setRepeatState(!state.isRepeat, true);
    if (bpRepeat) bpRepeat.onclick = () => setRepeatState(!state.isRepeat, true);

    if (bpLike) {
      bpLike.onclick = () => {
        const tr = state.getCurrentTrack();
        if (tr) state.toggleFavorite(tr);
      };
    }

    if (bpDislike) {
      bpDislike.onclick = () => {
        bpDislike.classList.toggle('icon-active');
        sfx.play('click');
        showToast(bpDislike.classList.contains('icon-active') ? 'Lagu tidak disukai' : 'Batal tidak disukai');
      };
    }

    // Sidebar footer actions
    const btnPalette = document.getElementById('btn-sidebar-palette');
    if (btnPalette) {
      btnPalette.onclick = () => showCommandPalette(router, (idx) => {
        loadTrack(idx);
        playTrack();
        router.navigate('player');
      });
    }

    // Clicking Bottom Player track info opens the Vinyl Player
    const bpCenter = document.querySelector('.bp-center');
    if (bpCenter) {
      bpCenter.style.cursor = 'pointer';
      bpCenter.onclick = (e) => {
        if (e.target.closest('#bp-like') || e.target.closest('#bp-dislike')) return;
        if (router.activeView !== 'player') {
          router.navigate('player');
        }
      };
    }

    // Top close button in Vinyl Player view
    const btnClosePlayer = document.getElementById('btn-close-player');
    if (btnClosePlayer) {
      btnClosePlayer.onclick = () => {
        const prev = (state.previousView && state.previousView !== 'player') ? state.previousView : 'home';
        router.navigate(prev);
      };
    }

    const btnSettings = document.getElementById('btn-sidebar-settings');
    if (btnSettings) {
      btnSettings.onclick = () => showSettingsModal(audioEngine);
    }

    // Speed 33 & 45 RPM
    const unit33 = document.getElementById('unit-speed-33');
    const unit45 = document.getElementById('unit-speed-45');
    if (unit33) {
      unit33.onclick = () => {
        audioEngine.setSpeedRPM(33);
        document.getElementById('btn-speed-33-btn')?.classList.add('active');
        document.getElementById('btn-speed-33')?.classList.add('active');
        document.getElementById('btn-speed-45-btn')?.classList.remove('active');
        document.getElementById('btn-speed-45')?.classList.remove('active');
        showToast('Kecepatan Vinyl: 33⅓ RPM (Standar) 💽');
        sfx.play('click');
      };
    }
    if (unit45) {
      unit45.onclick = () => {
        audioEngine.setSpeedRPM(45);
        document.getElementById('btn-speed-45-btn')?.classList.add('active');
        document.getElementById('btn-speed-45')?.classList.add('active');
        document.getElementById('btn-speed-33-btn')?.classList.remove('active');
        document.getElementById('btn-speed-33')?.classList.remove('active');
        showToast('Kecepatan Vinyl: 45 RPM (Cepat) ⚡');
        sfx.play('click');
      };
    }

    // Pitch Fader
    const pitchSlider = document.getElementById('pitch-slider');
    if (pitchSlider) {
      pitchSlider.oninput = (e) => audioEngine.setPitch(e.target.value);
    }

    // EQ & FX
    const eqBass = document.getElementById('eq-bass');
    if (eqBass) eqBass.oninput = (e) => audioEngine.setBass(e.target.value);
    const eqMid = document.getElementById('eq-mid');
    if (eqMid) eqMid.oninput = (e) => audioEngine.setMid(e.target.value);
    const eqTreb = document.getElementById('eq-treb');
    if (eqTreb) eqTreb.oninput = (e) => audioEngine.setTreble(e.target.value);
    const fxEcho = document.getElementById('fx-echo');
    if (fxEcho) fxEcho.oninput = (e) => audioEngine.setEcho(e.target.value);

    // Volume Sliders
    if (volSlider) {
      volSlider.oninput = (e) => audioEngine.setVolume(parseFloat(e.target.value));
    }
    const bpVolSlider = document.getElementById('bp-vol-slider');
    if (bpVolSlider) {
      bpVolSlider.oninput = (e) => audioEngine.setVolume(parseFloat(e.target.value));
    }

    // Mixer Toggles Initialization & Synchronization
    const autoMixToggle = document.getElementById('auto-mix-toggle');
    if (autoMixToggle) {
      autoMixToggle.checked = !!state.settings.autoMix;
      autoMixToggle.onchange = (e) => {
        state.updateSetting('autoMix', e.target.checked);
        showToast(e.target.checked ? 'Auto Mix (Genre) Aktif 🔀' : 'Auto Mix Nonaktif');
        sfx.play('click');
      };
    }

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.checked = state.settings.darkMode !== false;
      document.body.classList.toggle('dark-mode', darkModeToggle.checked);
      darkModeToggle.onchange = (e) => {
        document.body.classList.toggle('dark-mode', e.target.checked);
        state.updateSetting('darkMode', e.target.checked);
        showToast(e.target.checked ? 'Studio Lights: Redup (Dark) 💡' : 'Studio Lights: Terang');
        sfx.play('click');
      };
    }

    const lofiToggle = document.getElementById('lofi-toggle');
    if (lofiToggle) {
      lofiToggle.checked = !!state.settings.lofiNoise;
      audioEngine.setLofiNoise(lofiToggle.checked);
      lofiToggle.onchange = (e) => {
        state.updateSetting('lofiNoise', e.target.checked);
        audioEngine.setLofiNoise(e.target.checked);
        showToast(e.target.checked ? 'Lo-Fi Dust (Vinyl Noise): Aktif 📻' : 'Lo-Fi Dust: Nonaktif');
        sfx.play(e.target.checked ? 'powerup' : 'click');
      };
    }

    // SFX Hardware Button
    if (bpSfxToggle) {
      bpSfxToggle.onclick = () => {
        const enabled = sfx.toggle();
        bpSfxToggle.classList.toggle('active', enabled);
        const led = document.getElementById('led-bp-sfx');
        if (led) led.classList.toggle('active', enabled);
        showToast(enabled ? 'Suara Retro SFX: Aktif 🔊' : 'Suara Retro SFX: Mati 🔇');
      };
    }

    // Queue Drawer Toggle
    const queueDrawer = document.getElementById('queue-drawer');
    const btnCloseQueue = document.getElementById('btn-close-queue');
    if (bpQueueBtn && queueDrawer) {
      bpQueueBtn.onclick = () => {
        queueDrawer.classList.toggle('hidden');
        if (!queueDrawer.classList.contains('hidden')) updateQueueDrawer();
        sfx.play('tab');
      };
    }
    if (btnCloseQueue && queueDrawer) {
      btnCloseQueue.onclick = () => queueDrawer.classList.add('hidden');
    }

    // Lyrics Drawer Toggle & Fullscreen expand
    const lyricsDrawer = document.getElementById('lyrics-drawer');
    const btnCloseLyrics = document.getElementById('btn-close-lyrics');
    const btnExpandLyrics = document.getElementById('btn-expand-lyrics');
    const btnFsLyricsClose = document.getElementById('btn-fs-lyrics-close');

    if (bpLyricsBtn && lyricsDrawer) {
      bpLyricsBtn.onclick = () => {
        lyricsDrawer.classList.toggle('hidden');
        if (!lyricsDrawer.classList.contains('hidden')) updateLyricsDrawer();
        sfx.play('tab');
      };
    }
    if (btnCloseLyrics && lyricsDrawer) {
      btnCloseLyrics.onclick = () => lyricsDrawer.classList.add('hidden');
    }
    if (btnExpandLyrics) {
      btnExpandLyrics.onclick = () => {
        lyricsDrawer.classList.add('hidden');
        router.navigate('fullscreenLyrics');
      };
    }
    if (btnFsLyricsClose) {
      btnFsLyricsClose.onclick = () => router.navigate('player');
    }
    // Mini Player Widget Toggle & Controls
    const miniWidget = document.getElementById('mini-player-widget');
    const ledBpMini = document.getElementById('led-bp-mini');
    const btnExpandMini = document.getElementById('btn-expand-mini');
    const miniPrev = document.getElementById('mini-prev');
    const miniPlay = document.getElementById('mini-play');
    const miniNext = document.getElementById('mini-next');

    if (bpMiniBtn && miniWidget) {
      bpMiniBtn.onclick = (e) => {
        e.stopPropagation();
        const isHidden = miniWidget.classList.contains('hidden');
        if (isHidden) {
          miniWidget.classList.remove('hidden');
          if (ledBpMini) ledBpMini.classList.add('active');
          bpMiniBtn.classList.add('active');
          updateMiniPlayerUI();
          sfx.play('powerup');
          showToast('⚡ Mini Player Aktif');
        } else {
          miniWidget.classList.add('hidden');
          if (ledBpMini) ledBpMini.classList.remove('active');
          bpMiniBtn.classList.remove('active');
          sfx.play('click');
          showToast('Mini Player Ditutup');
        }
      };
    }

    if (btnExpandMini && miniWidget) {
      btnExpandMini.onclick = (e) => {
        e.stopPropagation();
        miniWidget.classList.add('hidden');
        if (ledBpMini) ledBpMini.classList.remove('active');
        if (bpMiniBtn) bpMiniBtn.classList.remove('active');
        router.navigate('player');
        sfx.play('powerup');
      };
    }

    if (miniPrev) {
      miniPrev.onclick = (e) => {
        e.stopPropagation();
        playPrevTrack();
      };
    }

    if (miniPlay) {
      miniPlay.onclick = (e) => {
        e.stopPropagation();
        togglePlay();
      };
    }

    if (miniNext) {
      miniNext.onclick = (e) => {
        e.stopPropagation();
        playNextTrack();
      };
    }

    // Mini Player Draggable Widget
    const miniHeader = document.querySelector('.mini-player-header');
    if (miniWidget && miniHeader) {
      let isDraggingMini = false;
      let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

      miniHeader.style.cursor = 'grab';
      miniHeader.onmousedown = (e) => {
        if (e.target.id === 'btn-expand-mini') return;
        isDraggingMini = true;
        miniHeader.style.cursor = 'grabbing';
        startX = e.clientX;
        startY = e.clientY;
        const rect = miniWidget.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        document.onmousemove = (moveE) => {
          if (!isDraggingMini) return;
          const dx = moveE.clientX - startX;
          const dy = moveE.clientY - startY;
          miniWidget.style.bottom = 'auto';
          miniWidget.style.right = 'auto';
          miniWidget.style.left = `${Math.max(10, Math.min(window.innerWidth - miniWidget.offsetWidth - 10, initialLeft + dx))}px`;
          miniWidget.style.top = `${Math.max(10, Math.min(window.innerHeight - miniWidget.offsetHeight - 10, initialTop + dy))}px`;
        };

        document.onmouseup = () => {
          isDraggingMini = false;
          miniHeader.style.cursor = 'grab';
          document.onmousemove = null;
          document.onmouseup = null;
        };
      };
    }

    // Progress bar click scrubbing
    if (progressBg) {
      progressBg.onmousedown = (e) => {
        const rect = progressBg.getBoundingClientRect();
        const update = (moveE) => {
          let pct = (moveE.clientX - rect.left) / rect.width;
          pct = Math.max(0, Math.min(1, pct));
          const dur = audioEngine.getDuration();
          if (dur) audioEngine.seek(pct * dur);
        };
        update(e);
        document.onmousemove = update;
        document.onmouseup = () => {
          document.onmousemove = null;
          document.onmouseup = null;
        };
      };
    }

    // Vinyl Scratching Interaction
    if (vinylContainer) {
      let lastAngle = 0;
      vinylContainer.onmousedown = (e) => {
        const dur = audioEngine.getDuration();
        if (!dur) return;
        audioEngine.isVinylDragging = true;
        const rect = vinylContainer.getBoundingClientRect();
        const cX = rect.left + rect.width / 2;
        const cY = rect.top + rect.height / 2;
        lastAngle = Math.atan2(e.clientY - cY, e.clientX - cX) * 180 / Math.PI;

        document.onmousemove = (moveE) => {
          if (!audioEngine.isVinylDragging) return;
          const currentAngle = Math.atan2(moveE.clientY - cY, moveE.clientX - cX) * 180 / Math.PI;
          let diff = currentAngle - lastAngle;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          audioEngine.vinylRotation += diff;
          vinylContainer.style.transform = `rotate(${audioEngine.vinylRotation}deg)`;
          lastAngle = currentAngle;
          audioEngine.seek(audioEngine.getCurrentTime() + (diff / 120));
          updateToneArm();
        };

        document.onmouseup = () => {
          audioEngine.isVinylDragging = false;
          document.onmousemove = null;
          document.onmouseup = null;
        };
      };
    }

    // Tone Arm Dragging
    if (toneArm) {
      toneArm.onmousedown = (e) => {
        const dur = audioEngine.getDuration();
        if (!dur) return;
        audioEngine.isToneArmDragging = true;
        let startX = e.clientX;
        let startTime = audioEngine.getCurrentTime();

        document.onmousemove = (moveE) => {
          if (!audioEngine.isToneArmDragging) return;
          let diffX = moveE.clientX - startX;
          let newTime = Math.max(0, Math.min(dur, startTime + ((diffX / 100) * dur)));
          audioEngine.seek(newTime);
          updateToneArm();
        };

        document.onmouseup = () => {
          audioEngine.isToneArmDragging = false;
          document.onmousemove = null;
          document.onmouseup = null;
        };
      };
    }

    // Drag & Drop Audio Files
    const dragDropOverlay = document.getElementById('drag-drop-overlay');
    let dragCounter = 0;
    window.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (dragDropOverlay) dragDropOverlay.classList.remove('hidden');
    });
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (dragDropOverlay) dragDropOverlay.classList.remove('hidden');
    });
    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0 && dragDropOverlay) {
        dragCounter = 0;
        dragDropOverlay.classList.add('hidden');
      }
    });
    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      dragCounter = 0;
      if (dragDropOverlay) dragDropOverlay.classList.add('hidden');

      const files = Array.from(e.dataTransfer.files).filter(f => /\.(mp3|wav|ogg|flac|m4a)$/i.test(f.name));
      if (files.length === 0) {
        showToast('Format file tidak didukung');
        return;
      }

      const newTracks = files.map((file, idx) => ({
        filename: file.name,
        path: file.path || URL.createObjectURL(file),
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: "Berkas Lokal",
        genre: "Custom Drop",
        album: "Local Drops",
        coverBase64: generateProceduralCover(file.name),
        vinylColor: vinylColors[idx % vinylColors.length]
      }));

      state.masterPlaylist = [...newTracks, ...state.masterPlaylist];
      state.playlist = [...newTracks, ...state.playlist];
      renderPlaylist();
      loadTrack(0);
      playTrack();
      showToast(`Memuat ${files.length} lagu baru! 🎵`);
    });

    // Auto-create smart albums button
    const btnAutoAlbums = document.getElementById('btn-auto-create-albums');
    if (btnAutoAlbums) {
      btnAutoAlbums.onclick = () => {
        const count = autoGenerateSmartAlbums(true);
        renderLibraryGrid();
        renderPlayerAlbumList();
        showToast(`✨ ${count > 0 ? count + ' album baru berhasil disusun!' : 'Album sudah lengkap!'}`);
      };
    }

    const btnCreatePl = document.getElementById('btn-create-playlist');
    if (btnCreatePl) {
      btnCreatePl.onclick = () => {
        showCreatePlaylistModal(() => {
          renderLibraryGrid();
          renderPlayerAlbumList();
        });
      };
    }

    // Live search setups
    setupLiveSearch('home-search-input', 'home-search-results');
    setupLiveSearch('explore-search-input', 'explore-search-results');

    // Genre card interactive filtering
    document.querySelectorAll('.genre-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.onclick = () => {
        const genreName = card.innerText.trim().toLowerCase();
        sfx.play('click');
        const matched = state.masterPlaylist.filter(t => {
          const txt = `${t.genre} ${t.album} ${t.title} ${t.artist}`.toLowerCase();
          return txt.includes(genreName);
        });

        if (matched.length > 0) {
          state.playlist = matched;
          renderPlaylist();
          loadTrack(0);
          playTrack();
          router.navigate('player');
          showToast(`⚡ Memutar genre ${card.innerText} (${matched.length} lagu)`);
        } else {
          // Fallback random mix
          state.playlist = [...state.masterPlaylist].sort(() => Math.random() - 0.5);
          renderPlaylist();
          loadTrack(0);
          playTrack();
          router.navigate('player');
          showToast(`⚡ Memutar mix tema ${card.innerText}`);
        }
      };
    });

    // Artist quick navigation on LCD & Bottom Player
    if (lcdArtist) {
      lcdArtist.style.cursor = 'pointer';
      lcdArtist.title = 'Buka Profil Artis';
      lcdArtist.onclick = (e) => {
        e.stopPropagation();
        const current = state.getCurrentTrack();
        if (current && current.artist) showArtistDetail(current.artist);
      };
    }
    if (bpArtist) {
      bpArtist.style.cursor = 'pointer';
      bpArtist.title = 'Buka Profil Artis';
      bpArtist.onclick = (e) => {
        e.stopPropagation();
        const current = state.getCurrentTrack();
        if (current && current.artist) showArtistDetail(current.artist);
      };
    }

    // Mood chips filtering
    document.querySelectorAll('.mood-chip').forEach(chip => {
      chip.onclick = () => {
        sfx.play('click');
        document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const mood = chip.getAttribute('data-mood');

        if (mood === 'all') {
          state.playlist = [...state.masterPlaylist];
          renderPlaylist();
          showToast('Menampilkan semua lagu');
          return;
        }

        const keywords = MOOD_KEYWORDS[mood] || [mood];
        const matched = state.masterPlaylist.filter(track => {
          const txt = `${track.title} ${track.artist} ${track.album} ${track.genre}`.toLowerCase();
          return keywords.some(kw => txt.includes(kw));
        });

        state.playlist = matched.length > 0 ? matched : [...state.masterPlaylist].sort(() => Math.random() - 0.5);
        renderPlaylist();
        loadTrack(0);
        playTrack();
        showToast(`Memutar mix mood "${chip.innerText}" (${state.playlist.length} lagu)`);
      };
    });
  }

  // Initialize Desktop Features
  setupKeyboardShortcuts();
  setupMediaSession();
  setupEventHandlers();

  // Start App
  console.log("🚀 Renderer.js loaded! Loading music library...");
  loadMusic();

} catch (err) {
  if (window.api && window.api.logError) {
    window.api.logError("Init Error: " + err.message + "\n" + err.stack);
  }
  console.error("Initialization Error:", err);
}

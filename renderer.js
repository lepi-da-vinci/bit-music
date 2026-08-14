try {

  // Pixel Art SVG Icons
  const ICONS = {
    play: '<img class="pixel-icon" src="assets/icons/icon_play.bmp">',
    pause: '<img class="pixel-icon" src="assets/icons/icon_pause.bmp">',
    up: '<img class="pixel-icon" src="assets/icons/icon_up.bmp">',
    down: '<img class="pixel-icon" src="assets/icons/icon_down.bmp">'
  };

  let masterPlaylist = [];
  let playlist = [];
  let albumMap = {};
  let currentActiveAlbum = 'all';
  let currentIndex = -1;
  let isPlaying = false;
  let isShuffled = false;
  let isRepeat = false;
  let previousView = 'home';

  const audio = document.getElementById('audio-player');
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
  
  // New Layout & Global Player Elements
  const bpPrev = document.getElementById('bp-prev');
  const bpPlay = document.getElementById('bp-play');
  const bpNext = document.getElementById('bp-next');
  const bpTime = document.getElementById('bp-time');
  const bpTitle = document.getElementById('bp-title');
  const bpArtist = document.getElementById('bp-artist');
  const bpArt = document.getElementById('bp-album-art');
  const homeView = document.getElementById('home-view');
  const playerView = document.getElementById('player-view');
  const homeAlbums = document.getElementById('home-albums');
  const navHome = document.getElementById('nav-home');
  const libraryView = document.getElementById('library-view');
  const navLibrary = document.getElementById('nav-library');
  const libraryAlbumsContainer = document.getElementById('library-albums-container');
  const libraryAlbumDetail = document.getElementById('library-album-detail');
  const btnBackLibrary = document.getElementById('btn-back-library');

  const vinylColors = ['red', 'blue', 'green', 'purple', 'orange', 'teal'];
  const rgbColors = {
    'red': '255, 80, 100', 'blue': '80, 150, 255', 'green': '80, 220, 100',
    'purple': '180, 80, 220', 'orange': '255, 170, 60', 'teal': '60, 200, 180'
  };

  // Toast System
  let toastTimeout;
  function showToast(message) {
    const container = document.getElementById('toast-container');
    const msgEl = document.getElementById('toast-message');
    if (!container || !msgEl) return;
    
    msgEl.innerText = message;
    container.classList.remove('hidden');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      container.classList.add('hidden');
    }, 3000);
  }

  // Favorites System (Local Storage Persistence)
  const FAVORITES_KEY = 'retro_groove_favorites';
  function getFavorites() {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function isFavorite(filename) {
    if (!filename) return false;
    return getFavorites().includes(filename);
  }

  function toggleFavorite(track) {
    if (!track || !track.filename) return false;
    let favs = getFavorites();
    let added = false;
    if (favs.includes(track.filename)) {
      favs = favs.filter(f => f !== track.filename);
      added = false;
    } else {
      favs.push(track.filename);
      added = true;
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    updateFavoritesUI();
    
    // Refresh library if currently in library view
    const libraryAlbumsGrid = document.getElementById('library-albums-grid');
    if (libraryAlbumsGrid) {
      const likedCountEl = libraryAlbumsGrid.querySelector('.liked-songs-card .library-album-artist');
      if (likedCountEl) {
        likedCountEl.innerText = `${getFavorites().length} lagu favorit`;
      }
    }

    if (added) playRetroSFX('like');
    showToast(added ? `"${track.title}" ditambahkan ke Lagu Disukai ❤️` : `"${track.title}" dihapus dari Lagu Disukai`);
    return added;
  }

  function updateFavoritesUI() {
    const bpLike = document.getElementById('bp-like');
    if (bpLike && playlist[currentIndex]) {
      const isFav = isFavorite(playlist[currentIndex].filename);
      bpLike.classList.toggle('icon-active', isFav);
    }
    document.querySelectorAll('.library-track-item').forEach(el => {
      const filename = el.getAttribute('data-filename');
      const likeBtn = el.querySelector('.track-like');
      if (likeBtn && filename) {
        likeBtn.classList.toggle('icon-active', isFavorite(filename));
      }
    });
  }

  // Custom Playlist Management (Local Storage)
  const CUSTOM_PLAYLISTS_KEY = 'retro_groove_custom_playlists';
  function getCustomPlaylists() {
    try {
      const saved = localStorage.getItem(CUSTOM_PLAYLISTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCustomPlaylists(list) {
    localStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(list));
  }

  function createCustomPlaylist(name) {
    if (!name || !name.trim()) return null;
    const list = getCustomPlaylists();
    const newPl = {
      id: 'pl_' + Date.now(),
      name: name.trim(),
      trackFilenames: []
    };
    list.push(newPl);
    saveCustomPlaylists(list);
    showToast(`Playlist "${newPl.name}" berhasil dibuat! 📁`);
    return newPl;
  }

  function addTrackToCustomPlaylist(playlistId, filename) {
    const list = getCustomPlaylists();
    const pl = list.find(p => p.id === playlistId);
    if (!pl) return;
    if (!pl.trackFilenames.includes(filename)) {
      pl.trackFilenames.push(filename);
      saveCustomPlaylists(list);
      playRetroSFX('like');
      showToast(`Lagu dimasukkan ke "${pl.name}"!`);
    } else {
      showToast(`Lagu sudah ada di "${pl.name}"`);
    }
  }

  function removeTrackFromCustomPlaylist(playlistId, filename) {
    const list = getCustomPlaylists();
    const pl = list.find(p => p.id === playlistId);
    if (!pl) return;
    pl.trackFilenames = pl.trackFilenames.filter(f => f !== filename);
    saveCustomPlaylists(list);
    showToast(`Lagu dihapus dari "${pl.name}"`);
  }

  function deleteCustomPlaylist(playlistId) {
    let list = getCustomPlaylists();
    const pl = list.find(p => p.id === playlistId);
    const name = pl ? pl.name : 'Playlist';
    list = list.filter(p => p.id !== playlistId);
    saveCustomPlaylists(list);
    showToast(`Playlist "${name}" telah dihapus`);
  }

  // Retro Modal System
  function showCreatePlaylistModal(onCreated) {
    const modalContainer = document.getElementById('retro-modal-container');
    const modalTitle = document.getElementById('retro-modal-title');
    const modalBody = document.getElementById('retro-modal-body');
    const btnCancel = document.getElementById('retro-modal-cancel');
    const btnConfirm = document.getElementById('retro-modal-confirm');
    if (!modalContainer) return;

    btnConfirm.style.display = 'block';
    modalTitle.innerText = 'Buat Playlist Baru';
    modalBody.innerHTML = `
      <div style="font-size: 14px; color: #aaa; margin-bottom: 8px;">Masukkan nama playlist retro kamu:</div>
      <input type="text" id="retro-playlist-name-input" class="retro-input" placeholder="Contoh: Synthwave Nights, Chill Beat..." autofocus>
    `;
    modalContainer.classList.remove('hidden');
    playRetroSFX('click');

    const input = document.getElementById('retro-playlist-name-input');
    if (input) setTimeout(() => input.focus(), 50);

    btnCancel.onclick = () => {
      modalContainer.classList.add('hidden');
      playRetroSFX('click');
    };

    btnConfirm.onclick = () => {
      const name = input ? input.value.trim() : '';
      if (!name) {
        showToast('Nama playlist tidak boleh kosong!');
        return;
      }
      const newPl = createCustomPlaylist(name);
      modalContainer.classList.add('hidden');
      playRetroSFX('like');
      if (onCreated) onCreated(newPl);
    };
  }

  function showAddToPlaylistModal(track) {
    if (!track) return;
    const modalContainer = document.getElementById('retro-modal-container');
    const modalTitle = document.getElementById('retro-modal-title');
    const modalBody = document.getElementById('retro-modal-body');
    const btnCancel = document.getElementById('retro-modal-cancel');
    const btnConfirm = document.getElementById('retro-modal-confirm');
    if (!modalContainer) return;

    const playlists = getCustomPlaylists();
    modalTitle.innerText = 'Tambahkan ke Playlist';
    
    if (playlists.length === 0) {
      modalBody.innerHTML = `
        <div style="padding: 15px 0; text-align: center; color: #aaa;">
          Kamu belum punya playlist kustom.<br>
          <button id="btn-modal-quick-create" class="retro-btn primary" style="margin-top: 15px;">+ Buat Playlist Sekarang</button>
        </div>
      `;
      btnConfirm.style.display = 'none';
      
      const quickCreate = document.getElementById('btn-modal-quick-create');
      if (quickCreate) {
        quickCreate.onclick = () => {
          showCreatePlaylistModal(() => {
            showAddToPlaylistModal(track);
          });
        };
      }
    } else {
      btnConfirm.style.display = 'block';
      let optionsHtml = playlists.map(pl => {
        const hasTrack = pl.trackFilenames.includes(track.filename);
        return `
          <label style="display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 8px; cursor: pointer;">
            <input type="radio" name="target-playlist" value="${pl.id}" style="accent-color: #00ffcc;" ${hasTrack ? 'disabled' : ''}>
            <span style="font-size: 15px; color: ${hasTrack ? '#666' : '#fff'};">${pl.name} (${pl.trackFilenames.length} lagu) ${hasTrack ? '✓ Sudah ada' : ''}</span>
          </label>
        `;
      }).join('');

      modalBody.innerHTML = `
        <div style="font-size: 13px; color: #888; margin-bottom: 12px;">Lagu: <b style="color:#fff;">${track.title}</b></div>
        <div style="max-height: 200px; overflow-y: auto;">
          ${optionsHtml}
        </div>
      `;
    }

    modalContainer.classList.remove('hidden');
    playRetroSFX('click');

    btnCancel.onclick = () => {
      modalContainer.classList.add('hidden');
      playRetroSFX('click');
    };

    btnConfirm.onclick = () => {
      const selectedRadio = modalBody.querySelector('input[name="target-playlist"]:checked');
      if (!selectedRadio) {
        showToast('Pilih salah satu playlist!');
        return;
      }
      addTrackToCustomPlaylist(selectedRadio.value, track.filename);
      modalContainer.classList.add('hidden');
    };
  }

  // Select Multiple Tracks for Custom Playlist Modal
  function showSelectTracksModal(playlistId, playlistName, onDone) {
    const modalContainer = document.getElementById('retro-modal-container');
    const modalTitle = document.getElementById('retro-modal-title');
    const modalBody = document.getElementById('retro-modal-body');
    const btnCancel = document.getElementById('retro-modal-cancel');
    const btnConfirm = document.getElementById('retro-modal-confirm');
    if (!modalContainer) return;

    modalTitle.innerText = `Pilih Lagu: "${playlistName}"`;
    btnConfirm.innerText = 'Selesai';
    btnConfirm.style.display = 'block';
    btnCancel.style.display = 'none';

    function renderTrackSelectorList(query = '') {
      const pl = getCustomPlaylists().find(p => p.id === playlistId);
      const currentFilenames = pl ? pl.trackFilenames : [];
      
      const filtered = masterPlaylist.filter(t => 
        !query || 
        t.title.toLowerCase().includes(query.toLowerCase()) || 
        t.artist.toLowerCase().includes(query.toLowerCase())
      );

      let listHtml = `
        <input type="text" id="track-picker-search" class="retro-input" placeholder="Cari judul lagu atau artis..." value="${query}" style="margin-bottom: 12px;">
        <div id="track-picker-items" style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
      `;

      if (filtered.length === 0) {
        listHtml += `<div style="color: #777; text-align: center; padding: 20px;">Tidak ada lagu yang cocok</div>`;
      } else {
        filtered.forEach(track => {
          const isAdded = currentFilenames.includes(track.filename);
          const cover = track.coverBase64 ? `url('${track.coverBase64}')` : 'none';
          listHtml += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 6px; border: 1px solid ${isAdded ? '#00ffcc' : 'transparent'};">
              <div style="display: flex; align-items: center; gap: 10px; overflow: hidden; margin-right: 10px;">
                <div style="width: 32px; height: 32px; border-radius: 4px; background-image: ${cover}; background-size: cover; background-position: center; background-color: #222; flex-shrink: 0;"></div>
                <div style="overflow: hidden;">
                  <div style="font-size: 13px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.title}</div>
                  <div style="font-size: 11px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.artist}</div>
                </div>
              </div>
              <button class="picker-toggle-btn" data-filename="${track.filename}" style="font-family: inherit; font-size: 12px; padding: 4px 10px; border-radius: 4px; border: 1px solid ${isAdded ? '#ff007f' : '#00ffcc'}; background: ${isAdded ? 'rgba(255,0,127,0.15)' : 'rgba(0,255,204,0.15)'}; color: ${isAdded ? '#ff007f' : '#00ffcc'}; cursor: pointer; flex-shrink: 0;">
                ${isAdded ? '✕ Hapus' : '+ Tambah'}
              </button>
            </div>
          `;
        });
      }
      listHtml += `</div>`;
      modalBody.innerHTML = listHtml;

      const searchInput = document.getElementById('track-picker-search');
      if (searchInput) {
        searchInput.focus();
        searchInput.oninput = (e) => {
          renderTrackSelectorList(e.target.value);
        };
      }

      modalBody.querySelectorAll('.picker-toggle-btn').forEach(btn => {
        btn.onclick = () => {
          const fn = btn.getAttribute('data-filename');
          const currentPl = getCustomPlaylists().find(p => p.id === playlistId);
          if (currentPl && currentPl.trackFilenames.includes(fn)) {
            removeTrackFromCustomPlaylist(playlistId, fn);
          } else {
            addTrackToCustomPlaylist(playlistId, fn);
          }
          const currentQ = searchInput ? searchInput.value : '';
          renderTrackSelectorList(currentQ);
        };
      });
    }

    renderTrackSelectorList();
    modalContainer.classList.remove('hidden');
    playRetroSFX('tab');

    btnConfirm.onclick = () => {
      modalContainer.classList.add('hidden');
      btnCancel.style.display = 'block';
      btnConfirm.innerText = 'Simpan';
      playRetroSFX('click');
      if (onDone) onDone();
    };
  }

  // Queue Drawer Update Function
  function updateQueueDrawer() {
    const queueNowPlaying = document.getElementById('queue-now-playing');
    const queueList = document.getElementById('queue-list');
    const queueCount = document.getElementById('queue-count');
    if (!queueList || !queueNowPlaying) return;

    const currentTrack = playlist[currentIndex];
    if (currentTrack) {
      const cover = currentTrack.coverBase64 ? `url('${currentTrack.coverBase64}')` : 'none';
      queueNowPlaying.innerHTML = `
        <div class="queue-item active">
          <div class="queue-art" style="background-image: ${cover};"></div>
          <div class="queue-info">
            <div class="queue-title">${currentTrack.title}</div>
            <div class="queue-artist">${currentTrack.artist} • ${currentTrack.album}</div>
          </div>
          <span style="font-size: 11px; color: #00ffcc; font-weight: bold;">SEDANG DIPUTAR</span>
        </div>
      `;
    } else {
      queueNowPlaying.innerHTML = `<div style="color: #666; font-size: 13px; padding: 5px;">Tidak ada lagu yang sedang diputar</div>`;
    }

    const upcomingTracks = playlist.slice(currentIndex + 1);
    if (queueCount) queueCount.innerText = upcomingTracks.length;

    if (upcomingTracks.length === 0) {
      queueList.innerHTML = `<div style="color: #666; font-size: 13px; padding: 20px 0; text-align: center;">Akhir antrean lagu</div>`;
    } else {
      queueList.innerHTML = '';
      upcomingTracks.forEach((track, offset) => {
        const actualIdx = currentIndex + 1 + offset;
        const cover = track.coverBase64 ? `url('${track.coverBase64}')` : 'none';
        const item = document.createElement('div');
        item.className = 'queue-item';
        item.innerHTML = `
          <div class="queue-art" style="background-image: ${cover};"></div>
          <div class="queue-info">
            <div class="queue-title">${track.title}</div>
            <div class="queue-artist">${track.artist}</div>
          </div>
          <button class="bp-btn" style="font-size: 14px; color: #666; padding: 4px;" title="Hapus dari antrean">✕</button>
        `;
        item.onclick = (e) => {
          if (e.target.tagName === 'BUTTON') {
            e.stopPropagation();
            playlist.splice(actualIdx, 1);
            renderPlaylist();
            updateQueueDrawer();
            showToast(`Lagu "${track.title}" dihapus dari antrean`);
          } else {
            loadTrack(actualIdx);
            playTrack();
            updateQueueDrawer();
          }
        };
        queueList.appendChild(item);
      });
    }
  }

  // Mini Player Management
  function updateMiniPlayerUI() {
    const miniWidget = document.getElementById('mini-player-widget');
    const miniTitle = document.getElementById('mini-title');
    const miniArtist = document.getElementById('mini-artist');
    const miniArt = document.getElementById('mini-art');
    const miniPlay = document.getElementById('mini-play');
    if (!miniWidget) return;

    const track = playlist[currentIndex];
    if (track) {
      if (miniTitle) miniTitle.innerText = track.title;
      if (miniArtist) miniArtist.innerText = track.artist;
      if (miniArt) {
        if (track.coverBase64) {
          miniArt.style.backgroundImage = `url('${track.coverBase64}')`;
        } else {
          miniArt.style.backgroundImage = 'none';
        }
        miniArt.classList.toggle('spinning', isPlaying);
      }
    }
    if (miniPlay) {
      miniPlay.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
    }
  }

  // Lyrics Manager (RPG Dialogue Box Style)
  let currentLyrics = [];
  function updateLyricsDrawer() {
    const lyricsDrawer = document.getElementById('lyrics-drawer');
    const lyricsTitle = document.getElementById('lyrics-title');
    const lyricsArtist = document.getElementById('lyrics-artist');
    const lyricsContent = document.getElementById('lyrics-content');
    if (!lyricsContent) return;

    const track = playlist[currentIndex];
    if (!track) {
      lyricsContent.innerHTML = `<div style="color: #666; font-size: 14px; padding: 40px 0;">Pilih lagu untuk melihat lirik</div>`;
      return;
    }

    if (lyricsTitle) lyricsTitle.innerText = track.title;
    if (lyricsArtist) lyricsArtist.innerText = `${track.artist} • ${track.album}`;

    currentLyrics = [
      { time: 0, text: `♪ ${track.title} ♪` },
      { time: 6, text: `▶ Artis: ${track.artist}` },
      { time: 12, text: `[8-Bit Chiptune Melodies Playing]` },
      { time: 20, text: `Memutar nada retro di dalam malam` },
      { time: 30, text: `Piringan hitam berputar perlahan` },
      { time: 42, text: `Piksel bergoyang mengikuti dentuman bass` },
      { time: 56, text: `Nikmati alunan groove tanpa batas` },
      { time: 70, text: `♪ Retro Groove Music Player ♪` },
      { time: 88, text: `[Solo Keyboard & Synthesizer Solo]` },
      { time: 105, text: `Simpan ke playlist favorit kamu` },
      { time: 125, text: `Bersama kami bernostalgia selalu` },
      { time: 150, text: `♪ Outro - Terima kasih telah mendengarkan ♪` }
    ];

    lyricsContent.innerHTML = '';
    currentLyrics.forEach((item, idx) => {
      const lineEl = document.createElement('div');
      lineEl.className = `lyrics-line ${idx === 0 ? 'active' : ''}`;
      lineEl.id = `lyric-line-${idx}`;
      lineEl.innerText = item.text;
      lineEl.onclick = () => {
        audio.currentTime = item.time;
      };
      lyricsContent.appendChild(lineEl);
    });
  }

  function syncLyricsTime(currentTime) {
    if (!currentLyrics || currentLyrics.length === 0) return;
    let activeIdx = 0;
    for (let i = 0; i < currentLyrics.length; i++) {
      if (currentTime >= currentLyrics[i].time) {
        activeIdx = i;
      }
    }
    document.querySelectorAll('.lyrics-line').forEach((el, idx) => {
      if (idx === activeIdx) {
        if (!el.classList.contains('active')) {
          el.classList.add('active');
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        el.classList.remove('active');
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
      artwork: [
        { src: track.coverBase64 || 'assets/vinyl_red.png', sizes: '256x256', type: 'image/png' }
      ]
    });
  }

  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => playTrack());
    navigator.mediaSession.setActionHandler('pause', () => pauseTrack());
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (currentIndex > 0) { loadTrack(currentIndex - 1); playTrack(); }
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (currentIndex < playlist.length - 1) { loadTrack(currentIndex + 1); playTrack(); }
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime && audio.duration) audio.currentTime = details.seekTime;
    });
  }

  // Global Keyboard Shortcuts
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignore if currently typing inside an input
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
        e.stopPropagation();
        togglePlay();
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          e.stopPropagation();
          if (audio.duration) {
            audio.currentTime = Math.max(0, audio.currentTime - 5);
            showToast(`⏪ -5 detik (${formatTime(audio.currentTime)})`);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          e.stopPropagation();
          if (audio.duration) {
            audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
            showToast(`⏩ +5 detik (${formatTime(audio.currentTime)})`);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          audio.volume = Math.min(1, Math.round((audio.volume + 0.05) * 100) / 100);
          if (volSlider) volSlider.value = audio.volume;
          const bpVolSlider = document.getElementById('bp-vol-slider');
          if (bpVolSlider) bpVolSlider.value = audio.volume;
          showToast(`Volume: ${Math.round(audio.volume * 100)}% 🔊`);
          break;
        case 'ArrowDown':
          e.preventDefault();
          audio.volume = Math.max(0, Math.round((audio.volume - 0.05) * 100) / 100);
          if (volSlider) volSlider.value = audio.volume;
          const bpVolSlider2 = document.getElementById('bp-vol-slider');
          if (bpVolSlider2) bpVolSlider2.value = audio.volume;
          showToast(`Volume: ${Math.round(audio.volume * 100)}% 🔉`);
          break;
        case 'KeyN':
          if (currentIndex < playlist.length - 1) {
            loadTrack(currentIndex + 1);
            playTrack();
            showToast('Lagu Selanjutnya ⏭️');
          }
          break;
        case 'KeyP':
          if (currentIndex > 0) {
            loadTrack(currentIndex - 1);
            playTrack();
            showToast('Lagu Sebelumnya ⏮️');
          }
          break;
        case 'KeyM':
          audio.muted = !audio.muted;
          showToast(audio.muted ? 'Audio Dibisukan (Muted) 🔇' : 'Audio Aktif 🔊');
          break;
        case 'KeyL':
          if (playlist[currentIndex]) {
            toggleFavorite(playlist[currentIndex]);
          }
          break;
        case 'KeyQ':
          const qDrawer = document.getElementById('queue-drawer');
          if (qDrawer) {
            qDrawer.classList.toggle('hidden');
            playRetroSFX('tab');
            if (!qDrawer.classList.contains('hidden')) updateQueueDrawer();
          }
          break;
        case 'KeyK':
          const lDrawer = document.getElementById('lyrics-drawer');
          if (lDrawer) {
            lDrawer.classList.toggle('hidden');
            playRetroSFX('tab');
            if (!lDrawer.classList.contains('hidden')) updateLyricsDrawer();
          }
          break;
        case 'Escape':
          const modal = document.getElementById('retro-modal-container');
          if (modal) modal.classList.add('hidden');
          const qDrawer2 = document.getElementById('queue-drawer');
          if (qDrawer2) qDrawer2.classList.add('hidden');
          const lDrawer2 = document.getElementById('lyrics-drawer');
          if (lDrawer2) lDrawer2.classList.add('hidden');
          break;
      }
    });
  }

  // Retro UI Sound Effects Synthesizer (Dedicated Context)
  let isSfxEnabled = true;
  let sfxAudioCtx = null;

  function playRetroSFX(type) {
    if (!isSfxEnabled) return;
    try {
      if (!sfxAudioCtx) {
        sfxAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (sfxAudioCtx.state === 'suspended') {
        sfxAudioCtx.resume();
      }
      const now = sfxAudioCtx.currentTime;
      const osc = sfxAudioCtx.createOscillator();
      const gain = sfxAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(sfxAudioCtx.destination);

      if (type === 'click' || type === 'tab') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.045);
      } else if (type === 'play') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.05);
        osc.frequency.setValueAtTime(659.25, now + 0.10);
        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'pause') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.setValueAtTime(523.25, now + 0.06);
        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'like') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(392.00, now);
        osc.frequency.setValueAtTime(523.25, now + 0.04);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.12);
        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.19);
      }
    } catch (e) {
      console.log("SFX error:", e);
    }
  }

  // Web Audio API for Bass Glow and Visualizer
  let audioCtx;
  let analyser;
  let dataArray;
  let source;
  let bassFilter, midFilter, trebFilter;
  let delayNode, feedbackGain, echoMix;

  function initAudioVisualizer() {
    if (source) return;
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    
    // Create EQ Filters
    bassFilter = audioCtx.createBiquadFilter();
    bassFilter.type = "lowshelf";
    bassFilter.frequency.value = 250;
    bassFilter.gain.value = document.getElementById('eq-bass').value;
    
    midFilter = audioCtx.createBiquadFilter();
    midFilter.type = "peaking";
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 1;
    midFilter.gain.value = document.getElementById('eq-mid').value;
    
    trebFilter = audioCtx.createBiquadFilter();
    trebFilter.type = "highshelf";
    trebFilter.frequency.value = 4000;
    trebFilter.gain.value = document.getElementById('eq-treb').value;
    
    source = audioCtx.createMediaElementSource(audio);
    
    // Delay Node for Echo
    delayNode = audioCtx.createDelay(1.0);
    delayNode.delayTime.value = 0.4;
    feedbackGain = audioCtx.createGain();
    feedbackGain.gain.value = 0.3;
    echoMix = audioCtx.createGain();
    echoMix.gain.value = document.getElementById('fx-echo').value;
    
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    delayNode.connect(echoMix);
    echoMix.connect(audioCtx.destination);
    
    // Chain: Source -> EQ -> Analyser -> Destination
    source.connect(bassFilter);
    bassFilter.connect(midFilter);
    midFilter.connect(trebFilter);
    trebFilter.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    // Send EQ output to Delay Node as well
    trebFilter.connect(delayNode);
    
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    const canvas = document.getElementById('lcd-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    
    // Setup VU Meter LEDs
    const vuL = document.getElementById('vu-l');
    const vuR = document.getElementById('vu-r');
    if (vuL && vuR) {
      vuL.innerHTML = ''; vuR.innerHTML = '';
      for (let i = 0; i < 10; i++) {
        let color = 'green';
        if (i > 6) color = 'yellow';
        if (i > 8) color = 'red';
        vuL.innerHTML += `<div class="vu-led ${color}"></div>`;
        vuR.innerHTML += `<div class="vu-led ${color}"></div>`;
      }
    }
    
    function renderFrame() {
      requestAnimationFrame(renderFrame);
      
      // Physics for Motor Spin-Up / Spin-Down
      if (!isVinylDragging) {
        if (isPlaying) {
          currentPlaybackRate += (targetPlaybackRate - currentPlaybackRate) * 0.05;
        } else {
          currentPlaybackRate = 0;
        }
        audio.playbackRate = Math.max(0.01, currentPlaybackRate); 
      }
      
      // Stop rendering visualizer if completely stopped
      if (currentPlaybackRate < 0.01 && !isPlaying && !isVinylDragging) {
        vinylContainer.style.boxShadow = 'none';
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bpCanvas = document.getElementById('bp-visualizer');
        if (bpCanvas) {
          const bpCtx = bpCanvas.getContext('2d');
          bpCtx.clearRect(0, 0, bpCanvas.width, bpCanvas.height);
        }
        if (noiseGain) noiseGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        return;
      }
      
      // Update Lofi Crackle Volume
      if (noiseGain) {
        if (isLofiEnabled && currentPlaybackRate > 0.05) {
          noiseGain.gain.setTargetAtTime(0.5, audioCtx.currentTime, 0.1);
        } else {
          noiseGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        }
      }
      
      // Rotate Vinyl manually
      if (!isVinylDragging) {
        vinylRotation += 2 * currentPlaybackRate;
        vinylContainer.style.transform = `rotate(${vinylRotation}deg)`;
      }
      
      analyser.getByteFrequencyData(dataArray);

      // 1. Draw LCD Turntable Spectrum Analyzer
      if (canvas && ctx) {
        if (canvas.width !== canvas.offsetWidth) canvas.width = canvas.offsetWidth;
        if (canvas.height !== canvas.offsetHeight) canvas.height = canvas.offsetHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / 15) - 2;
        let x = 0;
        
        for (let i = 0; i < 15; i++) {
          const dataIndex = i * 2 + 2; 
          const barHeight = (dataArray[dataIndex] / 255) * canvas.height;
          
          ctx.fillStyle = `rgba(100, 255, 120, ${0.4 + (barHeight/canvas.height)*0.6})`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 2;
        }
      }

      // 2. Draw Bottom Player 8-Bit Stepped Pixel Spectrum
      const bpCanvas = document.getElementById('bp-visualizer');
      if (bpCanvas) {
        const bpCtx = bpCanvas.getContext('2d');
        bpCtx.clearRect(0, 0, bpCanvas.width, bpCanvas.height);
        
        const numBars = 12;
        const barWidth = Math.floor((bpCanvas.width - 4) / numBars) - 2;
        const blockHeight = 3;
        const blockGap = 1;
        const maxBlocks = Math.floor(bpCanvas.height / (blockHeight + blockGap));
        
        for (let i = 0; i < numBars; i++) {
          const dataIndex = Math.floor(i * 3 + 2);
          const rawVal = dataArray[dataIndex] || 0;
          const barHeightRatio = rawVal / 255;
          const numBlocks = Math.floor(barHeightRatio * maxBlocks);
          const x = 2 + i * (barWidth + 2);
          
          for (let b = 0; b < numBlocks; b++) {
            const y = bpCanvas.height - (b + 1) * (blockHeight + blockGap);
            // 8-bit Neon Palette Steps
            if (b >= maxBlocks - 2) {
              bpCtx.fillStyle = '#ff0055'; // Hot pink / Red peak
            } else if (b >= maxBlocks - 4) {
              bpCtx.fillStyle = '#ffff00'; // Yellow
            } else if (b >= 2) {
              bpCtx.fillStyle = '#39ff14'; // Neon Green
            } else {
              bpCtx.fillStyle = '#00ffcc'; // Cyan base
            }
            bpCtx.fillRect(x, y, barWidth, blockHeight);
          }
        }
      }

      // Get average of lower frequencies for bass
      let bass = 0;
      for (let i = 0; i < 5; i++) {
        bass += dataArray[i];
      }
      bass = bass / 5;

      // Calculate intensity 0-1
      const intensity = Math.pow(bass / 255, 2);
      
      // Update VU Meters
      let overallL = 0;
      let overallR = 0;
      for (let i = 0; i < dataArray.length; i++) {
        if (i % 2 === 0) overallL += dataArray[i];
        else overallR += dataArray[i];
      }
      overallL = (overallL / (dataArray.length / 2)) / 255;
      overallR = (overallR / (dataArray.length / 2)) / 255;
      
      // Boost it a bit for visual impact
      overallL = Math.min(1, overallL * 1.5);
      overallR = Math.min(1, overallR * 1.5);
      
      if (vuL && vuR) {
        const ledsL = vuL.children;
        const ledsR = vuR.children;
        for (let i = 0; i < 10; i++) {
          if (overallL * 10 > i) ledsL[i].classList.add('active');
          else ledsL[i].classList.remove('active');
          
          if (overallR * 10 > i) ledsR[i].classList.add('active');
          else ledsR[i].classList.remove('active');
        }
      }

      const track = playlist[currentIndex];
      if (!track) return;
      const col = rgbColors[track.vinylColor] || '255,255,255';

      // Apply glow
      if (intensity > 0.1) {
        const alpha = Math.min(1, intensity * 0.8);
        const spread = 5 + (intensity * 15);
        vinylContainer.style.boxShadow = `0 0 ${spread}px ${spread}px rgba(${col}, ${alpha})`;
      } else {
        vinylContainer.style.boxShadow = 'none';
      }
    }
    renderFrame();
  }

  // Procedural Pixel Art Generator
  function generateProceduralCover(seedStr) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash);
    
    const palettes = [
      ['#2b2b2b', '#e13c50', '#ffdc64', '#ffffff'], // Retro Groove
      ['#1a1c2c', '#5d275d', '#b13e53', '#ef7d57'], // Sunset
      ['#291814', '#743a36', '#b55945', '#ea8b54'], // Rust
      ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'], // Gameboy
      ['#181425', '#404973', '#68aed4', '#c0cbdc'], // Ice
      ['#2ce8f4', '#f038ff', '#ffeb3b', '#000000'], // Cyberpunk
    ];
    
    const size = 16;
    const cellSize = 16; 
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">';
    
    let seed = index;
    const random = () => {
      let x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    
    const palette = palettes[index % palettes.length];
    svg += `<rect width="256" height="256" fill="${palette[0]}" />`;
    
    for (let y = 2; y < size - 2; y++) {
      for (let x = 2; x < size / 2; x++) {
        if (random() > 0.4) {
          const color = palette[Math.floor(random() * (palette.length - 1)) + 1];
          svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" />`;
          svg += `<rect x="${(size - 1 - x) * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" />`;
        }
      }
    }
    svg += '</svg>';
    
    return 'data:image/svg+xml;base64,' + window.btoa(svg);
  }

  // Load Music Files
  async function loadMusic() {
    try {
      const result = await window.api.readDir('music');
      if (result.success) {
        masterPlaylist = result.files.map(f => {
          const albumName = f.album || "Unknown Album";
          const fallbackSeed = albumName !== "Unknown Album" ? albumName : (f.title || f.filename);
          // Force pixel art covers for all tracks to maintain consistent retro aesthetic
          const cover = generateProceduralCover(fallbackSeed);
          
          return {
            filename: f.filename,
            path: window.api.getMusicPath(f.filename),
            title: f.title || f.filename.replace(/\.[^/.]+$/, ""),
            artist: f.artist || "Unknown Artist",
            genre: f.genre || "Unknown",
            album: albumName,
            coverBase64: cover,
            vinylColor: vinylColors[Math.floor(Math.random() * vinylColors.length)]
          };
        });

        playlist = [...masterPlaylist];

        // Group by Album
        albumMap = {};
        masterPlaylist.forEach(t => {
          if (!albumMap[t.album]) albumMap[t.album] = [];
          albumMap[t.album].push(t);
        });

        // Function to render album list in Left Pillar of Turntable Player
        function renderPlayerAlbumList() {
          const albumContainer = document.getElementById('album-list');
          if (!albumContainer) return;

          let html = `
            <div class="album-item ${currentActiveAlbum === 'all' ? 'active' : ''}" data-album="all">
              <div class="album-title">All Tracks</div>
              <div class="album-tracks">${masterPlaylist.length} tracks</div>
            </div>
            <div class="album-item ${currentActiveAlbum === '__LIKED_SONGS__' ? 'active' : ''}" data-album="__LIKED_SONGS__">
              <div class="album-title">❤️ Lagu Disukai</div>
              <div class="album-tracks">${masterPlaylist.filter(t => isFavorite(t.filename)).length} tracks</div>
            </div>
          `;

          const customPlaylists = getCustomPlaylists();
          customPlaylists.forEach(pl => {
            html += `
              <div class="album-item ${currentActiveAlbum === 'CUSTOM_' + pl.id ? 'active' : ''}" data-album="CUSTOM_${pl.id}">
                <div class="album-title">📀 ${pl.name}</div>
                <div class="album-tracks">${pl.trackFilenames.length} tracks</div>
              </div>
            `;
          });

          Object.keys(albumMap).forEach(albumName => {
            const tracks = albumMap[albumName];
            html += `
              <div class="album-item ${currentActiveAlbum === albumName ? 'active' : ''}" data-album="${albumName}">
                <div class="album-title">${albumName}</div>
                <div class="album-tracks">${tracks.length} tracks</div>
              </div>
            `;
          });

          albumContainer.innerHTML = html;

          albumContainer.querySelectorAll('.album-item').forEach(el => {
            el.onclick = () => {
              const selectedAlbum = el.getAttribute('data-album');
              currentActiveAlbum = selectedAlbum;
              albumContainer.querySelectorAll('.album-item').forEach(a => a.classList.remove('active'));
              el.classList.add('active');

              if (selectedAlbum === 'all') {
                playlist = [...masterPlaylist];
              } else if (selectedAlbum === '__LIKED_SONGS__') {
                playlist = masterPlaylist.filter(t => isFavorite(t.filename));
              } else if (selectedAlbum.startsWith('CUSTOM_')) {
                const plId = selectedAlbum.replace('CUSTOM_', '');
                const pl = getCustomPlaylists().find(p => p.id === plId);
                playlist = pl ? masterPlaylist.filter(t => pl.trackFilenames.includes(t.filename)) : [];
              } else {
                playlist = albumMap[selectedAlbum] || [];
              }

              renderPlaylist();
              if (playlist.length > 0) {
                loadTrack(0);
                playTrack();
              } else {
                showToast('Album/Playlist ini belum memiliki lagu');
              }
            };
          });
        }

        renderPlayerAlbumList();

        // Populate Home Carousel
        if (homeAlbums) {
          homeAlbums.innerHTML = '';
          Object.keys(albumMap).forEach(albumName => {
            const tracks = albumMap[albumName];
            const cover = tracks[0].coverBase64 ? `url('${tracks[0].coverBase64}')` : '#222';
            homeAlbums.innerHTML += `
            <div class="album-card" data-album="${albumName}">
              <div class="album-card-art" style="background: ${cover}; background-size: cover; background-position: center;"></div>
              <div class="album-card-title">${albumName}</div>
              <div class="album-card-artist">${tracks[0].artist}</div>
            </div>
            `;
          });
        }

          // Function to Render Library Grid (including Liked Songs & Custom Playlists)
          function renderLibraryGrid() {
            const libraryAlbumsGrid = document.getElementById('library-albums-grid');
            if (!libraryAlbumsGrid) return;

            const likedTracksCount = masterPlaylist.filter(t => isFavorite(t.filename)).length;
            const customPlaylists = getCustomPlaylists();

            let gridHtml = `
              <div class="library-album-card liked-songs-card" data-album="__LIKED_SONGS__">
                <div class="library-album-art" style="background: linear-gradient(135deg, #ff007f 0%, #7928ca 100%); display: flex; justify-content: center; align-items: center; border-radius: 8px;">
                  <span style="font-size: 40px; filter: drop-shadow(0 0 10px #ff007f);">❤️</span>
                </div>
                <div class="library-album-title" style="color: #ff77c6;">Lagu Disukai</div>
                <div class="library-album-artist">${likedTracksCount} lagu favorit</div>
              </div>
            `;

            // Custom Playlists
            customPlaylists.forEach(pl => {
              gridHtml += `
                <div class="library-album-card custom-playlist-card" data-album="CUSTOM_${pl.id}">
                  <div class="library-album-art" style="background: linear-gradient(135deg, #00ffcc 0%, #0d1b2a 100%); display: flex; justify-content: center; align-items: center; border-radius: 8px;">
                    <span style="font-size: 40px; filter: drop-shadow(0 0 10px #00ffcc);">📀</span>
                  </div>
                  <div class="library-album-title" style="color: #00ffcc;">${pl.name}</div>
                  <div class="library-album-artist">${pl.trackFilenames.length} lagu kustom</div>
                </div>
              `;
            });

            // Regular Albums
            Object.keys(albumMap).forEach(albumName => {
              const tracks = albumMap[albumName];
              const cover = tracks[0].coverBase64 ? `url('${tracks[0].coverBase64}')` : 'none';
              gridHtml += `
              <div class="library-album-card" data-album="${albumName}">
                <div class="library-album-art" style="background-image: ${cover};"></div>
                <div class="library-album-title">${albumName}</div>
                <div class="library-album-artist">${tracks[0].artist}</div>
              </div>
              `;
            });

            libraryAlbumsGrid.innerHTML = gridHtml;

            // Bind click events on library cards
            libraryAlbumsGrid.querySelectorAll('.library-album-card').forEach(el => {
              el.onclick = () => {
                const selectedAlbum = el.getAttribute('data-album');
                let tracks = [];
                let albumTitle = '';
                let albumArtist = '';
                let albumMeta = '';
                let isLikedAlbum = (selectedAlbum === '__LIKED_SONGS__');
                let isCustomPl = selectedAlbum.startsWith('CUSTOM_');
                let activeCustomPlId = null;

                if (isLikedAlbum) {
                  tracks = masterPlaylist.filter(t => isFavorite(t.filename));
                  albumTitle = 'Lagu Disukai';
                  albumArtist = 'Koleksi Favorit Kamu';
                  albumMeta = `Koleksi Pribadi • ${tracks.length} lagu`;
                } else if (isCustomPl) {
                  activeCustomPlId = selectedAlbum.replace('CUSTOM_', '');
                  const pl = getCustomPlaylists().find(p => p.id === activeCustomPlId);
                  if (pl) {
                    tracks = masterPlaylist.filter(t => pl.trackFilenames.includes(t.filename));
                    albumTitle = pl.name;
                    albumArtist = 'Playlist Kustom Kamu';
                    albumMeta = `Playlist Kustom • ${tracks.length} lagu`;
                  }
                } else {
                  tracks = albumMap[selectedAlbum] || [];
                  albumTitle = selectedAlbum;
                  albumArtist = tracks[0] ? tracks[0].artist : 'Unknown Artist';
                  albumMeta = `Album • 2026<br>${tracks.length} lagu`;
                }

                // Show Detail View
                libraryAlbumsContainer.classList.add('hidden');
                libraryAlbumDetail.classList.remove('hidden');

                // Populate Detail Header
                const detailArt = document.getElementById('library-detail-art');
                if (isLikedAlbum) {
                  detailArt.style.backgroundImage = 'none';
                  detailArt.style.background = 'linear-gradient(135deg, #ff007f 0%, #7928ca 100%)';
                  detailArt.innerHTML = '<div style="width:100%;height:100%;display:flex;justify-content:center;align-items:center;font-size:80px;filter:drop-shadow(0 0 15px #ff007f);">❤️</div>';
                } else if (isCustomPl) {
                  detailArt.style.backgroundImage = 'none';
                  detailArt.style.background = 'linear-gradient(135deg, #00ffcc 0%, #0d1b2a 100%)';
                  detailArt.innerHTML = '<div style="width:100%;height:100%;display:flex;justify-content:center;align-items:center;font-size:80px;filter:drop-shadow(0 0 15px #00ffcc);">📀</div>';
                } else {
                  detailArt.innerHTML = '';
                  const cover = tracks[0] && tracks[0].coverBase64 ? `url('${tracks[0].coverBase64}')` : 'none';
                  detailArt.style.backgroundImage = cover;
                  detailArt.style.backgroundSize = 'cover';
                }

                document.getElementById('library-detail-title').innerText = albumTitle;
                document.getElementById('library-detail-artist-text').innerText = albumArtist;
                document.getElementById('library-detail-meta').innerHTML = albumMeta;

                // Manage Add Songs Button
                const btnPlaylistAddSongs = document.getElementById('btn-playlist-add-songs');
                if (btnPlaylistAddSongs) {
                  if (isCustomPl) {
                    btnPlaylistAddSongs.style.display = 'block';
                    btnPlaylistAddSongs.onclick = () => {
                      showSelectTracksModal(activeCustomPlId, albumTitle, () => el.click());
                    };
                  } else {
                    btnPlaylistAddSongs.style.display = 'none';
                  }
                }

                // Populate Tracklist
                const tracklistContainer = document.getElementById('library-tracklist');
                tracklistContainer.innerHTML = '';

                if (tracks.length === 0) {
                  if (isCustomPl) {
                    tracklistContainer.innerHTML = `
                      <div style="padding: 50px 20px; text-align: center; color: #888;">
                        <div style="font-size: 22px; margin-bottom: 10px; color: #00ffcc;">Belum ada lagu di playlist ini</div>
                        <div style="font-size: 14px; color: #aaa; margin-bottom: 22px;">Pilih lagu favorit kamu dari koleksi untuk dimasukkan ke playlist "${albumTitle}":</div>
                        <button id="btn-empty-add-songs" class="retro-btn primary" style="font-size: 15px; padding: 12px 28px; cursor: pointer; border-radius: 8px; box-shadow: 0 0 15px rgba(0,255,204,0.4);">+ Pilih & Tambah Lagu Sekarang</button>
                      </div>
                    `;
                    const btnEmptyAdd = document.getElementById('btn-empty-add-songs');
                    if (btnEmptyAdd) {
                      btnEmptyAdd.onclick = () => {
                        showSelectTracksModal(activeCustomPlId, albumTitle, () => el.click());
                      };
                    }
                  } else {
                    tracklistContainer.innerHTML = `
                      <div style="padding: 50px 20px; text-align: center; color: #888;">
                        <div style="font-size: 20px; margin-bottom: 8px; color: #fff;">Belum ada lagu yang disukai</div>
                        <div style="font-size: 14px; color: #666;">Beri tanda suka (👍) pada lagu untuk memasukkannya ke daftar ini!</div>
                      </div>
                    `;
                  }
                } else {
                  tracks.forEach((track, idx) => {
                    const trackCover = track.coverBase64 ? `url('${track.coverBase64}')` : 'none';
                    const isFav = isFavorite(track.filename);
                    tracklistContainer.innerHTML += `
                    <div class="library-track-item" data-index="${idx}" data-filename="${track.filename}" data-album="${selectedAlbum}">
                      <div class="library-track-art" style="background-image: ${trackCover}; width: 40px; height: 40px; border-radius: 4px; margin-right: 15px; background-size: cover; background-position: center; background-color: #222;"></div>
                      <div class="library-track-info" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
                        <div class="library-track-title" style="line-height: 1.2;">${track.title}</div>
                        <div class="library-track-artist" style="font-size: 18px; color: var(--text-dim); line-height: 1.2;">${track.artist} • ${track.album}</div>
                      </div>
                      <div class="library-track-duration" style="margin-right: 15px;">-</div>
                      <div class="library-track-actions" style="display:flex; gap: 10px;">
                        <span class="track-like ${isFav ? 'icon-active' : ''}" style="font-size: 16px; cursor: pointer; color: #aaa;"><img class="pixel-icon" src="assets/icons/icon_like.bmp"></span>
                        <span class="track-dislike" style="font-size: 16px; cursor: pointer; color: #aaa;"><img class="pixel-icon" src="assets/icons/icon_dislike.bmp"></span>
                        <span class="track-more" style="font-size: 16px; cursor: pointer; color: #aaa;" title="Tambah ke Playlist"><img class="pixel-icon" src="assets/icons/icon_more.bmp"></span>
                      </div>
                    </div>
                    `;
                  });
                }

                // Bind big play button
                const btnPlay = document.getElementById('library-detail-play');
                if (btnPlay) {
                  btnPlay.onclick = () => {
                    if (tracks.length === 0) {
                      showToast('Tidak ada lagu untuk diputar!');
                      return;
                    }
                    currentActiveAlbum = selectedAlbum;
                    renderPlayerAlbumList();
                    playlist = [...tracks];
                    renderPlaylist();
                    
                    previousView = 'library';
                    if (libraryView) libraryView.classList.add('hidden');
                    if (playerView) playerView.classList.remove('hidden');
                    if (bpTogglePlayer) bpTogglePlayer.innerHTML = ICONS.down;
                    
                    loadTrack(0);
                    playTrack();
                  };
                }

                // Bind album detail options (e.g. delete custom playlist)
                const btnAlbumMore = document.getElementById('btn-album-more');
                if (btnAlbumMore) {
                  btnAlbumMore.onclick = () => {
                    if (isCustomPl && activeCustomPlId) {
                      if (confirm(`Hapus playlist "${albumTitle}"?`)) {
                        deleteCustomPlaylist(activeCustomPlId);
                        libraryAlbumDetail.classList.add('hidden');
                        libraryAlbumsContainer.classList.remove('hidden');
                        renderLibraryGrid();
                        renderPlayerAlbumList();
                      }
                    } else {
                      showToast('Opsi album...');
                    }
                  };
                }

                // Bind track clicks to play
                tracklistContainer.querySelectorAll('.library-track-item').forEach(trackEl => {
                  trackEl.onclick = () => {
                    const trackIdx = parseInt(trackEl.getAttribute('data-index'));
                    currentActiveAlbum = selectedAlbum;
                    renderPlayerAlbumList();
                    playlist = [...tracks];
                    renderPlaylist();
                    
                    previousView = 'library';
                    if (libraryView) libraryView.classList.add('hidden');
                    if (playerView) playerView.classList.remove('hidden');
                    if (bpTogglePlayer) bpTogglePlayer.innerHTML = ICONS.down;
                    
                    loadTrack(trackIdx);
                    playTrack();
                  };
                });

                // Bind track like/dislike buttons
                tracklistContainer.querySelectorAll('.track-like').forEach((btn, idx) => {
                  btn.onclick = (e) => {
                    e.stopPropagation();
                    const track = tracks[idx];
                    toggleFavorite(track);
                  };
                });
                tracklistContainer.querySelectorAll('.track-dislike').forEach((btn, idx) => {
                  btn.onclick = (e) => {
                    e.stopPropagation();
                    if (isCustomPl && activeCustomPlId) {
                      const track = tracks[idx];
                      removeTrackFromCustomPlaylist(activeCustomPlId, track.filename);
                      // Re-click current card to refresh detail
                      el.click();
                    } else {
                      btn.classList.toggle('icon-active');
                      showToast(btn.classList.contains('icon-active') ? 'Lagu tidak disukai' : 'Batal tidak disukai');
                    }
                  };
                });
                tracklistContainer.querySelectorAll('.track-more').forEach((btn, idx) => {
                  btn.onclick = (e) => {
                    e.stopPropagation();
                    const track = tracks[idx];
                    showAddToPlaylistModal(track);
                  };
                });
              };
            });
          }

          // Bind Create Playlist Button
          const btnCreatePlaylist = document.getElementById('btn-create-playlist');
          if (btnCreatePlaylist) {
            btnCreatePlaylist.onclick = () => {
              showCreatePlaylistModal(() => {
                renderLibraryGrid();
              });
            };
          }

          renderLibraryGrid();
          
          // Populate Explore View Sections
          const exploreNewReleases = document.getElementById('explore-new-releases');
          const exploreTrending = document.getElementById('explore-trending');
          
          if (exploreNewReleases && exploreTrending) {
             const allAlbums = Object.keys(albumMap);
             const shuffledNew = [...allAlbums].sort(() => Math.random() - 0.5);
             const shuffledTrend = [...allAlbums].sort(() => Math.random() - 0.5);
             
             shuffledNew.slice(0, 10).forEach(albumName => {
                const tracks = albumMap[albumName];
                const cover = tracks[0].coverBase64 ? `url('${tracks[0].coverBase64}')` : 'none';
                exploreNewReleases.innerHTML += `
                  <div class="album-card" data-album="${albumName}">
                    <div class="album-card-art" style="background: ${cover}; background-size: cover; background-position: center;"></div>
                    <div class="album-card-title">${albumName}</div>
                    <div class="album-card-artist">${tracks[0].artist}</div>
                  </div>
                `;
             });
             
             shuffledTrend.slice(0, 10).forEach(albumName => {
                const tracks = albumMap[albumName];
                const cover = tracks[0].coverBase64 ? `url('${tracks[0].coverBase64}')` : 'none';
                exploreTrending.innerHTML += `
                  <div class="album-card" data-album="${albumName}">
                    <div class="album-card-art" style="background: ${cover}; background-size: cover; background-position: center;"></div>
                    <div class="album-card-title">${albumName}</div>
                    <div class="album-card-artist">${tracks[0].artist}</div>
                  </div>
                `;
             });
          }
          
          if (btnBackLibrary) {
            btnBackLibrary.onclick = () => {
              libraryAlbumDetail.classList.add('hidden');
              libraryAlbumsContainer.classList.remove('hidden');
              renderLibraryGrid(); // Refresh counts
            };
          }
          
          // Bind clicks for Home & Explore Carousels
          document.querySelectorAll('.carousel').forEach(carousel => {
            carousel.querySelectorAll('.album-card').forEach(el => {
              el.onclick = () => {
                const selectedAlbum = el.getAttribute('data-album');
                currentActiveAlbum = selectedAlbum;
                renderPlayerAlbumList();
                playlist = albumMap[selectedAlbum] || [];
                
                // Switch to Player View
                previousView = document.getElementById('explore-view') && !document.getElementById('explore-view').classList.contains('hidden') ? 'explore' : 'home';
                if (homeView) homeView.classList.add('hidden');
                const exploreView = document.getElementById('explore-view');
                if (exploreView) exploreView.classList.add('hidden');
                
                if (playerView) playerView.classList.remove('hidden');
                if (navHome) navHome.classList.remove('active');
                if (navExplore) navExplore.classList.remove('active');
                if (bpTogglePlayer) bpTogglePlayer.innerHTML = ICONS.down;
                
                renderPlaylist();
                if (playlist.length > 0) {
                  loadTrack(0);
                  playTrack();
                }
              };
            });
          });
          
          // Bind Explore Genre Cards
          document.querySelectorAll('.genre-card').forEach(card => {
            card.onclick = () => {
              const genreName = card.innerText.trim();
              const matched = masterPlaylist.filter(t => (t.genre && t.genre.toLowerCase().includes(genreName.toLowerCase())) || (t.title && t.title.toLowerCase().includes(genreName.toLowerCase())));
              if (matched.length > 0) {
                playlist = matched;
                renderPlaylist();
                loadTrack(0);
                playTrack();
                showToast(`Memutar genre ${genreName} (${matched.length} lagu)`);
              } else {
                showToast(`Menampilkan genre: ${genreName}`);
              }
            };
          });
          
          // Live Instant Search Implementation
          function setupLiveSearch(inputId, resultsId) {
            const input = document.getElementById(inputId);
            const resultsContainer = document.getElementById(resultsId);
            if (!input || !resultsContainer) return;

            let debounceTimer;
            input.addEventListener('input', (e) => {
              clearTimeout(debounceTimer);
              const query = e.target.value.trim().toLowerCase();

              // Also filter visible cards in carousels
              document.querySelectorAll('.album-card').forEach(card => {
                const title = card.querySelector('.album-card-title').innerText.toLowerCase();
                const artist = card.querySelector('.album-card-artist').innerText.toLowerCase();
                if (!query || title.includes(query) || artist.includes(query)) {
                  card.style.display = 'block';
                } else {
                  card.style.display = 'none';
                }
              });

              if (!query) {
                resultsContainer.classList.add('hidden');
                resultsContainer.innerHTML = '';
                return;
              }

              debounceTimer = setTimeout(() => {
                const matchedTracks = masterPlaylist.filter(t => 
                  (t.title && t.title.toLowerCase().includes(query)) ||
                  (t.artist && t.artist.toLowerCase().includes(query)) ||
                  (t.album && t.album.toLowerCase().includes(query)) ||
                  (t.genre && t.genre.toLowerCase().includes(query))
                );

                if (matchedTracks.length === 0) {
                  resultsContainer.innerHTML = `<div class="search-no-result">Tidak ada lagu yang cocok dengan "${e.target.value}"</div>`;
                } else {
                  resultsContainer.innerHTML = `<div class="search-result-header">Hasil Pencarian (${matchedTracks.length})</div>`;
                  matchedTracks.slice(0, 10).forEach(track => {
                    const cover = track.coverBase64 ? `url('${track.coverBase64}')` : 'none';
                    const item = document.createElement('div');
                    item.className = 'search-result-item';
                    item.innerHTML = `
                      <div class="search-result-art" style="background-image: ${cover};"></div>
                      <div class="search-result-info">
                        <div class="search-result-title">${track.title}</div>
                        <div class="search-result-artist">${track.artist} • ${track.album}</div>
                      </div>
                    `;
                    item.onclick = () => {
                      const trackIdx = masterPlaylist.findIndex(t => t.filename === track.filename);
                      playlist = [...masterPlaylist];
                      renderPlaylist();
                      loadTrack(trackIdx >= 0 ? trackIdx : 0);
                      playTrack();
                      resultsContainer.classList.add('hidden');
                      input.value = '';
                      showToast(`Memutar: ${track.title}`);
                    };
                    resultsContainer.appendChild(item);
                  });
                }
                resultsContainer.classList.remove('hidden');
              }, 120);
            });

            // Close results when clicking outside
            document.addEventListener('click', (e) => {
              if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
                resultsContainer.classList.add('hidden');
              }
            });
          }

          setupLiveSearch('home-search-input', 'home-search-results');
          setupLiveSearch('explore-search-input', 'explore-search-results');
          
          // Bind Real Mood Chips Filtering
          const moodKeywords = {
            'sedih': ['sad', 'ballad', 'slow', 'acoustic', 'mellow', 'cry', 'rain', 'lonely', 'miss', 'hurt', 'heart', 'dark'],
            'tidur': ['sleep', 'ambient', 'chill', 'lofi', 'lullaby', 'calm', 'night', 'dream', 'soft', 'peace', 'quiet'],
            'bersantai': ['relax', 'chill', 'easy', 'jazz', 'pop', 'groove', 'summer', 'sunset', 'breeze', 'coffee', 'lo-fi'],
            'senang': ['happy', 'dance', 'disco', 'fun', 'upbeat', 'party', 'joy', 'sun', 'bright', 'smile', 'energy', 'vibe'],
            'olahraga': ['workout', 'rock', 'metal', 'electronic', 'edm', 'energy', 'beat', 'fast', 'run', 'gym', 'heavy', 'power'],
            'fokus': ['focus', 'study', 'instrumental', 'classical', 'synthwave', 'piano', 'code', 'work', 'deep', 'flow']
          };

          document.querySelectorAll('.mood-chip').forEach(chip => {
            chip.onclick = () => {
              playRetroSFX('click');
              document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('active'));
              chip.classList.add('active');
              const mood = chip.getAttribute('data-mood') || chip.innerText.toLowerCase();

              if (mood === 'all') {
                playlist = [...masterPlaylist];
                document.querySelectorAll('.album-card').forEach(card => card.style.display = 'block');
                renderPlaylist();
                showToast('Menampilkan semua koleksi lagu');
                return;
              }

              const keywords = moodKeywords[mood] || [mood];
              const matched = masterPlaylist.filter(track => {
                const text = `${track.title} ${track.artist} ${track.album} ${track.genre}`.toLowerCase();
                return keywords.some(kw => text.includes(kw));
              });

              if (matched.length > 0) {
                playlist = matched;
                renderPlaylist();
                loadTrack(0);
                playTrack();
                showToast(`Memutar mix mood "${chip.innerText}" (${matched.length} lagu) 🎵`);
              } else {
                // Curate subset
                playlist = [...masterPlaylist].sort(() => Math.random() - 0.5);
                renderPlaylist();
                loadTrack(0);
                playTrack();
                showToast(`Memutar mix mood "${chip.innerText}"`);
              }
            };
          });

        renderPlaylist();
        if (playlist.length > 0) {
          loadTrack(0);
        }
      } else {
        throw new Error(result.error || "Unknown readDir error");
      }
    } catch (e) {
      if (window.api && window.api.logError) {
        window.api.logError("loadMusic Error: " + e.message + "\n" + e.stack);
      }
      document.body.innerHTML += `<div style="position:absolute;top:0;left:0;color:red;z-index:9999;background:black;padding:10px;">loadMusic Error: ${e.message}<br>${e.stack}</div>`;
    }
  }

  function renderPlaylist() {
    playlistContainer.innerHTML = '';
    playlist.forEach((track, index) => {
      const el = document.createElement('div');
      el.className = `track-item ${index === currentIndex ? 'active' : ''}`;
      el.innerHTML = `
      <div class="track-dot" style="background: rgb(${rgbColors[track.vinylColor]})"></div>
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
      if (idx === currentIndex) el.classList.add('active');
      else el.classList.remove('active');
    });

    // Also update active album item in left pillar
    document.querySelectorAll('.album-item').forEach(el => {
      const alb = el.getAttribute('data-album');
      if (alb === currentActiveAlbum) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  function loadTrack(index) {
    currentIndex = index;
    const track = playlist[currentIndex];
    audio.src = track.path;
    lcdTitle.innerText = track.title;
    lcdArtist.innerText = track.artist;
    
    // Check if marquee is needed
    lcdTitle.classList.remove('scrolling');
    setTimeout(() => {
      if (lcdTitle.scrollWidth > lcdTitle.parentElement.clientWidth) {
        lcdTitle.classList.add('scrolling');
      }
    }, 50);
    
    const albumArt = document.getElementById('album-art');
    if (track.coverBase64) {
      albumArt.style.backgroundImage = `url('${track.coverBase64}')`;
      albumArt.style.display = 'block';
    } else {
      albumArt.style.backgroundImage = 'none';
      albumArt.style.display = 'none';
    }

    // Update global bottom player
    if (bpTitle) bpTitle.innerText = track.title;
    if (bpArtist) bpArtist.innerText = track.artist;
    if (bpArt) {
      if (track.coverBase64) {
        bpArt.style.backgroundImage = `url('${track.coverBase64}')`;
      } else {
        bpArt.style.backgroundImage = 'none';
      }
    }

    // Vinyl change animation
    vinylDisc.style.opacity = 0;
    setTimeout(() => {
      vinylDisc.src = window.api.getAssetPath(`vinyl_${track.vinylColor}.png`);
      vinylDisc.style.opacity = 1;
    }, 200);

    updatePlaylistUI();
    updateFavoritesUI();
    updateQueueDrawer();
    updateMiniPlayerUI();
    updateLyricsDrawer();
    updateMediaSession(track);
  }

  let vinylRotation = 0;
  let targetPlaybackRate = 1.0;
  let currentPlaybackRate = 0.0;
  let isVinylDragging = false;
  let isToneArmDragging = false;

  // Setup Player Interaction
  if (bpPlay) {
    bpPlay.innerHTML = ICONS.play;
  }

  function playTrack() {
    initAudioVisualizer();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    if (currentIndex === -1 && playlist.length > 0) loadTrack(0);
    
    audio.play().then(() => {
      isPlaying = true;
      playBtnIcon.src = window.api.getAssetPath('btn_start_stop_active.png');
      if (bpPlay) bpPlay.innerHTML = ICONS.pause;
      updateToneArm();
      updateMiniPlayerUI();
      playRetroSFX('play');
    }).catch(err => {
      console.log("Audio play error:", err);
    });
  }

  function pauseTrack() {
    isPlaying = false;
    audio.pause();
    currentPlaybackRate = 0;
    playBtnIcon.src = window.api.getAssetPath('btn_start_stop.png');
    if (bpPlay) bpPlay.innerHTML = ICONS.play;
    if (toneArm) toneArm.style.transform = 'rotate(-32deg) scale(0.8)';
    updateToneArm();
    updateMiniPlayerUI();
    playRetroSFX('pause');
  }

  function togglePlay() {
    if (!audio.paused || isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  }

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateToneArm() {
  if (!toneArm) return;
  if (!isPlaying && !isToneArmDragging) {
    toneArm.style.transform = 'rotate(-32deg) scale(0.8)';
    return;
  }
  const pct = (audio.currentTime && audio.duration) ? (audio.currentTime / audio.duration) : 0;
  // Starts at outer edge (-14 deg), moves inward to inner groove (+2 deg)
  const targetAngle = -14 + (pct * 16); 
  toneArm.style.transform = `rotate(${targetAngle}deg) scale(0.8)`;
}

  // Audio Events
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = audio.currentTime / audio.duration;
    progressFill.style.width = `${pct * 100}%`;
    progressThumb.style.left = `${pct * 100}%`;
    timeDisplay.innerText = formatTime(audio.currentTime);
    
    const timeDuration = document.getElementById('time-duration');
    if (timeDuration) {
      timeDuration.innerText = formatTime(audio.duration);
    }
    
    if (bpTime && audio.duration) {
      bpTime.innerText = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
    
    updateToneArm();
    syncLyricsTime(audio.currentTime);
  });

  let isAutoMix = false;
  const autoMixToggle = document.getElementById('auto-mix-toggle');
  if (autoMixToggle) {
    autoMixToggle.onchange = (e) => {
      isAutoMix = e.target.checked;
    };
  }

  audio.addEventListener('ended', () => {
    if (isRepeat) {
      playTrack();
    } else if (isAutoMix) {
      const currentGenre = playlist[currentIndex].genre;
      let foundNext = -1;
      
      if (currentGenre && currentGenre !== "Unknown") {
        for (let i = 1; i < playlist.length; i++) {
          let checkIdx = (currentIndex + i) % playlist.length;
          if (playlist[checkIdx].genre === currentGenre) {
            foundNext = checkIdx;
            break;
          }
        }
      }
      
      if (foundNext !== -1) {
        loadTrack(foundNext);
        playTrack();
      } else {
        document.getElementById('btn-next').click();
      }
    } else {
      document.getElementById('btn-next').click();
    }
  });

  // UI Controls
  let baseSpeed = 1.0;
  let pitchMultiplier = 1.0;
  
  const btn33 = document.getElementById('btn-speed-33');
  const btn45 = document.getElementById('btn-speed-45');
  
  btn33.onclick = () => {
    baseSpeed = 1.0;
    targetPlaybackRate = baseSpeed * pitchMultiplier;
    btn33.style.color = 'var(--gold)';
    btn45.style.color = '#8c91a0';
  };
  
  btn45.onclick = () => {
    baseSpeed = 1.35;
    targetPlaybackRate = baseSpeed * pitchMultiplier;
    btn45.style.color = 'var(--gold)';
    btn33.style.color = '#8c91a0';
  };

  // Pitch Fader
  const pitchSlider = document.getElementById('pitch-slider');

  pitchSlider.oninput = (e) => {
    pitchMultiplier = parseFloat(e.target.value);
    targetPlaybackRate = baseSpeed * pitchMultiplier;
  };
  
  document.getElementById('btn-play').onclick = togglePlay;

  const btnShuffle = document.getElementById('btn-shuffle');
  const iconShuffle = document.getElementById('icon-shuffle');
  iconShuffle.style.opacity = '0.5';
  btnShuffle.onclick = () => {
    isShuffled = !isShuffled;
    iconShuffle.style.opacity = isShuffled ? '1' : '0.5';
  };

  const btnRepeat = document.getElementById('btn-repeat');
  const iconRepeat = document.getElementById('icon-repeat');
  iconRepeat.style.opacity = '0.5';
  btnRepeat.onclick = () => {
    isRepeat = !isRepeat;
    iconRepeat.style.opacity = isRepeat ? '1' : '0.5';
  };

  document.getElementById('btn-prev').onclick = () => {
    if (currentIndex > 0) {
      loadTrack(currentIndex - 1);
      if (isPlaying) playTrack();
    }
  };

  document.getElementById('btn-next').onclick = () => {
    let next = currentIndex + 1;
    if (isShuffled) next = Math.floor(Math.random() * playlist.length);
    if (next < playlist.length) {
      loadTrack(next);
      if (isPlaying) playTrack();
    } else if (playlist.length > 0) {
      loadTrack(0);
      pauseTrack();
    }
  };

  // Progress scrubbing
  progressBg.onmousedown = (e) => {
    const rect = progressBg.getBoundingClientRect();
    const updateProgress = (e) => {
      let pct = (e.clientX - rect.left) / rect.width;
      pct = Math.max(0, Math.min(1, pct));
      if (audio.duration) audio.currentTime = pct * audio.duration;
    };
    updateProgress(e);

    document.onmousemove = updateProgress;
    document.onmouseup = () => {
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };

  // Vinyl Scratching
  let lastAngle = 0;
  vinylContainer.onmousedown = (e) => {
    if (!audio.duration) return;
    isVinylDragging = true;
    
    const rect = vinylContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    lastAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
    
    document.onmousemove = (moveEvent) => {
      if (!isVinylDragging) return;
      const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * 180 / Math.PI;
      let diff = currentAngle - lastAngle;
      
      // Handle wrap around
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      
      vinylRotation += diff;
      vinylContainer.style.transform = `rotate(${vinylRotation}deg)`;
      lastAngle = currentAngle;
      
      // 120 degrees = 1 second of audio
      const timeChange = diff / 120; 
      audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + timeChange));
      updateToneArm();
    };
    
    document.onmouseup = () => {
      isVinylDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };

  // Tone Arm Dragging
  toneArm.onmousedown = (e) => {
    if (!audio.duration) return;
    isToneArmDragging = true;
    
    // Bring it to the vinyl if it was resting (-32) and paused
    if (!isPlaying && audio.currentTime === 0) {
      updateToneArm();
    }
    
    let startX = e.clientX;
    let startTime = audio.currentTime;
    
    document.onmousemove = (moveEvent) => {
      if (!isToneArmDragging) return;
      let diffX = moveEvent.clientX - startX;
      
      // Moving mouse right (positive diffX) should move arm inwards (increase time)
      // Roughly 100px of drag = full track duration
      let timeChange = (diffX / 100) * audio.duration;
      let newTime = Math.max(0, Math.min(audio.duration, startTime + timeChange));
      
      audio.currentTime = newTime;
      updateToneArm(); // force update visually
    };
    
    document.onmouseup = () => {
      isToneArmDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };

  // 3-Band EQ
  document.getElementById('eq-bass').oninput = (e) => {
    if (bassFilter) bassFilter.gain.value = e.target.value;
  };
  document.getElementById('eq-mid').oninput = (e) => {
    if (midFilter) midFilter.gain.value = e.target.value;
  };
  document.getElementById('eq-treb').oninput = (e) => {
    if (trebFilter) trebFilter.gain.value = e.target.value;
  };
  
  // Echo FX
  document.getElementById('fx-echo').oninput = (e) => {
    if (echoMix) echoMix.gain.value = e.target.value;
  };

  // Volume
  const bpVolSlider = document.getElementById('bp-vol-slider');
  
  volSlider.oninput = (e) => {
    audio.volume = e.target.value;
    if (bpVolSlider) bpVolSlider.value = e.target.value;
  };

  if (bpVolSlider) {
    bpVolSlider.oninput = (e) => {
      audio.volume = e.target.value;
      if (volSlider) volSlider.value = e.target.value;
    };
  }

  // Default volume
  audio.volume = 0.5;
  volSlider.value = 0.5;
  if (bpVolSlider) bpVolSlider.value = 0.5;

  // Studio Lights (Dark Mode)
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  darkModeToggle.onchange = (e) => {
    if (e.target.checked) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  // Lo-Fi Vinyl Crackle
  let noiseNode = null;
  let noiseGain = null;
  let isLofiEnabled = false;

  function createVinylNoise() {
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        
        if (Math.random() < 0.005) pink += (Math.random() * 2 - 1) * 8; // Random crackles
        
        data[i] = pink * 0.03; 
    }
    return buffer;
  }

  function startLofiNoise() {
    if (!audioCtx) initAudioVisualizer();
    if (noiseNode) return;
    
    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = createVinylNoise();
    noiseNode.loop = true;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 3000;
    
    noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0;
    
    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    noiseNode.start();
  }

  document.getElementById('lofi-toggle').onchange = (e) => {
    isLofiEnabled = e.target.checked;
    if (isLofiEnabled && !noiseNode) {
      startLofiNoise();
    }
  };

  // Global Player Events
  const bpRepeat = document.getElementById('bp-repeat');
  const bpShuffle = document.getElementById('bp-shuffle');
  
  if (bpRepeat) {
    bpRepeat.onclick = () => {
      isRepeat = !isRepeat;
      bpRepeat.style.color = isRepeat ? '#fff' : '#777';
    };
  }

  if (bpShuffle) {
    bpShuffle.onclick = () => {
      isShuffled = !isShuffled;
      bpShuffle.style.color = isShuffled ? '#fff' : '#777';
      if (isShuffled) {
        // Basic shuffle logic: shuffle the remaining playlist
        const current = playlist[currentIndex];
        playlist.sort(() => Math.random() - 0.5);
        currentIndex = playlist.findIndex(t => t.path === current.path);
        updatePlaylistUI();
      } else {
        // Restore original order
        const current = playlist[currentIndex];
        playlist = [...masterPlaylist];
        currentIndex = playlist.findIndex(t => t.path === current.path);
        updatePlaylistUI();
      }
    };
  }
  if (bpPlay) bpPlay.onclick = togglePlay;
  if (bpPrev) bpPrev.onclick = () => {
    if (currentIndex > 0) {
      loadTrack(currentIndex - 1);
      playTrack();
    }
  };
  if (bpNext) bpNext.onclick = () => {
    if (currentIndex < playlist.length - 1) {
      loadTrack(currentIndex + 1);
      playTrack();
    }
  };
  
  const bpTogglePlayer = document.getElementById('bp-toggle-player');
  if (bpTogglePlayer) {
    bpTogglePlayer.onclick = () => {
        if (playerView.classList.contains('hidden')) {
          if (!homeView.classList.contains('hidden')) previousView = 'home';
          else if (!libraryView.classList.contains('hidden')) previousView = 'library';
          else if (document.getElementById('explore-view') && !document.getElementById('explore-view').classList.contains('hidden')) previousView = 'explore';
          
          if (homeView) homeView.classList.add('hidden');
          if (libraryView) libraryView.classList.add('hidden');
          const exploreView = document.getElementById('explore-view');
          if (exploreView) exploreView.classList.add('hidden');
          
          playerView.classList.remove('hidden');
          if (navHome) navHome.classList.remove('active');
          if (navLibrary) navLibrary.classList.remove('active');
          if (navExplore) navExplore.classList.remove('active');
          bpTogglePlayer.innerHTML = ICONS.down;
        } else {
          playerView.classList.add('hidden');
          if (previousView === 'library') {
            if (libraryView) libraryView.classList.remove('hidden');
            if (navLibrary) navLibrary.classList.add('active');
          } else if (previousView === 'explore') {
            const exploreView = document.getElementById('explore-view');
            if (exploreView) exploreView.classList.remove('hidden');
            if (navExplore) navExplore.classList.add('active');
          } else {
            if (homeView) homeView.classList.remove('hidden');
            if (navHome) navHome.classList.add('active');
          }
          bpTogglePlayer.innerHTML = ICONS.up;
        }
    };
  }

  const navExplore = document.getElementById('nav-explore');
  const exploreView = document.getElementById('explore-view');
  if (navHome) {
    navHome.onclick = (e) => {
      e.preventDefault();
      playRetroSFX('tab');
      if (playerView) playerView.classList.add('hidden');
      if (libraryView) libraryView.classList.add('hidden');
      if (exploreView) exploreView.classList.add('hidden');
      if (homeView) homeView.classList.remove('hidden');
      
      navHome.classList.add('active');
      if (navLibrary) navLibrary.classList.remove('active');
      if (navExplore) navExplore.classList.remove('active');
    };
  }
  if (navLibrary) {
    navLibrary.onclick = (e) => {
      e.preventDefault();
      playRetroSFX('tab');
      if (playerView) playerView.classList.add('hidden');
      if (homeView) homeView.classList.add('hidden');
      if (exploreView) exploreView.classList.add('hidden');
      if (libraryView) libraryView.classList.remove('hidden');
      
      navLibrary.classList.add('active');
      if (navHome) navHome.classList.remove('active');
      if (navExplore) navExplore.classList.remove('active');
    };
  }
  
  if (navExplore) {
    navExplore.onclick = (e) => {
      e.preventDefault();
      playRetroSFX('tab');
      if (playerView) playerView.classList.add('hidden');
      if (homeView) homeView.classList.add('hidden');
      if (libraryView) libraryView.classList.add('hidden');
      if (exploreView) exploreView.classList.remove('hidden');
      
      navExplore.classList.add('active');
      if (navHome) navHome.classList.remove('active');
      if (navLibrary) navLibrary.classList.remove('active');
    };
  }

  const bpSfxToggle = document.getElementById('bp-sfx-toggle');
  if (bpSfxToggle) {
    bpSfxToggle.onclick = () => {
      isSfxEnabled = !isSfxEnabled;
      if (isSfxEnabled) {
        bpSfxToggle.style.color = '#00ffcc';
        bpSfxToggle.style.borderColor = '#00ffcc';
        bpSfxToggle.style.background = 'rgba(0,255,204,0.1)';
        bpSfxToggle.title = 'Suara Retro SFX: Aktif';
        playRetroSFX('click');
        showToast('Efek Suara Retro: Aktif 🔊');
      } else {
        bpSfxToggle.style.color = '#666';
        bpSfxToggle.style.borderColor = '#444';
        bpSfxToggle.style.background = 'transparent';
        bpSfxToggle.title = 'Suara Retro SFX: Mati';
        showToast('Efek Suara Retro: Mati 🔇');
      }
    };
  }

  const bpLike = document.getElementById('bp-like');
  if (bpLike) bpLike.onclick = () => {
    if (playlist && playlist[currentIndex]) {
      toggleFavorite(playlist[currentIndex]);
    } else {
      showToast('Pilih lagu terlebih dahulu');
    }
  };
  
  const bpDislike = document.getElementById('bp-dislike');
  if (bpDislike) bpDislike.onclick = () => {
    bpDislike.classList.toggle('icon-active');
    playRetroSFX('click');
    showToast(bpDislike.classList.contains('icon-active') ? 'Lagu tidak disukai' : 'Lagu batal tidak disukai');
  };

  // Queue Drawer Toggle Handlers
  const bpQueueBtn = document.getElementById('bp-queue-btn');
  const queueDrawer = document.getElementById('queue-drawer');
  const btnCloseQueue = document.getElementById('btn-close-queue');

  if (bpQueueBtn && queueDrawer) {
    bpQueueBtn.onclick = () => {
      queueDrawer.classList.toggle('hidden');
      playRetroSFX('tab');
      if (!queueDrawer.classList.contains('hidden')) {
        updateQueueDrawer();
      }
    };
  }

  if (btnCloseQueue && queueDrawer) {
    btnCloseQueue.onclick = () => {
      queueDrawer.classList.add('hidden');
      playRetroSFX('click');
    };
  }

  // Global Drag & Drop for Audio Files (.mp3, .wav, .ogg)
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

    const files = Array.from(e.dataTransfer.files).filter(f => 
      /\.(mp3|wav|ogg|flac|m4a)$/i.test(f.name)
    );

    if (files.length === 0) {
      showToast('Hanya format file audio yang didukung!');
      return;
    }

    const newTracks = files.map((file, idx) => {
      const title = file.name.replace(/\.[^/.]+$/, "");
      const fallbackSeed = title;
      const cover = generateProceduralCover(fallbackSeed);
      const filePath = file.path || URL.createObjectURL(file);

      return {
        filename: file.name,
        path: filePath,
        title: title,
        artist: "Berkas Lokal",
        genre: "Custom Drop",
        album: "Local Drops",
        coverBase64: cover,
        vinylColor: vinylColors[idx % vinylColors.length]
      };
    });

    // Prepend to masterPlaylist and current playlist
    masterPlaylist = [...newTracks, ...masterPlaylist];
    playlist = [...newTracks, ...playlist];
    
    renderPlaylist();
    loadTrack(0);
    playTrack();
    playRetroSFX('like');
    showToast(`Berhasil memuat ${files.length} lagu baru! 🎵`);
  });

  // Lyrics Drawer Toggle Handlers
  const bpLyricsBtn = document.getElementById('bp-lyrics-btn');
  const lyricsDrawer = document.getElementById('lyrics-drawer');
  const btnCloseLyrics = document.getElementById('btn-close-lyrics');

  if (bpLyricsBtn && lyricsDrawer) {
    bpLyricsBtn.onclick = () => {
      lyricsDrawer.classList.toggle('hidden');
      playRetroSFX('tab');
      if (!lyricsDrawer.classList.contains('hidden')) {
        updateLyricsDrawer();
      }
    };
  }

  if (btnCloseLyrics && lyricsDrawer) {
    btnCloseLyrics.onclick = () => {
      lyricsDrawer.classList.add('hidden');
      playRetroSFX('click');
    };
  }

  function switchToPlayerView() {
    if (homeView && !homeView.classList.contains('hidden')) previousView = 'home';
    else if (libraryView && !libraryView.classList.contains('hidden')) previousView = 'library';
    else if (exploreView && !exploreView.classList.contains('hidden')) previousView = 'explore';
    
    if (homeView) homeView.classList.add('hidden');
    if (libraryView) libraryView.classList.add('hidden');
    if (exploreView) exploreView.classList.add('hidden');
    
    if (playerView) playerView.classList.remove('hidden');
    if (navHome) navHome.classList.remove('active');
    if (navLibrary) navLibrary.classList.remove('active');
    if (navExplore) navExplore.classList.remove('active');
    if (bpTogglePlayer) bpTogglePlayer.innerHTML = ICONS.down;
    
    updatePlaylistUI();
    const activeTrackEl = document.querySelector('.track-item.active');
    if (activeTrackEl) {
      activeTrackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // Floating Mini Player Handlers
  const bpMiniBtn = document.getElementById('bp-mini-btn');
  const miniPlayerWidget = document.getElementById('mini-player-widget');
  const btnExpandMini = document.getElementById('btn-expand-mini');
  const miniPrev = document.getElementById('mini-prev');
  const miniPlay = document.getElementById('mini-play');
  const miniNext = document.getElementById('mini-next');
  const miniBody = document.querySelector('.mini-player-body');

  if (bpMiniBtn && miniPlayerWidget) {
    bpMiniBtn.onclick = () => {
      miniPlayerWidget.classList.toggle('hidden');
      playRetroSFX('tab');
      if (!miniPlayerWidget.classList.contains('hidden')) {
        updateMiniPlayerUI();
      }
    };
  }

  if (btnExpandMini && miniPlayerWidget) {
    btnExpandMini.onclick = () => {
      miniPlayerWidget.classList.add('hidden');
      switchToPlayerView();
      playRetroSFX('click');
    };
  }

  if (miniBody && miniPlayerWidget) {
    miniBody.style.cursor = 'pointer';
    miniBody.onclick = () => {
      miniPlayerWidget.classList.add('hidden');
      switchToPlayerView();
      playRetroSFX('click');
    };
  }

  if (miniPrev) {
    miniPrev.onclick = () => {
      if (currentIndex > 0) {
        loadTrack(currentIndex - 1);
        playTrack();
      }
    };
  }

  if (miniPlay) {
    miniPlay.onclick = () => {
      togglePlay();
    };
  }

  if (miniNext) {
    miniNext.onclick = () => {
      if (currentIndex < playlist.length - 1) {
        loadTrack(currentIndex + 1);
        playTrack();
      }
    };
  }

  // Initialize Desktop Features
  setupKeyboardShortcuts();
  setupMediaSession();

  // Start
  loadMusic();

} catch (err) {
  if (window.api && window.api.logError) {
    window.api.logError("Init Error: " + err.message + "\n" + err.stack);
  }
  document.body.innerHTML += `<div style="position:absolute;top:0;left:0;color:red;z-index:9999;background:black;padding:10px;font-size:20px;">Init Error: ${err.message}<br>${err.stack}</div>`;
}

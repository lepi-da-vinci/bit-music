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

  function renameCustomPlaylist(playlistId, newName) {
    if (!newName || !newName.trim()) return null;
    const list = getCustomPlaylists();
    const pl = list.find(p => p.id === playlistId);
    if (!pl) return null;
    pl.name = newName.trim();
    saveCustomPlaylists(list);
    showToast(`Nama diubah menjadi "${pl.name}"! ✏️`);
    return pl;
  }

  function deleteCustomPlaylist(playlistId) {
    let list = getCustomPlaylists();
    const pl = list.find(p => p.id === playlistId);
    const name = pl ? pl.name : 'Playlist';
    list = list.filter(p => p.id !== playlistId);
    saveCustomPlaylists(list);
    showToast(`Playlist "${name}" telah dihapus`);
  }

  // Auto-generate curated smart albums from all library songs
  function autoGenerateSmartAlbums(force = false) {
    let list = getCustomPlaylists();
    if (!force && list.length >= 4) return 0;

    const albumDefs = [
      {
        name: 'The Weeknd - The Starboy Highlights',
        pattern: /weeknd|blinding|save your|starboy|timeless|one of the girls/i
      },
      {
        name: 'Shawn Mendes - Greatest Essentials',
        pattern: /shawn mendes|treat you|stitches|holdin me back|imagination|in my blood/i
      },
      {
        name: 'Rex Orange County & Bedroom Pop',
        pattern: /rex orange|best friend|television so far|ricky montgomery|line without|steve lacy|dark red|tek it|sofia/i
      },
      {
        name: 'Indie Rock & Pop-Punk Anthems',
        pattern: /arctic monkeys|505|neck deep|december|wish you were here|bleachers|cash cash|hero/i
      },
      {
        name: 'Alternative, Dreampop & Shoegaze',
        pattern: /the 1975|about you|the neighbourhood|sweater weather|bôa|duvet|tv girl|lovers rock|her s|harvey|she him|i thought i saw|freaks/i
      },
      {
        name: 'Reality Club & Crayon Case Hits',
        pattern: /reality club|am i bothering|lovers like you|crayon case|gravits|surabaya|because|neu automobile/i
      },
      {
        name: 'Pop Viral Hits & Radio Favorites',
        pattern: /billie eilish|birds of a feather|die with a smile|shape of you|as it was|cupid|symphony|cheap thrills|circles|boy's a liar|kill bill|i don't care/i
      },
      {
        name: 'Chill Vibes, R&B & Senja',
        pattern: /kecoud|shawty|alex crichton|merry christmas|ravyn lenae|love me not|heartbreak anniversary|here with me|every summertime|hurts so good|i like me better|let her go|khalid|young dumb|still got time|double take|take me to the beach|nurlela/i
      },
      {
        name: 'Retro Chiptune & 8-Bit Beats',
        pattern: /pak vramroro|fufufafa|anti|hero|stuck in space|cloud 9|cloud|sunflower|the shade|this side of paradise|youth|fallen|i'm done waiting|shelter/i
      }
    ];

    let createdCount = 0;
    const existingNames = new Set(list.map(p => p.name.toLowerCase()));

    albumDefs.forEach(def => {
      const matchingTracks = masterPlaylist.filter(t => 
        def.pattern.test(t.title + ' ' + t.artist + ' ' + t.filename)
      );
      if (matchingTracks.length > 0) {
        if (!existingNames.has(def.name.toLowerCase())) {
          const newPl = {
            id: 'pl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: def.name,
            trackFilenames: matchingTracks.map(t => t.filename)
          };
          list.push(newPl);
          createdCount++;
        }
      }
    });

    // Capture any unassigned songs into 'Koleksi Lagu Lainnya'
    const allAssignedFilenames = new Set();
    list.forEach(pl => pl.trackFilenames.forEach(f => allAssignedFilenames.add(f)));
    const unassignedTracks = masterPlaylist.filter(t => !allAssignedFilenames.has(t.filename));
    if (unassignedTracks.length > 0 && !existingNames.has('koleksi lagu lainnya')) {
      list.push({
        id: 'pl_' + Date.now() + '_other',
        name: 'Koleksi Lagu Lainnya',
        trackFilenames: unassignedTracks.map(t => t.filename)
      });
      createdCount++;
    }

    saveCustomPlaylists(list);
    return createdCount;
  }

  // Retro Confirm Modal (replaces browser confirm)
  function showRetroConfirmModal(title, message, confirmBtnText, onConfirm) {
    const modalContainer = document.getElementById('retro-modal-container');
    const modalTitle = document.getElementById('retro-modal-title');
    const modalBody = document.getElementById('retro-modal-body');
    const btnCancel = document.getElementById('retro-modal-cancel');
    const btnConfirm = document.getElementById('retro-modal-confirm');
    if (!modalContainer) return;

    btnConfirm.style.display = 'block';
    btnCancel.style.display = 'block';
    btnConfirm.innerText = confirmBtnText || 'HAPUS';
    btnConfirm.style.background = '#ff007f';
    btnConfirm.style.borderColor = '#ff007f';
    btnConfirm.style.color = '#fff';
    modalTitle.innerText = title || 'KONFIRMASI';
    modalBody.innerHTML = `
      <div style="font-size: 14px; color: #eee; line-height: 1.5; padding: 10px 0;">
        ${message}
      </div>
    `;
    modalContainer.classList.remove('hidden');
    playRetroSFX('click');

    const resetButtons = () => {
      btnConfirm.style.background = '';
      btnConfirm.style.borderColor = '';
      btnConfirm.style.color = '';
    };

    btnCancel.onclick = () => {
      resetButtons();
      modalContainer.classList.add('hidden');
      playRetroSFX('click');
    };

    btnConfirm.onclick = () => {
      resetButtons();
      modalContainer.classList.add('hidden');
      playRetroSFX('like');
      if (onConfirm) onConfirm();
    };
  }

  // Retro Playlist Options Action Sheet Modal
  function showPlaylistOptionsMenu(playlistId, playlistName, callbacks) {
    const modalContainer = document.getElementById('retro-modal-container');
    const modalTitle = document.getElementById('retro-modal-title');
    const modalBody = document.getElementById('retro-modal-body');
    const btnCancel = document.getElementById('retro-modal-cancel');
    const btnConfirm = document.getElementById('retro-modal-confirm');
    if (!modalContainer) return;

    btnConfirm.style.display = 'none';
    btnCancel.style.display = 'block';
    btnCancel.innerText = 'TUTUP';
    modalTitle.innerText = 'OPSI PLAYLIST';
    modalBody.innerHTML = `
      <div style="font-size: 15px; color: #00ffcc; font-weight: bold; margin-bottom: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        📼 ${playlistName}
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button id="btn-opt-rename" class="retro-btn" style="width: 100%; text-align: left; padding: 12px 15px; background: rgba(0,255,204,0.1); border: 1px solid #00ffcc; color: #00ffcc; border-radius: 6px; font-family: inherit; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s;">
          <span style="font-size: 16px;">✏️</span> Ubah Nama Playlist
        </button>
        <button id="btn-opt-manage-songs" class="retro-btn" style="width: 100%; text-align: left; padding: 12px 15px; background: rgba(255,170,0,0.1); border: 1px solid #ffaa00; color: #ffaa00; border-radius: 6px; font-family: inherit; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s;">
          <span style="font-size: 16px;">➕</span> Kelola & Pilih Lagu (+ / ✕)
        </button>
        <button id="btn-opt-delete" class="retro-btn" style="width: 100%; text-align: left; padding: 12px 15px; background: rgba(255,0,127,0.1); border: 1px solid #ff007f; color: #ff007f; border-radius: 6px; font-family: inherit; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s;">
          <span style="font-size: 16px;">🗑️</span> Hapus Playlist Ini
        </button>
      </div>
    `;
    modalContainer.classList.remove('hidden');
    playRetroSFX('click');

    btnCancel.onclick = () => {
      modalContainer.classList.add('hidden');
      playRetroSFX('click');
    };

    const optRename = document.getElementById('btn-opt-rename');
    if (optRename) {
      optRename.onclick = () => {
        modalContainer.classList.add('hidden');
        if (callbacks.onRename) callbacks.onRename();
      };
    }

    const optManage = document.getElementById('btn-opt-manage-songs');
    if (optManage) {
      optManage.onclick = () => {
        modalContainer.classList.add('hidden');
        if (callbacks.onManageSongs) callbacks.onManageSongs();
      };
    }

    const optDelete = document.getElementById('btn-opt-delete');
    if (optDelete) {
      optDelete.onclick = () => {
        modalContainer.classList.add('hidden');
        if (callbacks.onDelete) callbacks.onDelete();
      };
    }
  }

  // Retro Modal System: Rename Playlist
  function showRenamePlaylistModal(playlistId, currentName, onRenamed) {
    const modalContainer = document.getElementById('retro-modal-container');
    const modalTitle = document.getElementById('retro-modal-title');
    const modalBody = document.getElementById('retro-modal-body');
    const btnCancel = document.getElementById('retro-modal-cancel');
    const btnConfirm = document.getElementById('retro-modal-confirm');
    if (!modalContainer || !modalTitle || !modalBody) return;

    btnConfirm.style.display = 'block';
    btnCancel.style.display = 'block';
    btnConfirm.innerText = 'Simpan Nama';
    modalTitle.innerText = 'Ubah Nama Album / Playlist';
    modalBody.innerHTML = `
      <div style="font-size: 14px; color: #aaa; margin-bottom: 8px;">Masukkan nama baru:</div>
      <input type="text" id="retro-rename-input" class="retro-input" value="${(currentName || '').replace(/"/g, '&quot;')}" autofocus>
    `;
    modalContainer.classList.remove('hidden');
    playRetroSFX('click');

    const input = document.getElementById('retro-rename-input');
    if (input) {
      setTimeout(() => {
        input.focus();
        input.select();
      }, 50);
    }

    btnCancel.onclick = () => {
      modalContainer.classList.add('hidden');
      playRetroSFX('click');
    };

    btnConfirm.onclick = () => {
      const newName = input ? input.value.trim() : '';
      if (!newName) {
        showToast('Nama tidak boleh kosong!');
        return;
      }
      const updated = renameCustomPlaylist(playlistId, newName);
      modalContainer.classList.add('hidden');
      playRetroSFX('like');
      if (onRenamed) onRenamed(newName);
    };

    if (input) {
      input.onkeydown = (e) => {
        if (e.key === 'Enter') btnConfirm.click();
        if (e.key === 'Escape') btnCancel.click();
      };
    }
  }

  // Retro Modal System: Create Playlist
  function showCreatePlaylistModal(onCreated) {
    const modalContainer = document.getElementById('retro-modal-container');
    const modalTitle = document.getElementById('retro-modal-title');
    const modalBody = document.getElementById('retro-modal-body');
    const btnCancel = document.getElementById('retro-modal-cancel');
    const btnConfirm = document.getElementById('retro-modal-confirm');
    if (!modalContainer) return;

    btnConfirm.style.display = 'block';
    btnCancel.style.display = 'block';
    btnConfirm.innerText = 'Buat Playlist';
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

    modalTitle.innerText = `PILIH LAGU: "${playlistName}"`;
    btnConfirm.innerText = 'SELESAI';
    btnConfirm.style.display = 'block';
    btnCancel.style.display = 'none';

    // Set static search input container once (never destroy input on typing!)
    modalBody.innerHTML = `
      <input type="text" id="track-picker-search" class="retro-input" placeholder="Cari judul lagu atau artis..." style="margin-bottom: 12px; width: 100%; box-sizing: border-box;">
      <div id="track-picker-items" style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
        <!-- Injected via JS -->
      </div>
    `;

    const searchInput = document.getElementById('track-picker-search');
    const itemsContainer = document.getElementById('track-picker-items');

    function renderItems(query = '') {
      if (!itemsContainer) return;
      const pl = getCustomPlaylists().find(p => p.id === playlistId);
      const currentFilenames = pl ? pl.trackFilenames : [];
      
      const q = (query || '').toLowerCase().trim();
      const filtered = masterPlaylist.filter(t => 
        !q || 
        t.title.toLowerCase().includes(q) || 
        t.artist.toLowerCase().includes(q)
      );

      if (filtered.length === 0) {
        itemsContainer.innerHTML = `<div style="color: #777; text-align: center; padding: 25px 10px; font-size: 13px;">TIDAK ADA LAGU YANG COCOK</div>`;
        return;
      }

      let itemsHtml = '';
      filtered.forEach(track => {
        const isAdded = currentFilenames.includes(track.filename);
        const cover = track.coverBase64 ? `url('${track.coverBase64}')` : 'none';
        itemsHtml += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 6px; border: 1px solid ${isAdded ? '#00ffcc' : 'transparent'};">
            <div style="display: flex; align-items: center; gap: 10px; overflow: hidden; margin-right: 10px;">
              <div style="width: 32px; height: 32px; border-radius: 4px; background-image: ${cover}; background-size: cover; background-position: center; background-color: #222; flex-shrink: 0; image-rendering: pixelated;"></div>
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
      itemsContainer.innerHTML = itemsHtml;

      itemsContainer.querySelectorAll('.picker-toggle-btn').forEach(btn => {
        btn.onclick = () => {
          const fn = btn.getAttribute('data-filename');
          const currentPl = getCustomPlaylists().find(p => p.id === playlistId);
          if (currentPl && currentPl.trackFilenames.includes(fn)) {
            removeTrackFromCustomPlaylist(playlistId, fn);
          } else {
            addTrackToCustomPlaylist(playlistId, fn);
          }
          renderItems(searchInput ? searchInput.value : '');
        };
      });
    }

    if (searchInput) {
      searchInput.oninput = (e) => {
        renderItems(e.target.value);
      };
      setTimeout(() => searchInput.focus(), 50);
    }

    renderItems('');
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

  let currentLyrics = [];
  let currentLyricTrackKey = '';

  const BUILTIN_LRC = {
    // 1. CRAYON CASE TRACKS (Indie Shoegaze / Pop Noise band from Surabaya)
    'crayon case - gravits': `[00:00.00]♪ Crayon Case - Gravits ♪
[00:15.00][Intro - Shoegaze Guitar Distortion & Drum Build]
[00:50.84]Gumpalan awan
[00:52.96]Yang menggelapkan cerah mentari pagi
[00:57.12]Mencuri
[00:59.04]Senyuman dan pandangan yang nyaman
[01:03.20]Dirimu pudar hilang menjadi
[01:07.44]Butiran yang biaskan lantunan masa lalu
[01:13.12]Berjalan bersama waktu yang sungguh jenuh
[01:17.60]Dan ku...
[01:19.20]Mengejar bayangan kilau yang kau tinggalkan
[01:24.48]Sebagai memori yang takkan pergi
[01:28.00]Mimpi kan berganti dan takkan pernah berhenti
[01:33.60]Kan ku katakan sampai jumpa di lain hari
[01:42.00][Shoegaze Guitar Noise Solo]
[02:18.00]Gumpalan awan
[02:20.50]Yang menggelapkan cerah mentari pagi
[02:24.80]Mencuri
[02:26.50]Senyuman dan pandangan yang nyaman
[02:30.80]Dirimu pudar hilang menjadi
[02:35.00]Butiran yang biaskan lantunan masa lalu
[02:40.50]Berjalan bersama waktu yang sungguh jenuh
[02:45.00]Dan ku...
[02:47.00]Mengejar bayangan kilau yang kau tinggalkan
[02:52.00]Sebagai memori yang takkan pergi
[02:56.00]Mimpi kan berganti dan takkan pernah berhenti
[03:01.00]Kan ku katakan sampai jumpa di lain hari
[03:10.00][Outro - Shoegaze Drone & Fade Out]`,

    'crayon case - surabaya': `[00:00.00]♪ Crayon Case - Surabaya ♪
[00:15.00][Intro - Melodi Gitar Senja]
[00:40.04]Surabaya terguyur hujan lagi
[00:44.51]Bulevar berhenti
[00:47.52]Bersemi
[00:51.24]Masa-masa terlewati, berdikari
[00:55.80]Berapa lama lagi
[00:59.04]Kau pergi?
[01:01.59]Dan ku memandang
[01:06.79]Riuh landskap kota
[01:10.36]Yang renta
[01:14.52]"Sepertinya curah hujan akan lebat"
[01:20.25]Basa basi lawas itu terus melekat
[01:24.18]Di dalam benak
[01:27.01]Lalu lintas
[01:29.90]Bergerak
[01:33.00]Aku terus bertanya
[01:36.75]"Kapankah jawaban darimu datang?"
[01:42.00]Ku rasa arahku telah menghilang
[01:46.80]Terkecundang
[01:49.84]"Sudahlah, percuma"
[01:55.54]"Sangat payah mengingat"
[01:59.15]Sungguh konyol yang sudah terlewatkan
[02:04.85]Ku bahkan belum sempat menjelaskan apapun
[02:34.18]Menenggak kopi kaleng di Kota Lama
[02:39.59]Mengitari makam film Gedung Mitra
[02:45.58]Mengantri validasi tiket kereta
[02:50.48]"Mungkin aku akan segera terlupa dan terlepas"
[02:58.11]Lalu lintas
[03:00.50]Melekas
[03:03.80]Aku terus bertanya
[03:07.60]"Akankah kereta komuter datang?"
[03:12.67]Ku rasa arahku telah menghilang
[03:18.00]Terkecundang
[03:20.28]"Sudahlah, percuma"
[03:26.10]"Sangat payah mengingat"
[03:30.12]Sungguh konyol yang sudah terlewatkan
[03:35.65]Tapi sialan, memang menyakitkan
[03:45.00][Outro - Melodi Gitar Senja]`,

    'because': `[00:00.00]♪ Crayon Case - because, ♪
[00:14.00]Binar berpijar, dunia berputar
[00:20.50]Pandangan buram membalut
[00:26.50]Walau memudar, walau terpencar
[00:32.50]Langkah takkan terhenti
[00:38.00]Karena waktu berlari menuju
[00:44.00]Tawa yang sendu di hari ke tujuh
[00:50.00]Jiwa yang lesu menggebu merujuk
[00:56.00]Nafas terbuntu, menjerat diriku
[01:03.00]Dan kau mengejar, dan kau terlantar
[01:09.50]Angan-anganmu menderu
[01:15.50]Kasad tersamar, lengah terdengar
[01:21.50]Hari baru menyusul
[01:27.00]Karena waktu tak akan menunggu
[01:33.00]Takkan membeku diam terpaku
[01:39.00]Jiwa yang lesu memberikan pilu
[01:45.00]Mimpi berlalu, tak akan tersentuh
[01:51.00]Merampas harapan baru
[01:54.50]Menjerumuskan diriku
[01:58.00]Memberi tanda sembilu
[02:01.50]Di bawah selimut ku terus bermimpi palsu
[02:06.50]Perasaan yang tabu, tak akan terungkap
[02:11.50]Mencekam tubuhku dalam ruangan yang gelap
[02:16.50]Panas menyengat, peluh keringat
[02:20.50]Suara kota memanggilku
[02:24.50]Mesin berjalan dalam acuan
[02:28.50]Langkah takkan terhenti
[02:33.00]Karena waktu berlari menuju
[02:39.00]Tawa yang sendu di hari ketujuh
[02:45.00]Jiwa yang lesu memberikan pilu
[02:51.00]Mimpi berlalu, tak akan tersentuh
[02:57.00]Merampas harapan baru
[03:00.50]Menjerumuskan diriku
[03:05.00]Karena waktu berlalu
[03:10.00]Dan takkan pernah menunggu`,

    'neu automobile': `[00:00.00]♪ Crayon Case - Neu Automobile ♪
[00:15.00][Intro - Driving Synth & Shoegaze Noise]
[00:30.00]Melaju kencang di jalanan lengang
[00:36.50]Lampu kota berbayang gemerlap malam
[00:43.00]Mesin berderu menembus batas waktu
[00:49.50]Tinggalkan semua keraguan di kalbu
[00:56.00]Neu automobile membawaku pergi
[01:02.50]Mencari arah yang tak pasti lagi
[01:09.00]Ke mana angin kan berhembus kencang
[01:15.50]Bersama melodi yang terus berdendang
[01:23.00][Guitar Interlude]
[01:45.00]Goresan memori di kaca spion
[01:51.50]Masa lalu yang kini jadi kenangan
[01:58.00]Takkan berhenti, takkan menoleh lagi
[02:04.50]Menuju ufuk fajar yang abadi
[02:11.00]Neu automobile membawaku pergi
[02:17.50]Mencari arah yang tak pasti lagi
[02:24.00]Ke mana angin kan berhembus kencang
[02:30.50]Bersama melodi yang terus berdendang
[02:40.00][Outro]`,

    // 2. REALITY CLUB TRACKS
    'am i bothering you': `[00:00.00]♪ Reality Club - Am I Bothering You? ♪
[00:15.00]We're both looking for something
[00:18.50]We've been through it all and nothing
[00:22.00]Sets us apart from the rest
[00:29.00]I've been pacing the hallway
[00:32.50]Waiting for you to call me
[00:36.00]And tell me that I'm your best
[00:43.00]Am I bothering you?
[00:47.00]With my endless questions
[00:50.50]Or am I falling for you?
[00:54.00]Without any hesitation
[00:57.50]Am I bothering you?
[01:01.00]When I look in your eyes
[01:04.50]Are you feeling it too?
[01:08.00]Or is it just in my mind?`,

    'youll find lovers like you and me': `[00:00.00]♪ Reality Club - You'll Find Lovers Like You and Me ♪
[00:12.00]You say you want a romance
[00:15.50]Someone to take a chance
[00:19.00]To dance with you in the pouring rain
[00:25.00]You say you want devotion
[00:28.50]An ocean of emotion
[00:32.00]To wash away all of your pain
[00:38.00]And you'll find lovers like you and me
[00:44.50]Floating across an endless sea
[00:51.00]Searching for places we ought to be
[00:57.50]You'll find lovers like you and me`,

    // 3. THE WEEKND TRACKS
    'the weeknd - blinding lights': `[00:00.00]♪ The Weeknd - Blinding Lights ♪
[00:13.50]Yeah
[00:15.80]I've been tryna call
[00:18.50]I've been on my own for long enough
[00:22.50]Maybe you can show me how to love, maybe
[00:29.80]I'm going through withdrawals
[00:33.20]You don't even have to do too much
[00:37.00]You can turn me on with just a touch, baby
[00:44.20]I look around and Sin City's cold and empty
[00:49.00]No one's around to judge me
[00:52.50]I can't see clearly when you're gone
[00:57.00]I said, ooh, I'm blinded by the lights
[01:03.50]No, I can't sleep until I feel your touch
[01:11.50]I said, ooh, I'm drowning in the night
[01:17.80]Oh, when I'm like this, you're the one I trust
[01:27.50]I'm running out of time
[01:30.80]'Cause I can see the sun light up the sky
[01:34.50]So I hit the road in overdrive, baby, oh
[01:42.00]The city's cold and empty
[01:46.50]No one's around to judge me
[01:50.00]I can't see clearly when you're gone
[01:54.50]I said, ooh, I'm blinded by the lights
[02:01.00]No, I can't sleep until I feel your touch
[02:08.50]I said, ooh, I'm drowning in the night
[02:15.50]Oh, when I'm like this, you're the one I trust`,

    'the weeknd - save your tears': `[00:00.00]♪ The Weeknd - Save Your Tears ♪
[00:06.00]Na-na, yeah
[00:10.50]I saw you dancing in a crowded room
[00:15.50]You look so happy when I'm not with you
[00:20.50]But then you saw me, caught you by surprise
[00:25.50]A single teardrop falling from your eye
[00:31.00]I don't know why I run away
[00:36.50]I'll make you cry when I run away
[00:41.50]You could've asked me why I broke your heart
[00:46.50]You could've told me that you fell apart
[00:51.50]But you walked past me like I wasn't there
[00:56.50]And just pretended like you didn't care
[01:02.00]I don't know why I run away
[01:07.50]I'll make you cry when I run away
[01:12.50]Take me back 'cause I wanna stay
[01:17.50]Save your tears for another
[01:21.00]Save your tears for another day
[01:28.00]Save your tears for another day`,

    'the weeknd - starboy': `[00:00.00]♪ The Weeknd - Starboy (feat. Daft Punk) ♪
[00:10.00]I'm tryna put you in the worst mood, ah
[00:13.50]P1 cleaner than your church shoes, ah
[00:16.80]Milli point two just to hurt you, ah
[00:20.00]All red Lamb' just to tease you, ah
[00:23.50]None of these toys on lease too, ah
[00:26.80]Made your whole year in a week too, yah
[00:30.00]Main bitch out your league too, ah
[00:33.50]Side bitch out of your league too, ah
[00:36.80]House so empty, need a centerpiece
[00:40.00]Twenty racks a table cut from ebony
[00:43.50]Cut that ivory into skinny pieces
[00:46.80]Then she clean it with her face, man I love my baby
[00:50.00]You talking money, need a hearing aid
[00:53.50]You talking 'bout me, I don't see a shade
[00:56.80]Switch up my style, I take any lane
[01:00.00]I switch up my cup, I kill any pain
[01:03.50]Look what you've done
[01:06.80]I'm a motherfuckin' starboy
[01:10.00]Look what you've done
[01:13.50]I'm a motherfuckin' starboy`,

    'the weeknd playboi carti - timeless': `[00:00.00]♪ The Weeknd & Playboi Carti - Timeless ♪
[00:08.50]Ever since I was a jit, knew I was the shit
[00:12.50]Shorty wanna hit, pull up in that whip
[00:16.50]Double R tint, money in the mitt
[00:20.50]Diamonds on my wrist, timeless when I spit
[00:24.50]She said that she love me, I told her "Don't trip"
[00:28.50]Living in the fast lane, taking every risk
[00:32.50]Timeless, timeless, yeah we timeless
[00:36.50]Shining in the dark, you can't blind this`,

    'the weeknd, jennie': `[00:00.00]♪ The Weeknd, JENNIE, Lily-Rose Depp - One Of The Girls ♪
[00:14.00]Lock me up and throw away the key
[00:20.50]He knows how to get the best out of me
[00:27.50]I'm no force for the world to see
[00:34.00]Trade my whole life just to be
[00:40.50]Tell nobody I control ya
[00:44.00]I'm the only one that knows ya
[00:47.50]Show me how you love, show me how you touch
[00:51.00]Tell nobody I control ya
[00:54.50]Push me down, hold me down
[00:58.00]Spit in my mouth, make me proud
[01:01.50]Give me all your love, give me all your heart
[01:05.00]I just wanna be one of your girls tonight`,

    // 4. BILLIE EILISH & LADY GAGA / BRUNO MARS
    'billie eilish - birds of a feather': `[00:00.00]♪ Billie Eilish - BIRDS OF A FEATHER ♪
[00:09.50]I want you to stay
[00:13.50]'Til I'm in the grave
[00:18.00]'Til I rot away, dead and buried
[00:22.50]'Til I'm in the casket you carry
[00:27.00]If you go, I'm goin' too, uh
[00:31.50]'Cause it was always you (Alright)
[00:36.00]And if I'm turnin' blue, please don't save me
[00:40.50]Nothin' in this world to distrust, baby
[00:44.80]Birds of a feather, we should stick together, I know
[00:49.50]I said I'd never think I wasn't better alone
[00:54.00]Can't change the weather, might not be forever
[00:58.50]But if it's forever, it's even better
[01:03.00]And I don't know what I'm cryin' for
[01:07.50]I don't think I could love you more
[01:12.00]It might not be long, but baby, I
[01:16.50]I'll love you 'til the day that I die`,

    'lady gaga bruno mars - die with a smile': `[00:00.00]♪ Lady Gaga & Bruno Mars - Die With A Smile ♪
[00:09.50]I, I just woke up from a dream
[00:15.50]Where you and I had to say goodbye
[00:20.50]And I don't know what it all means
[00:26.50]But since I survived, I realized
[00:30.00]Wherever you go, that's where I'll follow
[00:35.50]Nobody's promised tomorrow
[00:40.00]So I'ma love you every night like it's the last night
[00:46.50]Like it's the last night
[00:51.00]If the world was ending, I'd wanna be next to you
[01:01.00]If the party was over and our time on Earth was through
[01:11.00]I'd wanna hold you just for a while
[01:16.00]And die with a smile
[01:21.50]If the world was ending, I'd wanna be next to you`,

    // 5. INDIE & ROCK HITS
    'arctic monkeys - 505': `[00:00.00]♪ Arctic Monkeys - 505 ♪
[00:20.00]I'm going back to 505
[00:26.50]If it's a seven hour flight or a forty-five minute drive
[00:36.00]In my imagination, you're waitin' lyin' on your side
[00:44.50]With your hands between your thighs and a smile
[00:54.00]Stop and wait a sec
[01:00.50]When you look at me like that, my darling, what did you expect?
[01:09.50]I'd probably still adore you with your hands around my neck
[01:17.50]Or I did last time I checked
[02:30.00]But I crumble completely when you cry
[02:36.50]It seems like once again you've had to greet me with goodbye
[02:44.50]I'm always just about to go and spoil the surprise
[02:51.50]Take my hands off of your eyes too soon
[02:58.00]I'm going back to 505`,

    'the 1975 - about you': `[00:00.00]♪ The 1975 - About You ♪
[00:30.00]I know a place
[00:35.00]It's somewhere I go when I need to remember your face
[00:44.00]We get in a car
[00:49.00]Someone is driving, but the devil is making the pace
[00:58.00]Do you think I have forgotten?
[01:05.00]Do you think I have forgotten?
[01:12.00]Do you think I have forgotten
[01:16.50]About you?
[01:26.50]You and I were alive
[01:31.00]With nothing to do, I could lay and look in your eyes
[01:40.00]Hold on to my hand
[01:45.00]We're getting away, and we're following love's little plan`,

    'the neighbourhood - sweater weather': `[00:00.00]♪ The Neighbourhood - Sweater Weather ♪
[00:10.00]All I am is a man
[00:12.50]I want the world in my hands
[00:15.00]I hate the beach, but I stand
[00:17.50]In California with my toes in the sand
[00:20.50]Use the sleeves of my sweater
[00:23.00]Let's have an adventure
[00:25.50]Head in the clouds, but my gravity's centered
[00:28.00]Touch my neck and I'll touch yours
[00:30.50]You in those little high waisted shorts, oh
[00:54.00]'Cause it's too cold for you here
[00:59.00]And now, so let me hold
[01:04.00]Both your hands in the holes of my sweater`,

    'tv girl - lovers rock': `[00:00.00]♪ TV Girl - Lovers Rock ♪
[00:10.00]Are you not in love with me?
[00:15.00]I thought that you were in love with me
[00:20.00]Because you don't even look at me
[00:25.00]Because you don't even talk to me
[00:50.00]And if you're too shy to say
[00:55.00]Very well then, I will say it for you
[01:10.00]'Cause it's love, and it's life
[01:15.00]And it's everything you want`,

    'boa - duvet': `[00:00.00]♪ bôa - Duvet ♪
[00:15.00]And you don't seem to understand
[00:22.00]A shame you seemed an honest man
[00:29.50]And all the fears you hold so dear
[00:36.50]Will turn to whisper in your ear
[00:44.00]And you know what they say might hurt you
[00:51.00]And you know that it means so much
[00:58.50]And you don't even feel a thing
[01:05.00]I am falling, I am fading
[01:13.00]I have lost it all`,

    'duvet': `[00:00.00]♪ bôa - Duvet ♪
[00:15.00]And you don't seem to understand
[00:22.00]A shame you seemed an honest man
[00:29.50]And all the fears you hold so dear
[00:36.50]Will turn to whisper in your ear
[00:44.00]And you know what they say might hurt you
[00:51.00]And you know that it means so much
[00:58.50]And you don't even feel a thing
[01:05.00]I am falling, I am fading
[01:13.00]I have lost it all`,

    'neck deep - december': `[00:00.00]♪ Neck Deep - December ♪
[00:13.50]Stumbled in through the doors, past the old kitchen floor
[00:19.50]Where we once used to dance, where we laughed, but no more
[00:25.50]And I sat in the dark, watching lights from the cars
[00:31.50]Thinking how you could break such an innocent heart
[00:37.50]Cast me aside, to show your new boyfriend around
[00:43.50]And tell him you love him, while I'm six feet underground
[00:49.50]I hope you get your ballroom floor
[00:55.50]Your perfect house with rose red doors
[01:01.50]I'm the last thing you'd remember
[01:07.50]It's been a long lonely December`,

    'neck deep - wish you were here': `[00:00.00]♪ Neck Deep - Wish You Were Here ♪
[00:12.00]Take it slow, tell me all how you've grown
[00:18.00]Just for the words, and the look on your face
[00:24.00]A million miles from home, but you're never alone
[00:30.00]I've been thinking about you every day
[00:36.00]I wish you were here
[00:42.00]I wish you were here
[00:48.00]To see this sunset and hear this sound
[00:54.00]I wish you were here when I turn around`,

    // 6. POP & VIRAL GLOBAL HITS
    'harry styles - as it was': `[00:00.00]♪ Harry Styles - As It Was ♪
[00:05.50]Come on, Harry, we wanna say goodnight to you
[00:09.50]Holdin' me back
[00:11.50]Gravity's holdin' me back
[00:14.00]I want you to hold out the palm of your hand
[00:16.50]Why don't we leave it at that?
[00:29.00]In this world, it's just us
[00:33.50]You know it's not the same as it was
[00:38.50]In this world, it's just us
[00:43.00]You know it's not the same as it was
[00:48.00]As it was, as it was`,

    'ed sheeran - shape of you': `[00:00.00]♪ Ed Sheeran - Shape of You ♪
[00:08.50]The club isn't the best place to find a lover
[00:11.00]So the bar is where I go
[00:13.00]Me and my friends at the table doing shots
[00:15.50]Drinking fast and then we talk slow
[00:18.00]Come over and start up a conversation with just me
[00:20.50]And trust me I'll give it a chance now
[00:27.50]I'm in love with the shape of you
[00:30.00]We push and pull like a magnet do
[00:32.50]Although my heart is falling too
[00:34.50]I'm in love with your body
[00:37.00]And last night you were in my room
[00:39.00]And now my bedsheets smell like you`,

    'shawn mendes - treat you better': `[00:00.00]♪ Shawn Mendes - Treat You Better ♪
[00:07.50]I won't lie to you
[00:10.50]I know he's just not right for you
[00:14.50]And you can tell me if I'm off
[00:18.50]But I see it on your face
[00:20.50]When you say that he's the one that you want
[00:32.00]I know I can treat you better than he can
[00:37.50]And any girl like you deserves a gentleman
[00:43.50]Tell me why are we wasting time
[00:46.50]On all your wasted crying
[00:49.00]When you should be with me instead
[00:52.50]I know I can treat you better
[00:56.50]Better than he can`,

    'shawn mendes - stitches': `[00:00.00]♪ Shawn Mendes - Stitches ♪
[00:08.00]I thought that I've been hurt before
[00:11.50]But no one's ever left me quite this sore
[00:15.50]Your words cut deeper than a knife
[00:19.50]Now I need someone to breathe me back to life
[00:23.50]Got a feeling that I'm going under
[00:27.00]But I know that I'll make it out alive
[00:31.00]If I quit calling you my lover
[00:34.50]Move on
[00:38.00]You watch me bleed until I can't breathe
[00:42.00]I'm shaking, falling onto my knees
[00:46.00]And now that I'm without your kisses
[00:49.50]I'll be needing stitches`,

    'shawn mendes - there s nothing holdin me back': `[00:00.00]♪ Shawn Mendes - There's Nothing Holdin' Me Back ♪
[00:08.00]I wanna follow where she goes
[00:10.50]I think about her and she knows it
[00:13.00]I wanna let her take control
[00:15.50]'Cause every time that she gets close, yeah
[00:18.50]She pulls me in enough to keep me guessing
[00:23.00]And maybe I should stop and start confessing
[00:27.50]Oh, I've been shaking
[00:30.00]I love it when you go crazy
[00:32.50]You take all my inhibitions
[00:34.50]Baby, there's nothing holdin' me back`,

    'shawn mendes - imagination': `[00:00.00]♪ Shawn Mendes - Imagination ♪
[00:10.00]Oh, there she goes again
[00:13.50]Every morning it's the same
[00:17.00]You walk on by my house
[00:20.50]I wanna call out your name
[00:24.00]In my imagination, you're waiting for me
[00:30.00]In my imagination, our love is set free`,

    'in my blood': `[00:00.00]♪ Shawn Mendes - In My Blood ♪
[00:10.00]Help me, it's like the walls are caving in
[00:14.50]Sometimes I feel like giving up
[00:17.50]No medicine is strong enough
[00:20.50]Someone help me
[00:24.00]I'm crawling in my skin
[00:28.00]Sometimes I feel like giving up
[00:31.00]But I just can't
[00:34.00]It isn't in my blood`,

    'steve lacy - dark red': `[00:00.00]♪ Steve Lacy - Dark Red ♪
[00:08.00]Something bad is 'bout to happen to me
[00:12.50]I don't know what, but I feel it coming
[00:16.50]Might be so sad, might leave my nose running
[00:21.00]I just hope she don't wanna leave me
[00:25.50]Don't you give me up, please don't give up
[00:29.50]On me, I belong with you, and only you, baby
[00:34.00]Only you, my girl, only you, babe`,

    'cafuné - tek it': `[00:00.00]♪ Cafuné - Tek It ♪
[00:11.00]Watch the time go by
[00:15.50]You can't even look me in the eye
[00:20.00]I watch the moon
[00:22.50]Let it run my mood
[00:25.00]Can't stop thinking of you`,

    'tek it': `[00:00.00]♪ Cafuné - Tek It ♪
[00:11.00]Watch the time go by
[00:15.50]You can't even look me in the eye
[00:20.00]I watch the moon
[00:22.50]Let it run my mood
[00:25.00]Can't stop thinking of you`,

    'her s - harvey': `[00:00.00]♪ Her's - Harvey ♪
[00:12.00]Harvey, you're the one
[00:17.00]Running in the sun
[00:22.00]Never looking back
[00:27.00]Staying on the track
[00:32.00]Oh Harvey, my sweetest friend
[00:38.00]Together till the very end`,

    'ricky montgomery - line without a hook': `[00:00.00]♪ Ricky Montgomery - Line Without a Hook ♪
[00:10.00]I don't really give a damn about the way you touch me
[00:14.00]When we're alone
[00:18.00]You can hold my hand if no one's home
[00:26.00]Do you like me, do you like me not?
[00:30.00]I heard the classroom gossip that you're kinda hot
[00:34.00]All my love is gone, baby run away
[00:39.00]'Cause I'm a boy with a line without a hook`,

    'rex orange county - best friend': `[00:00.00]♪ Rex Orange County - Best Friend ♪
[00:12.00]I should've stayed at home
[00:15.50]'Cause right now I see all these people that love me
[00:20.00]Why am I feeling alone?
[00:24.00]Can't help yourself at all
[00:27.50]You wanna be my best friend
[00:31.00]You wanna be my lover
[00:34.50]You wanna be everything to me`,

    'rex orange county - television so far so good': `[00:00.00]♪ Rex Orange County - Television / So Far So Good ♪
[00:14.00]What if I'm not who you thought I was?
[00:18.50]What if I'm just a little boy in love?
[00:23.00]Television watching all our moves
[00:27.50]So far so good, nothing left to lose`,

    'the shade': `[00:00.00]♪ Rex Orange County - THE SHADE ♪
[00:08.00]I want that midnight love
[00:11.50]I want that early morning kiss
[00:15.00]I want you to hold me tight
[00:18.50]Under the shade in the afternoon light`,

    'kecoud - shawty tjantik': `[00:00.00]♪ Kecoud - shawty tjantik (feat. Crisbe) ♪
[00:10.00]Shawty tjantik jalan di depan mata
[00:16.00]Bikin hati berdebar tak terkira
[00:22.00]Gaya retro senyum mempesona
[00:28.00]Kamu yang selalu ada di dalam jiwa
[00:35.00]Oh shawty tjantik, janganlah pergi
[00:41.00]Dengarkan lagu cinta ini`,

    'alex crichton - merry christmas, i miss you': `[00:00.00]♪ Alex Crichton - Merry Christmas, i miss you ♪
[00:12.00]Snow is falling outside my window
[00:18.00]Lights are glowing in the cold winter glow
[00:24.00]Merry Christmas darling, I miss you tonight
[00:30.00]Wishing you were here holding me tight`,

    'bleachers - merry christmas': `[00:00.00]♪ Bleachers - Merry Christmas, Please Don't Call ♪
[00:10.00]Walking down the avenue in the winter chill
[00:16.00]Merry Christmas to you, but please don't call
[00:22.00]We had our time, we had our fun
[00:28.00]Now another year has just begun`,

    'boys a liar': `[00:00.00]♪ PinkPantheress & Ice Spice - Boy's a liar Pt. 2 ♪
[00:05.00]Take a look inside your heart, is there any room for me?
[00:10.00]I won't have to hold my breath 'til you get down on one knee
[00:15.00]Because you only want me when I'm looking good
[00:20.00]The boy's a liar, the boy's a liar`,

    'pak vramroro': `[00:00.00]♪ Aestheards - Pak Vramroro Fufufafa ♪
[00:10.00]Ketukan nada retro di tengah kota
[00:16.00]Alunan chiptune penuh canda tawa
[00:22.00]Fufufafa berdendang ria
[00:28.00]Musik 8-bit ceria sepanjang masa`,

    'nurlela': `[00:00.00]♪ Nurlela - Irama Klasik Indonesia ♪
[00:10.00]Nurlela, si hitam manis
[00:16.00]Bila tertawa bikin hati teriris
[00:22.00]Lirik matanya bagai bintang kejora
[00:28.00]Membuat semua orang jatuh cinta
[00:35.00]Nurlela... gadis idaman
[00:41.00]Cantik rupawan, idola zaman`
  };

  function parseLRC(lrcText) {
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

    // If first lyric is after 3.5 seconds, add an Intro marker so lyrics are not shown prematurely
    if (result.length > 0 && result[0].time > 3.5) {
      result.unshift({ time: 0, text: '🎵 [Intro Instrumental]' });
    }

    return result;
  }

  async function fetchOnlineLyrics(title, artist) {
    try {
      let cleanTitle = (title || '').replace(/\.[^/.]+$/, '');
      cleanTitle = cleanTitle.replace(/\[[a-zA-Z0-9_\-]+\]/g, '');
      cleanTitle = cleanTitle.replace(/\(Official[^\)]*\)/gi, '');
      cleanTitle = cleanTitle.replace(/\(feat[^\)]*\)/gi, '');
      cleanTitle = cleanTitle.replace(/_ Lyrics[^\)]*/gi, '');
      cleanTitle = cleanTitle.replace(/– Twin Ver\./gi, '');
      cleanTitle = cleanTitle.replace(/\(Spider-Man[^\)]*\)/gi, '');
      cleanTitle = cleanTitle.trim();

      let cleanArtist = (artist || '').replace(/- Topic/gi, '').trim();
      if (cleanArtist === 'Unknown Artist') cleanArtist = '';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      // 1. Direct GET endpoint
      try {
        let url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}`;
        if (cleanArtist) url += `&artist_name=${encodeURIComponent(cleanArtist)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (data.syncedLyrics && data.syncedLyrics.length > 30) {
            clearTimeout(timeoutId);
            return { synced: true, content: data.syncedLyrics };
          }
        }
      } catch (e) {}

      // 2. Search endpoint fallback (broad match)
      try {
        const searchQuery = cleanArtist ? `${cleanTitle} ${cleanArtist}` : cleanTitle;
        const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`, { signal: controller.signal });
        if (searchRes.ok) {
          const list = await searchRes.json();
          if (Array.isArray(list) && list.length > 0) {
            const syncedItem = list.find(item => item.syncedLyrics && item.syncedLyrics.length > 30);
            if (syncedItem) {
              clearTimeout(timeoutId);
              return { synced: true, content: syncedItem.syncedLyrics };
            }
            if (list[0].plainLyrics) {
              clearTimeout(timeoutId);
              return { synced: false, content: list[0].plainLyrics };
            }
          }
        }
      } catch (e) {}

      clearTimeout(timeoutId);
    } catch (err) {}
    return null;
  }

  // Real-time Lyrics Synchronization & Offset Manager
  let currentLyricOffset = 0.0;

  function loadLyricOffset(trackKey) {
    const saved = localStorage.getItem(`lyric_offset_${trackKey}`);
    currentLyricOffset = saved ? parseFloat(saved) : 0.0;
    updateOffsetDisplay();
  }

  function updateOffsetDisplay() {
    const valEl = document.getElementById('lyric-offset-val');
    if (valEl) {
      valEl.innerText = `${currentLyricOffset >= 0 ? '+' : ''}${currentLyricOffset.toFixed(1)}s`;
      valEl.style.color = currentLyricOffset === 0 ? '#00ffcc' : (currentLyricOffset > 0 ? '#ffeb3b' : '#ff007f');
    }
  }

  function setLyricOffset(delta) {
    currentLyricOffset = Math.round((currentLyricOffset + delta) * 10) / 10;
    updateOffsetDisplay();
    if (currentLyricTrackKey) {
      localStorage.setItem(`lyric_offset_${currentLyricTrackKey}`, currentLyricOffset.toString());
    }
    syncLyricsTime(audio.currentTime);
    playRetroSFX('click');
    showToast(`⏱️ Sinkronisasi Lirik: ${currentLyricOffset >= 0 ? '+' : ''}${currentLyricOffset.toFixed(1)} detik`);
  }

  function renderLyricsUI(lyricsList, sourceBadge = '') {
    const lyricsContent = document.getElementById('lyrics-content');
    if (!lyricsContent) return;

    lyricsContent.innerHTML = '';
    
    if (sourceBadge) {
      const badge = document.createElement('div');
      badge.style.cssText = 'font-size: 10px; color: #00ffcc; text-align: center; margin-bottom: 12px; opacity: 0.85; letter-spacing: 1px; font-weight: bold;';
      badge.innerText = sourceBadge;
      lyricsContent.appendChild(badge);
    }

    lyricsList.forEach((item, idx) => {
      const lineEl = document.createElement('div');
      lineEl.className = 'lyrics-line'; // Do NOT highlight until song reaches time
      lineEl.id = `lyric-line-${idx}`;
      lineEl.innerText = item.text;
      lineEl.title = `Klik untuk lompat ke detik ${Math.round(item.time)}`;
      lineEl.onclick = () => {
        audio.currentTime = Math.max(0, item.time - currentLyricOffset);
        playRetroSFX('click');
      };
      lyricsContent.appendChild(lineEl);
    });

    // Wire offset adjuster buttons
    const btnDelay = document.getElementById('btn-lyric-delay');
    if (btnDelay) btnDelay.onclick = () => setLyricOffset(-0.5);

    const btnAdvance = document.getElementById('btn-lyric-advance');
    if (btnAdvance) btnAdvance.onclick = () => setLyricOffset(0.5);

    const btnReset = document.getElementById('btn-lyric-reset');
    if (btnReset) btnReset.onclick = () => {
      currentLyricOffset = 0.0;
      updateOffsetDisplay();
      if (currentLyricTrackKey) {
        localStorage.removeItem(`lyric_offset_${currentLyricTrackKey}`);
      }
      syncLyricsTime(audio.currentTime);
      playRetroSFX('click');
      showToast('⏱️ Offset Lirik direset ke 0.0s');
    };

    // Immediate sync check with current playback position
    syncLyricsTime(audio.currentTime);
  }

  async function updateLyricsDrawer(forceReload = false) {
    const lyricsDrawer = document.getElementById('lyrics-drawer');
    const lyricsTitle = document.getElementById('lyrics-title');
    const lyricsArtist = document.getElementById('lyrics-artist');
    const lyricsContent = document.getElementById('lyrics-content');
    if (!lyricsContent) return;

    const track = playlist[currentIndex];
    if (!track) {
      lyricsContent.innerHTML = `<div style="color: #666; font-size: 14px; padding: 40px 0; text-align: center;">Pilih lagu untuk melihat lirik</div>`;
      return;
    }

    const trackKey = track.filename || track.title;
    if (lyricsTitle) lyricsTitle.innerText = track.title;
    if (lyricsArtist) lyricsArtist.innerText = `${track.artist} • ${track.album}`;

    loadLyricOffset(trackKey);

    if (!forceReload && currentLyricTrackKey === trackKey && currentLyrics.length > 0) {
      return;
    }

    currentLyricTrackKey = trackKey;
    currentLyrics = [];

    const cleanFn = (track.filename || track.title || '').toLowerCase().replace(/\.[^/.]+$/, '').trim();
    const cleanAlpha = cleanFn.replace(/[^a-z0-9]/g, '');

    // 1. FAST CHECK: Local lyrics/ folder via direct fetch & IPC
    try {
      const directRes = await fetch(`lyrics/${encodeURIComponent(track.filename.replace(/\.[^/.]+$/, ''))}.lrc`);
      if (directRes.ok) {
        const txt = await directRes.text();
        if (txt && txt.length > 30) {
          currentLyrics = parseLRC(txt);
          renderLyricsUI(currentLyrics, '📁 LIRIK LOKAL (lyrics/)');
          return;
        }
      }
    } catch (e) {}

    if (window.api && window.api.readLyric) {
      try {
        const localRes = await window.api.readLyric(track.filename);
        if (localRes && localRes.success && localRes.content && localRes.content.length > 30) {
          currentLyrics = parseLRC(localRes.content);
          if (currentLyrics.length > 0) {
            renderLyricsUI(currentLyrics, '📁 LIRIK LOKAL (lyrics/)');
            return;
          }
        }
      } catch (e) {}
    }

    // 2. CHECK: Memory Built-in Map for Indonesian / Special Indie Tracks
    for (const [key, lrcVal] of Object.entries(BUILTIN_LRC)) {
      const keyAlpha = key.replace(/[^a-z0-9]/g, '');
      if (cleanAlpha.includes(keyAlpha) || keyAlpha.includes(cleanAlpha)) {
        currentLyrics = parseLRC(lrcVal);
        renderLyricsUI(currentLyrics, '📁 LIRIK LOKAL (lyrics/)');
        return;
      }
    }

    // 3. Online Search with loading indicator (max 2.5s)
    lyricsContent.innerHTML = `
      <div style="color: #00ffcc; font-size: 14px; padding: 40px 0; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
        <div>Mencari lirik sinkron di database online...</div>
      </div>
    `;

    const onlineResult = await fetchOnlineLyrics(track.title, track.artist);
    if (onlineResult && onlineResult.content) {
      if (onlineResult.synced) {
        currentLyrics = parseLRC(onlineResult.content);
        if (window.api && window.api.saveLyric) {
          window.api.saveLyric({ filename: track.filename, content: onlineResult.content });
        }
        renderLyricsUI(currentLyrics, '🌐 LIRIK SINKRON ONLINE');
        return;
      } else {
        const plainLines = onlineResult.content.split('\n').filter(l => l.trim().length > 0);
        const duration = audio.duration || 200;
        const step = duration / (plainLines.length + 2);
        currentLyrics = plainLines.map((text, i) => ({
          time: Math.round((i + 1) * step),
          text: text.trim()
        }));
        renderLyricsUI(currentLyrics, '📄 LIRIK TEKS');
        return;
      }
    }

    // 4. Fallback if not found
    lyricsContent.innerHTML = `
      <div style="color: #aaa; font-size: 13px; padding: 30px 15px; text-align: center; line-height: 1.6;">
        <div style="font-size: 32px; margin-bottom: 10px;">🎵</div>
        <div style="color: #fff; font-size: 15px; font-weight: bold; margin-bottom: 4px;">${track.title}</div>
        <div style="color: #888; font-size: 12px; margin-bottom: 15px;">${track.artist}</div>
        <div style="color: #666; font-size: 11px; margin-bottom: 20px;">Lirik otomatis belum ditemukan. Anda dapat menambahkan berkas <b>.lrc</b> ke folder <code>lyrics/</code></div>
        <button id="btn-retry-lyrics" class="retro-btn primary" style="font-size: 11px; padding: 6px 14px; cursor: pointer;">🔄 Cari Ulang Lirik</button>
      </div>
    `;
    const btnRetry = document.getElementById('btn-retry-lyrics');
    if (btnRetry) {
      btnRetry.onclick = () => updateLyricsDrawer(true);
    }
  }

  function syncLyricsTime(currentTime) {
    if (!currentLyrics || currentLyrics.length === 0) return;
    const effectiveTime = currentTime + currentLyricOffset;
    let activeIdx = -1;
    for (let i = 0; i < currentLyrics.length; i++) {
      if (effectiveTime >= currentLyrics[i].time) {
        activeIdx = i;
      }
    }
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
          playNextTrack();
          showToast('Lagu Selanjutnya ⏭️');
          break;
        case 'KeyP':
          playPrevTrack();
          showToast('Lagu Sebelumnya ⏮️');
          break;
        case 'KeyS':
          setShuffleState(!isShuffled, true);
          break;
        case 'KeyR':
          setRepeatState(!isRepeat, true);
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

      // 1. Draw LCD Turntable Spectrum Analyzer (Subtle Retro Background Spectrum)
      if (canvas && ctx) {
        if (canvas.width !== canvas.offsetWidth) canvas.width = canvas.offsetWidth;
        if (canvas.height !== canvas.offsetHeight) canvas.height = canvas.offsetHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const numBars = 16;
        const barWidth = Math.floor((canvas.width - 4) / numBars) - 2;
        let x = 2;
        
        for (let i = 0; i < numBars; i++) {
          const dataIndex = i * 2 + 2; 
          const barHeightRatio = (dataArray[dataIndex] || 0) / 255;
          const barHeight = Math.max(3, barHeightRatio * (canvas.height * 0.7));
          
          ctx.fillStyle = `rgba(57, 255, 20, ${0.15 + barHeightRatio * 0.35})`;
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

  // 8-bit Pixel Heart Cover Generator (for Liked Songs)
  function generatePixelHeartCover() {
    const cellSize = 16;
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" shape-rendering="crispEdges">';
    svg += '<rect width="256" height="256" fill="#1d0d29" />';
    svg += '<rect x="16" y="16" width="224" height="224" fill="none" stroke="#481a66" stroke-width="4" />';
    
    const heartPixels = [
      "0000000000000000",
      "0000000000000000",
      "0001110000111000",
      "0012221001222100",
      "0123322112222210",
      "0123322222222210",
      "0122222222222210",
      "0012222222222100",
      "0001222222221000",
      "0000122222210000",
      "0000012222100000",
      "0000001221000000",
      "0000000110000000",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000"
    ];
    const colorMap = {
      '1': '#ff007f', // border outline
      '2': '#ff2a8d', // main heart pink
      '3': '#ffffff', // pixel shine highlight
    };
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const char = heartPixels[r][c];
        if (colorMap[char]) {
          svg += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${colorMap[char]}" />`;
        }
      }
    }
    svg += '</svg>';
    return 'data:image/svg+xml;base64,' + window.btoa(svg);
  }

  // 8-bit Pixel Cassette / Vinyl Cover Generator (for Custom Playlists)
  function generatePixelPlaylistCover(name, id) {
    const cellSize = 16;
    let hash = 0;
    const str = (id || '') + (name || 'Playlist');
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash);
    
    const plPalettes = [
      { bg: '#0b1d28', border: '#043444', primary: '#00ffcc', sec: '#008877', hi: '#ffffff' }, // Teal
      { bg: '#291814', border: '#4d261b', primary: '#ffaa00', sec: '#aa5500', hi: '#ffee88' }, // Gold
      { bg: '#181425', border: '#332650', primary: '#a855f7', sec: '#6b21a8', hi: '#f3e8ff' }, // Purple
      { bg: '#0f281e', border: '#174834', primary: '#10b981', sec: '#047857', hi: '#a7f3d0' }, // Green
      { bg: '#2a1215', border: '#4d1e24', primary: '#ef4444', sec: '#b91c1c', hi: '#fca5a5' }, // Red
      { bg: '#172554', border: '#1e3a8a', primary: '#3b82f6', sec: '#1d4ed8', hi: '#93c5fd' }, // Blue
    ];
    const pal = plPalettes[idx % plPalettes.length];

    let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" shape-rendering="crispEdges">';
    svg += `<rect width="256" height="256" fill="${pal.bg}" />`;
    svg += `<rect x="16" y="16" width="224" height="224" fill="none" stroke="${pal.border}" stroke-width="4" />`;
    
    // 16x16 Pixel Art Cassette Tape
    const cassettePixels = [
      "0000000000000000",
      "0000000000000000",
      "0111111111111110",
      "0122222222222210",
      "0123333333333210",
      "0123443333443210",
      "0123404334043210",
      "0123443333443210",
      "0123333333333210",
      "0122222222222210",
      "0125555555555210",
      "0125555555555210",
      "0111111111111110",
      "0000000000000000",
      "0000000000000000",
      "0000000000000000"
    ];
    const colorMap = {
      '1': pal.sec,
      '2': pal.primary,
      '3': pal.hi,
      '4': pal.sec,
      '5': '#060d13'
    };
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const char = cassettePixels[r][c];
        if (colorMap[char]) {
          svg += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${colorMap[char]}" />`;
        }
      }
    }
    svg += '</svg>';
    return 'data:image/svg+xml;base64,' + window.btoa(svg);
  }

  // Pixel Art Artist Avatar Generator
  function generateArtistPixelAvatar(artistName) {
    const cellSize = 16;
    let hash = 0;
    for (let i = 0; i < (artistName || 'Artist').length; i++) {
      hash = artistName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash);
    const hues = ['#00ffcc', '#ff007f', '#ffaa00', '#a855f7', '#3b82f6', '#10b981', '#f43f5e', '#eab308'];
    const bgHues = ['#0c1e28', '#250d1a', '#261705', '#190e2b', '#0b192e', '#071f15', '#24080e', '#211804'];
    const mainColor = hues[idx % hues.length];
    const bgColor = bgHues[idx % bgHues.length];

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" shape-rendering="crispEdges">`;
    svg += `<rect width="128" height="128" fill="${bgColor}" />`;
    
    // Symmetrical 8x8 avatar pattern
    const pattern = [
      "00111100",
      "01222210",
      "12322321",
      "12222221",
      "12333321",
      "01222210",
      "00111100",
      "00011000"
    ];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const ch = pattern[r][c];
        if (ch === '1') {
          svg += `<rect x="${32 + c * 8}" y="${32 + r * 8}" width="8" height="8" fill="${mainColor}" opacity="0.6" />`;
        } else if (ch === '2') {
          svg += `<rect x="${32 + c * 8}" y="${32 + r * 8}" width="8" height="8" fill="${mainColor}" />`;
        } else if (ch === '3') {
          svg += `<rect x="${32 + c * 8}" y="${32 + r * 8}" width="8" height="8" fill="#ffffff" />`;
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
        masterPlaylist = result.files.map((f, idx) => {
          const albumName = (f.album && f.album !== "Unknown Album") ? f.album : f.title;
          const fallbackSeed = f.title + "_" + f.artist + "_" + idx;
          const cover = generateProceduralCover(fallbackSeed);
          
          return {
            filename: f.filename,
            path: window.api.getMusicPath(f.filename),
            title: f.title || f.filename.replace(/\.[^/.]+$/, ""),
            artist: f.artist || "Unknown Artist",
            genre: f.genre || "Pop",
            album: albumName,
            coverBase64: cover,
            vinylColor: vinylColors[idx % vinylColors.length]
          };
        });

        playlist = [...masterPlaylist];

        // Auto-organize all library tracks into smart curated albums if needed
        autoGenerateSmartAlbums(false);

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

        // Comprehensive YouTube Music Home Recommendations
        function renderHomeSections() {
          // 1. Quick Picks (4-Row Grid Slider like YouTube Music)
          const quickPicksContainer = document.getElementById('home-quick-picks');
          const quickPicksList = masterPlaylist.slice(0, 24);
          if (quickPicksContainer) {
            let qpHtml = '';
            quickPicksList.forEach((track, idx) => {
              const cover = track.coverBase64 ? `url('${track.coverBase64}')` : '#222';
              const isFav = isFavorite(track.filename);
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

            // Bind click on items
            quickPicksContainer.querySelectorAll('.quick-pick-item').forEach(el => {
              el.onclick = (e) => {
                if (e.target.closest('.qp-like') || e.target.closest('.qp-more')) return;
                const filename = el.getAttribute('data-filename');
                const trackIdx = masterPlaylist.findIndex(t => t.filename === filename);
                playlist = [...masterPlaylist];
                currentActiveAlbum = 'all';
                renderPlayerAlbumList();
                renderPlaylist();
                
                previousView = 'home';
                if (homeView) homeView.classList.add('hidden');
                if (playerView) playerView.classList.remove('hidden');
                if (navHome) navHome.classList.remove('active');
                if (bpTogglePlayer) bpTogglePlayer.innerHTML = ICONS.down;
                
                loadTrack(trackIdx >= 0 ? trackIdx : 0);
                playTrack();
              };

              const likeBtn = el.querySelector('.qp-like');
              if (likeBtn) {
                likeBtn.onclick = (e) => {
                  e.stopPropagation();
                  const filename = el.getAttribute('data-filename');
                  const track = masterPlaylist.find(t => t.filename === filename);
                  if (track) {
                    toggleFavorite(track);
                    likeBtn.classList.toggle('icon-active', isFavorite(track.filename));
                  }
                };
              }

              const moreBtn = el.querySelector('.qp-more');
              if (moreBtn) {
                moreBtn.onclick = (e) => {
                  e.stopPropagation();
                  const filename = el.getAttribute('data-filename');
                  const track = masterPlaylist.find(t => t.filename === filename);
                  if (track) showAddToPlaylistModal(track);
                };
              }
            });
          }

          // Button Quick Picks Play All
          const btnQpPlayAll = document.getElementById('btn-quick-picks-play-all');
          if (btnQpPlayAll) {
            btnQpPlayAll.onclick = () => {
              if (quickPicksList.length === 0) return;
              playlist = [...quickPicksList];
              currentActiveAlbum = 'all';
              renderPlayerAlbumList();
              renderPlaylist();
              
              previousView = 'home';
              if (homeView) homeView.classList.add('hidden');
              if (playerView) playerView.classList.remove('hidden');
              if (navHome) navHome.classList.remove('active');
              if (bpTogglePlayer) bpTogglePlayer.innerHTML = ICONS.down;
              
              loadTrack(0);
              playTrack();
            };
          }

          // 2. Featured Mixes (Playlist Unggulan untuk Anda)
          const featuredContainer = document.getElementById('home-featured-mixes');
          if (featuredContainer) {
            const mixes = [
              {
                id: 'mix_pop',
                name: 'Mix Pop & Hits Pilihan',
                desc: 'The Weeknd, Billie Eilish, Harry Styles, Sabrina Carpenter',
                filter: t => /weeknd|billie|harry|shawn|sheer|die with|gaga|cupid|starboy|blinding|as it was|symphony/i.test(t.title + ' ' + t.artist)
              },
              {
                id: 'mix_indie',
                name: 'Mix Indie & Alternatif',
                desc: 'Arctic Monkeys, Reality Club, The 1975, TV Girl, bôa',
                filter: t => /arctic|reality|1975|neighbourhood|tv girl|bôa|harvey|her s|dark red|freaks|lovers rock|sweater/i.test(t.title + ' ' + t.artist)
              },
              {
                id: 'mix_rock',
                name: 'Mix Rock & Pop-Punk',
                desc: 'Neck Deep, Crayon Case, Bleachers, Cash Cash',
                filter: t => /neck deep|crayon|bleachers|cash cash|december|wish you|surabaya|gravits|because/i.test(t.title + ' ' + t.artist)
              },
              {
                id: 'mix_chill',
                name: 'Mix Santai & Nostalgia Senja',
                desc: 'Rex Orange County, Ricky Montgomery, Steve Lacy, Kecoud',
                filter: t => /rex orange|ricky|steve lacy|kecoud|alex crichton|best friend|television|shawty|tears|thought/i.test(t.title + ' ' + t.artist)
              },
              {
                id: 'mix_chiptune',
                name: 'Mix Retro 8-Bit & Arcade',
                desc: 'Aestheards, Pak Vramroro, Synthwave, 8-Bit Beats',
                filter: t => /aestheards|vramroro|fufufafa|anti|hero|stuck|space|cloud|sunflower|shade|paradise/i.test(t.title + ' ' + t.artist)
              }
            ];

            let mixesHtml = '';
            mixes.forEach((mix, mIdx) => {
              let matchingTracks = masterPlaylist.filter(mix.filter);
              if (matchingTracks.length < 2) {
                matchingTracks = masterPlaylist.slice(mIdx * 5, (mIdx + 1) * 5);
              }
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

            // Bind click on mix cards
            featuredContainer.querySelectorAll('.mix-card').forEach((el, mIdx) => {
              el.onclick = () => {
                const mix = mixes[mIdx];
                let matchingTracks = masterPlaylist.filter(mix.filter);
                if (matchingTracks.length < 2) matchingTracks = masterPlaylist.slice(mIdx * 5, (mIdx + 1) * 5);
                
                playlist = matchingTracks.length > 0 ? [...matchingTracks] : [...masterPlaylist];
                currentActiveAlbum = 'all';
                renderPlayerAlbumList();
                renderPlaylist();
                
                previousView = 'home';
                if (homeView) homeView.classList.add('hidden');
                if (playerView) playerView.classList.remove('hidden');
                if (navHome) navHome.classList.remove('active');
                if (bpTogglePlayer) bpTogglePlayer.innerHTML = ICONS.down;
                
                loadTrack(0);
                playTrack();
                showToast(`Memutar: ${mix.name}`);
              };
            });
          }

          // 3. Artis di Koleksi Anda
          const artistsContainer = document.getElementById('home-artists');
          if (artistsContainer) {
            const artistCounts = {};
            masterPlaylist.forEach(t => {
              const art = t.artist && t.artist !== "Unknown Artist" ? t.artist : "Unknown";
              artistCounts[art] = (artistCounts[art] || 0) + 1;
            });
            const topArtists = Object.keys(artistCounts)
              .sort((a, b) => artistCounts[b] - artistCounts[a]);

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
                const artistTracks = masterPlaylist.filter(t => t.artist === artistName);
                if (artistTracks.length > 0) {
                  playlist = [...artistTracks];
                  currentActiveAlbum = 'all';
                  renderPlayerAlbumList();
                  renderPlaylist();
                  
                  previousView = 'home';
                  if (homeView) homeView.classList.add('hidden');
                  if (playerView) playerView.classList.remove('hidden');
                  if (navHome) navHome.classList.remove('active');
                  if (bpTogglePlayer) bpTogglePlayer.innerHTML = ICONS.down;
                  
                  loadTrack(0);
                  playTrack();
                  showToast(`Memutar lagu dari: ${artistName}`);
                }
              };
            });
          }

          // 4. Dengarkan Lagi (Semua Lagu / Album Cards)
          if (homeAlbums) {
            homeAlbums.innerHTML = '';
            masterPlaylist.forEach((track, trackIdx) => {
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
                const trackIdx = masterPlaylist.findIndex(t => t.filename === filename);
                playlist = [...masterPlaylist];
                currentActiveAlbum = 'all';
                renderPlayerAlbumList();
                renderPlaylist();
                
                previousView = 'home';
                if (homeView) homeView.classList.add('hidden');
                if (playerView) playerView.classList.remove('hidden');
                if (navHome) navHome.classList.remove('active');
                if (bpTogglePlayer) bpTogglePlayer.innerHTML = ICONS.down;
                
                loadTrack(trackIdx >= 0 ? trackIdx : 0);
                playTrack();
              };
            });
          }

          // 5. Generic Carousel Navigation Buttons (< and >)
          document.querySelectorAll('.carousel-nav-btn').forEach(btn => {
            btn.onclick = () => {
              const targetId = btn.getAttribute('data-target');
              const dir = parseInt(btn.getAttribute('data-dir') || '1', 10);
              const targetEl = document.getElementById(targetId);
              if (targetEl) {
                targetEl.scrollBy({ left: dir * 420, behavior: 'smooth' });
              }
            };
          });
        }

        renderHomeSections();

          // Function to Render Library Grid (including Liked Songs & Custom Playlists)
          function renderLibraryGrid() {
            const libraryAlbumsGrid = document.getElementById('library-albums-grid');
            if (!libraryAlbumsGrid) return;

            const likedTracksCount = masterPlaylist.filter(t => isFavorite(t.filename)).length;
            const customPlaylists = getCustomPlaylists();

            let gridHtml = `
              <div class="library-album-card liked-songs-card" data-album="__LIKED_SONGS__">
                <div class="library-album-art" style="background-image: url('${generatePixelHeartCover()}'); background-size: cover; background-position: center; border-radius: 8px;"></div>
                <div class="library-album-title" style="color: #ff77c6;">Lagu Disukai</div>
                <div class="library-album-artist">${likedTracksCount} lagu favorit</div>
              </div>
            `;

            // Custom Playlists
            customPlaylists.forEach(pl => {
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
                  detailArt.innerHTML = '';
                  detailArt.style.background = 'none';
                  detailArt.style.backgroundImage = `url('${generatePixelHeartCover()}')`;
                  detailArt.style.backgroundSize = 'cover';
                  detailArt.style.backgroundPosition = 'center';
                } else if (isCustomPl) {
                  detailArt.innerHTML = '';
                  detailArt.style.background = 'none';
                  detailArt.style.backgroundImage = `url('${generatePixelPlaylistCover(albumTitle, activeCustomPlId)}')`;
                  detailArt.style.backgroundSize = 'cover';
                  detailArt.style.backgroundPosition = 'center';
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

                // Bind Shuffle Play button
                const btnAlbumShuffle = document.getElementById('btn-album-shuffle');
                if (btnAlbumShuffle) {
                  btnAlbumShuffle.onclick = () => {
                    if (tracks.length === 0) {
                      showToast('Tidak ada lagu untuk diputar!');
                      return;
                    }
                    currentActiveAlbum = selectedAlbum;
                    renderPlayerAlbumList();
                    playlist = [...tracks];
                    renderPlaylist();
                    
                    setShuffleState(true, false);
                    const startIdx = Math.floor(Math.random() * playlist.length);
                    
                    previousView = 'library';
                    if (libraryView) libraryView.classList.add('hidden');
                    if (playerView) playerView.classList.remove('hidden');
                    if (bpTogglePlayer) bpTogglePlayer.innerHTML = ICONS.down;
                    
                    loadTrack(startIdx);
                    playTrack();
                    playRetroSFX('powerup');
                    showToast(`🔀 Memutar acak album "${albumTitle}"!`);
                  };
                }

                // Bind Export Playlist (.m3u) button
                const btnAlbumDownload = document.getElementById('btn-album-download');
                if (btnAlbumDownload) {
                  btnAlbumDownload.onclick = () => {
                    if (tracks.length === 0) {
                      showToast('Tidak ada lagu untuk diekspor!');
                      return;
                    }
                    let m3uContent = '#EXTM3U\n';
                    tracks.forEach(t => {
                      m3uContent += `#EXTINF:-1,${t.artist} - ${t.title}\n${t.filename}\n`;
                    });
                    const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `${albumTitle.replace(/[/\\?%*:|"<>]/g, '_')}.m3u`;
                    a.click();
                    playRetroSFX('like');
                    showToast(`💾 Playlist "${albumTitle}.m3u" berhasil diekspor!`);
                  };
                }

                // Bind Share & Copy Tracklist button
                const btnAlbumShare = document.getElementById('btn-album-share');
                if (btnAlbumShare) {
                  btnAlbumShare.onclick = () => {
                    if (tracks.length === 0) {
                      showToast('Playlist masih kosong!');
                      return;
                    }
                    let text = `🎵 Playlist: ${albumTitle}\n`;
                    text += `Total: ${tracks.length} lagu\n\n`;
                    tracks.forEach((t, i) => {
                      text += `${i + 1}. ${t.title} - ${t.artist}\n`;
                    });
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(text);
                      playRetroSFX('like');
                      showToast('📋 Daftar lagu disalin ke clipboard!');
                    } else {
                      showToast('📋 Info playlist siap dibagikan!');
                    }
                  };
                }

                // Bind album title click to rename
                const titleEl = document.getElementById('library-detail-title');
                if (titleEl) {
                  titleEl.style.cursor = isCustomPl ? 'pointer' : 'default';
                  titleEl.title = isCustomPl ? 'Klik untuk mengubah nama album/playlist' : '';
                  titleEl.onclick = () => {
                    if (isCustomPl && activeCustomPlId) {
                      showRenamePlaylistModal(activeCustomPlId, albumTitle, (newName) => {
                        albumTitle = newName;
                        titleEl.innerText = newName;
                        renderLibraryGrid();
                        renderPlayerAlbumList();
                      });
                    }
                  };
                }

                // Bind album edit button
                const btnAlbumEdit = document.getElementById('btn-album-edit');
                if (btnAlbumEdit) {
                  btnAlbumEdit.style.display = isCustomPl ? 'inline-flex' : 'none';
                  btnAlbumEdit.title = 'Ubah Nama Album / Playlist';
                  btnAlbumEdit.onclick = () => {
                    if (isCustomPl && activeCustomPlId) {
                      showRenamePlaylistModal(activeCustomPlId, albumTitle, (newName) => {
                        albumTitle = newName;
                        if (titleEl) titleEl.innerText = newName;
                        renderLibraryGrid();
                        renderPlayerAlbumList();
                      });
                    }
                  };
                }

                // Bind album detail options (e.g. rename, manage, or delete custom playlist)
                const btnAlbumMore = document.getElementById('btn-album-more');
                if (btnAlbumMore) {
                  btnAlbumMore.onclick = () => {
                    if (isCustomPl && activeCustomPlId) {
                      showPlaylistOptionsMenu(activeCustomPlId, albumTitle, {
                        onRename: () => {
                          showRenamePlaylistModal(activeCustomPlId, albumTitle, (newName) => {
                            albumTitle = newName;
                            if (titleEl) titleEl.innerText = newName;
                            renderLibraryGrid();
                            renderPlayerAlbumList();
                          });
                        },
                        onManageSongs: () => {
                          showSelectTracksModal(activeCustomPlId, albumTitle, () => el.click());
                        },
                        onDelete: () => {
                          showRetroConfirmModal(
                            'HAPUS PLAYLIST',
                            `Apakah kamu yakin ingin menghapus playlist <b>"${albumTitle}"</b> secara permanen?`,
                            '🗑️ HAPUS SEKARANG',
                            () => {
                              deleteCustomPlaylist(activeCustomPlId);
                              libraryAlbumDetail.classList.add('hidden');
                              libraryAlbumsContainer.classList.remove('hidden');
                              renderLibraryGrid();
                              renderPlayerAlbumList();
                            }
                          );
                        }
                      });
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

          // Bind Auto-Create Smart Albums Button
          const btnAutoCreateAlbums = document.getElementById('btn-auto-create-albums');
          if (btnAutoCreateAlbums) {
            btnAutoCreateAlbums.onclick = () => {
              const count = autoGenerateSmartAlbums(true);
              renderLibraryGrid();
              renderPlayerAlbumList();
              showToast(`✨ ${count > 0 ? count + ' album baru berhasil disusun dari seluruh lagu!' : 'Album sudah lengkap terorganisir!'}`);
            };
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
             exploreNewReleases.innerHTML = '';
             exploreTrending.innerHTML = '';
             const shuffledNew = [...masterPlaylist];
             const shuffledTrend = [...masterPlaylist].sort(() => Math.random() - 0.5);
             
             shuffledNew.slice(0, 20).forEach(track => {
                const cover = track.coverBase64 ? `url('${track.coverBase64}')` : 'none';
                exploreNewReleases.innerHTML += `
                  <div class="album-card track-card" data-filename="${track.filename}">
                    <div class="album-card-art" style="background: ${cover}; background-size: cover; background-position: center;"></div>
                    <div class="album-card-title">${track.title}</div>
                    <div class="album-card-artist">${track.artist}</div>
                  </div>
                `;
             });
             
             shuffledTrend.slice(0, 20).forEach(track => {
                const cover = track.coverBase64 ? `url('${track.coverBase64}')` : 'none';
                exploreTrending.innerHTML += `
                  <div class="album-card track-card" data-filename="${track.filename}">
                    <div class="album-card-art" style="background: ${cover}; background-size: cover; background-position: center;"></div>
                    <div class="album-card-title">${track.title}</div>
                    <div class="album-card-artist">${track.artist}</div>
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
                const filename = el.getAttribute('data-filename');
                const selectedAlbum = el.getAttribute('data-album');
                
                if (filename) {
                  const trackIdx = masterPlaylist.findIndex(t => t.filename === filename);
                  playlist = [...masterPlaylist];
                  currentActiveAlbum = 'all';
                  renderPlayerAlbumList();
                  renderPlaylist();
                  
                  // Switch to Player View
                  previousView = document.getElementById('explore-view') && !document.getElementById('explore-view').classList.contains('hidden') ? 'explore' : 'home';
                  if (homeView) homeView.classList.add('hidden');
                  const exploreView = document.getElementById('explore-view');
                  if (exploreView) exploreView.classList.add('hidden');
                  
                  if (playerView) playerView.classList.remove('hidden');
                  if (navHome) navHome.classList.remove('active');
                  if (navExplore) navExplore.classList.remove('active');
                  if (bpTogglePlayer) bpTogglePlayer.innerHTML = ICONS.down;
                  
                  loadTrack(trackIdx >= 0 ? trackIdx : 0);
                  playTrack();
                } else if (selectedAlbum) {
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

  // Unified Synchronized Playback Control Functions
  function setShuffleState(active, notify = true) {
    isShuffled = !!active;

    // 1. Turntable player button & icon
    const btnShuffle = document.getElementById('btn-shuffle');
    const iconShuffle = document.getElementById('icon-shuffle');
    if (btnShuffle) {
      btnShuffle.classList.toggle('active', isShuffled);
      btnShuffle.title = isShuffled ? 'Putar Acak: AKTIF' : 'Putar Acak: NONAKTIF';
    }
    if (iconShuffle) {
      iconShuffle.style.opacity = isShuffled ? '1' : '0.4';
    }

    // 2. Bottom player shuffle button
    const bpShuffle = document.getElementById('bp-shuffle');
    if (bpShuffle) {
      bpShuffle.classList.toggle('active', isShuffled);
      bpShuffle.classList.toggle('icon-active', isShuffled);
      bpShuffle.title = isShuffled ? 'Putar Acak: AKTIF' : 'Putar Acak: NONAKTIF';
    }

    // 3. Album detail shuffle button
    const btnAlbumShuffle = document.getElementById('btn-album-shuffle');
    if (btnAlbumShuffle) {
      btnAlbumShuffle.classList.toggle('active', isShuffled);
      btnAlbumShuffle.title = isShuffled ? 'Putar Acak: AKTIF' : 'Putar Acak: NONAKTIF';
    }

    if (notify) {
      showToast(isShuffled ? '🔀 Putar Acak (Shuffle): AKTIF' : '▶️ Putar Berurutan: AKTIF');
      playRetroSFX(isShuffled ? 'powerup' : 'click');
    }
  }

  function setRepeatState(active, notify = true) {
    isRepeat = !!active;

    // 1. Turntable player repeat button & icon
    const btnRepeat = document.getElementById('btn-repeat');
    const iconRepeat = document.getElementById('icon-repeat');
    if (btnRepeat) {
      btnRepeat.classList.toggle('active', isRepeat);
      btnRepeat.title = isRepeat ? 'Ulangi Lagu: AKTIF' : 'Ulangi Lagu: NONAKTIF';
    }
    if (iconRepeat) {
      iconRepeat.style.opacity = isRepeat ? '1' : '0.4';
    }

    // 2. Bottom player repeat button
    const bpRepeat = document.getElementById('bp-repeat');
    if (bpRepeat) {
      bpRepeat.classList.toggle('active', isRepeat);
      bpRepeat.classList.toggle('icon-active', isRepeat);
      bpRepeat.title = isRepeat ? 'Ulangi Lagu: AKTIF' : 'Ulangi Lagu: NONAKTIF';
    }

    if (notify) {
      showToast(isRepeat ? '🔁 Ulangi Lagu (Repeat): AKTIF' : '➡️ Ulangi Lagu: NONAKTIF');
      playRetroSFX(isRepeat ? 'like' : 'click');
    }
  }

  function playNextTrack() {
    if (!playlist || playlist.length === 0) return;

    if (isRepeat) {
      audio.currentTime = 0;
      playTrack();
      return;
    }

    let nextIdx = currentIndex + 1;
    if (isShuffled && playlist.length > 1) {
      let randIdx = Math.floor(Math.random() * playlist.length);
      if (randIdx === currentIndex) {
        randIdx = (randIdx + 1) % playlist.length;
      }
      nextIdx = randIdx;
    }

    if (nextIdx < playlist.length) {
      loadTrack(nextIdx);
      playTrack();
    } else {
      loadTrack(0);
      playTrack();
    }
  }

  function playPrevTrack() {
    if (!playlist || playlist.length === 0) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      playTrack();
      return;
    }

    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      prevIdx = playlist.length - 1;
    }
    loadTrack(prevIdx);
    playTrack();
  }

  audio.addEventListener('ended', () => {
    if (isRepeat) {
      audio.currentTime = 0;
      playTrack();
    } else if (isAutoMix) {
      const currentGenre = playlist[currentIndex]?.genre;
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
        playNextTrack();
      }
    } else {
      playNextTrack();
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
    baseSpeed = 1.36; // 45/33 ratio
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
  if (iconShuffle) iconShuffle.style.opacity = isShuffled ? '1' : '0.4';
  if (btnShuffle) {
    btnShuffle.onclick = () => setShuffleState(!isShuffled, true);
  }

  const btnRepeat = document.getElementById('btn-repeat');
  const iconRepeat = document.getElementById('icon-repeat');
  if (iconRepeat) iconRepeat.style.opacity = isRepeat ? '1' : '0.4';
  if (btnRepeat) {
    btnRepeat.onclick = () => setRepeatState(!isRepeat, true);
  }

  document.getElementById('btn-prev').onclick = playPrevTrack;
  document.getElementById('btn-next').onclick = playNextTrack;

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

  // Global Bottom Player Events
  const bpRepeat = document.getElementById('bp-repeat');
  const bpShuffle = document.getElementById('bp-shuffle');
  
  if (bpRepeat) {
    bpRepeat.onclick = () => setRepeatState(!isRepeat, true);
  }

  if (bpShuffle) {
    bpShuffle.onclick = () => setShuffleState(!isShuffled, true);
  }
  if (bpPlay) bpPlay.onclick = togglePlay;
  if (bpPrev) bpPrev.onclick = playPrevTrack;
  if (bpNext) bpNext.onclick = playNextTrack;
  
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
    miniPrev.onclick = playPrevTrack;
  }

  if (miniPlay) {
    miniPlay.onclick = togglePlay;
  }

  if (miniNext) {
    miniNext.onclick = playNextTrack;
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

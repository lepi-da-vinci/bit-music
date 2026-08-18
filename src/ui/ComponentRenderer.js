// UI Component Renderer & Modals System for Retro Groove

import { state } from '../core/StateManager.js';
import { sfx } from './SFXEngine.js';
import { generateProceduralCover, generatePixelHeartCover, generatePixelPlaylistCover, generateArtistPixelAvatar } from './PixelArtGenerator.js';

// Global Toast System
let toastTimeout;
export function showToast(message) {
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

// Modal Helpers
export function getModalElements() {
  return {
    container: document.getElementById('retro-modal-container'),
    title: document.getElementById('retro-modal-title'),
    body: document.getElementById('retro-modal-body'),
    btnCancel: document.getElementById('retro-modal-cancel'),
    btnConfirm: document.getElementById('retro-modal-confirm')
  };
}

export function hideModal() {
  const { container, btnCancel, btnConfirm } = getModalElements();
  if (container) container.classList.add('hidden');
  if (btnCancel) btnCancel.style.display = 'block';
  if (btnConfirm) {
    btnConfirm.style.display = 'block';
    btnConfirm.style.background = '';
    btnConfirm.style.borderColor = '';
    btnConfirm.style.color = '';
    btnConfirm.innerText = 'Simpan';
  }
}

export function showRetroConfirmModal(title, message, confirmBtnText, onConfirm) {
  const { container, title: titleEl, body: bodyEl, btnCancel, btnConfirm } = getModalElements();
  if (!container) return;

  btnConfirm.style.display = 'block';
  btnCancel.style.display = 'block';
  btnConfirm.innerText = confirmBtnText || 'HAPUS';
  btnConfirm.style.background = '#ff007f';
  btnConfirm.style.borderColor = '#ff007f';
  btnConfirm.style.color = '#fff';
  titleEl.innerText = title || 'KONFIRMASI';
  bodyEl.innerHTML = `
    <div style="font-size: 14px; color: #eee; line-height: 1.5; padding: 10px 0;">
      ${message}
    </div>
  `;
  container.classList.remove('hidden');
  sfx.play('click');

  btnCancel.onclick = () => {
    hideModal();
    sfx.play('click');
  };

  btnConfirm.onclick = () => {
    hideModal();
    sfx.play('delete');
    if (onConfirm) onConfirm();
  };
}

export function showCreatePlaylistModal(onCreated) {
  const { container, title: titleEl, body: bodyEl, btnCancel, btnConfirm } = getModalElements();
  if (!container) return;

  btnConfirm.style.display = 'block';
  btnCancel.style.display = 'block';
  btnConfirm.innerText = 'Buat Playlist';
  titleEl.innerText = 'Buat Playlist Baru';
  bodyEl.innerHTML = `
    <div style="font-size: 14px; color: #aaa; margin-bottom: 8px;">Masukkan nama playlist retro kamu:</div>
    <input type="text" id="retro-playlist-name-input" class="retro-input" placeholder="Contoh: Synthwave Nights, Chill Beat..." autofocus>
  `;
  container.classList.remove('hidden');
  sfx.play('click');

  const input = document.getElementById('retro-playlist-name-input');
  if (input) setTimeout(() => input.focus(), 50);

  btnCancel.onclick = () => {
    hideModal();
    sfx.play('click');
  };

  btnConfirm.onclick = () => {
    const name = input ? input.value.trim() : '';
    if (!name) {
      showToast('Nama playlist tidak boleh kosong!');
      return;
    }
    const newPl = state.createCustomPlaylist(name);
    hideModal();
    sfx.play('like');
    showToast(`Playlist "${newPl.name}" berhasil dibuat! 📁`);
    if (onCreated) onCreated(newPl);
  };

  if (input) {
    input.onkeydown = (e) => {
      if (e.key === 'Enter') btnConfirm.click();
      if (e.key === 'Escape') btnCancel.click();
    };
  }
}

export function showRenamePlaylistModal(playlistId, currentName, onRenamed) {
  const { container, title: titleEl, body: bodyEl, btnCancel, btnConfirm } = getModalElements();
  if (!container) return;

  btnConfirm.style.display = 'block';
  btnCancel.style.display = 'block';
  btnConfirm.innerText = 'Simpan Nama';
  titleEl.innerText = 'Ubah Nama Album / Playlist';
  bodyEl.innerHTML = `
    <div style="font-size: 14px; color: #aaa; margin-bottom: 8px;">Masukkan nama baru:</div>
    <input type="text" id="retro-rename-input" class="retro-input" value="${(currentName || '').replace(/"/g, '&quot;')}" autofocus>
  `;
  container.classList.remove('hidden');
  sfx.play('click');

  const input = document.getElementById('retro-rename-input');
  if (input) {
    setTimeout(() => {
      input.focus();
      input.select();
    }, 50);
  }

  btnCancel.onclick = () => {
    hideModal();
    sfx.play('click');
  };

  btnConfirm.onclick = () => {
    const newName = input ? input.value.trim() : '';
    if (!newName) {
      showToast('Nama tidak boleh kosong!');
      return;
    }
    const updated = state.renameCustomPlaylist(playlistId, newName);
    hideModal();
    sfx.play('like');
    showToast(`Nama diubah menjadi "${updated.name}"! ✏️`);
    if (onRenamed) onRenamed(newName);
  };

  if (input) {
    input.onkeydown = (e) => {
      if (e.key === 'Enter') btnConfirm.click();
      if (e.key === 'Escape') btnCancel.click();
    };
  }
}

export function showAddToPlaylistModal(track) {
  if (!track) return;
  const { container, title: titleEl, body: bodyEl, btnCancel, btnConfirm } = getModalElements();
  if (!container) return;

  const playlists = state.customPlaylists;
  titleEl.innerText = 'Tambahkan ke Playlist';

  if (playlists.length === 0) {
    bodyEl.innerHTML = `
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

    bodyEl.innerHTML = `
      <div style="font-size: 13px; color: #888; margin-bottom: 12px;">Lagu: <b style="color:#fff;">${track.title}</b></div>
      <div style="max-height: 200px; overflow-y: auto;">
        ${optionsHtml}
      </div>
    `;
  }

  container.classList.remove('hidden');
  sfx.play('click');

  btnCancel.onclick = () => {
    hideModal();
    sfx.play('click');
  };

  btnConfirm.onclick = () => {
    const selectedRadio = bodyEl.querySelector('input[name="target-playlist"]:checked');
    if (!selectedRadio) {
      showToast('Pilih salah satu playlist!');
      return;
    }
    const added = state.addTrackToCustomPlaylist(selectedRadio.value, track.filename);
    hideModal();
    sfx.play('like');
    showToast(added ? 'Lagu berhasil dimasukkan ke playlist!' : 'Lagu sudah ada di playlist');
  };
}

export function showPlaylistOptionsMenu(playlistId, playlistName, callbacks) {
  const { container, title: titleEl, body: bodyEl, btnCancel, btnConfirm } = getModalElements();
  if (!container) return;

  btnConfirm.style.display = 'none';
  btnCancel.style.display = 'block';
  btnCancel.innerText = 'TUTUP';
  titleEl.innerText = 'OPSI PLAYLIST';
  bodyEl.innerHTML = `
    <div style="font-size: 15px; color: #00ffcc; font-weight: bold; margin-bottom: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
      📼 ${playlistName}
    </div>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <button id="btn-opt-rename" class="retro-btn" style="width: 100%; text-align: left; padding: 12px 15px; background: rgba(0,255,204,0.1); border: 1px solid #00ffcc; color: #00ffcc; border-radius: 6px; font-family: inherit; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 16px;">✏️</span> Ubah Nama Playlist
      </button>
      <button id="btn-opt-manage-songs" class="retro-btn" style="width: 100%; text-align: left; padding: 12px 15px; background: rgba(255,170,0,0.1); border: 1px solid #ffaa00; color: #ffaa00; border-radius: 6px; font-family: inherit; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 16px;">➕</span> Kelola & Pilih Lagu (+ / ✕)
      </button>
      <button id="btn-opt-delete" class="retro-btn" style="width: 100%; text-align: left; padding: 12px 15px; background: rgba(255,0,127,0.1); border: 1px solid #ff007f; color: #ff007f; border-radius: 6px; font-family: inherit; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 16px;">🗑️</span> Hapus Playlist Ini
      </button>
    </div>
  `;
  container.classList.remove('hidden');
  sfx.play('click');

  btnCancel.onclick = () => {
    hideModal();
    sfx.play('click');
  };

  const optRename = document.getElementById('btn-opt-rename');
  if (optRename) {
    optRename.onclick = () => {
      hideModal();
      if (callbacks.onRename) callbacks.onRename();
    };
  }

  const optManage = document.getElementById('btn-opt-manage-songs');
  if (optManage) {
    optManage.onclick = () => {
      hideModal();
      if (callbacks.onManageSongs) callbacks.onManageSongs();
    };
  }

  const optDelete = document.getElementById('btn-opt-delete');
  if (optDelete) {
    optDelete.onclick = () => {
      hideModal();
      if (callbacks.onDelete) callbacks.onDelete();
    };
  }
}

export function showSelectTracksModal(playlistId, playlistName, onDone) {
  const { container, title: titleEl, body: bodyEl, btnCancel, btnConfirm } = getModalElements();
  if (!container) return;

  titleEl.innerText = `PILIH LAGU: "${playlistName}"`;
  btnConfirm.innerText = 'SELESAI';
  btnConfirm.style.display = 'block';
  btnCancel.style.display = 'none';

  bodyEl.innerHTML = `
    <input type="text" id="track-picker-search" class="retro-input" placeholder="Cari judul lagu atau artis..." style="margin-bottom: 12px; width: 100%; box-sizing: border-box;">
    <div id="track-picker-items" style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
    </div>
  `;

  const searchInput = document.getElementById('track-picker-search');
  const itemsContainer = document.getElementById('track-picker-items');

  function renderPickerItems(query = '') {
    if (!itemsContainer) return;
    const pl = state.customPlaylists.find(p => p.id === playlistId);
    const currentFilenames = pl ? pl.trackFilenames : [];

    const q = (query || '').toLowerCase().trim();
    const filtered = state.masterPlaylist.filter(t =>
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
    itemsContainer.innerHTML = itemsHtml;

    itemsContainer.querySelectorAll('.picker-toggle-btn').forEach(btn => {
      btn.onclick = () => {
        const fn = btn.getAttribute('data-filename');
        const currentPl = state.customPlaylists.find(p => p.id === playlistId);
        if (currentPl && currentPl.trackFilenames.includes(fn)) {
          state.removeTrackFromCustomPlaylist(playlistId, fn);
        } else {
          state.addTrackToCustomPlaylist(playlistId, fn);
        }
        renderPickerItems(searchInput ? searchInput.value : '');
      };
    });
  }

  if (searchInput) {
    searchInput.oninput = (e) => renderPickerItems(e.target.value);
    setTimeout(() => searchInput.focus(), 50);
  }

  renderPickerItems('');
  container.classList.remove('hidden');
  sfx.play('tab');

  btnConfirm.onclick = () => {
    hideModal();
    sfx.play('click');
    if (onDone) onDone();
  };
}

// Settings Modal
export function showSettingsModal(audioEngine) {
  const { container, title: titleEl, body: bodyEl, btnCancel, btnConfirm } = getModalElements();
  if (!container) return;

  titleEl.innerText = '⚙️ PENGATURAN RETRO GROOVE';
  btnConfirm.style.display = 'none';
  btnCancel.innerText = 'TUTUP';
  btnCancel.style.display = 'block';

  const settings = state.settings;
  const currentSleepSec = audioEngine ? audioEngine.getSleepTimerRemainingSeconds() : 0;

  bodyEl.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px; font-size: 13px; max-height: 380px; overflow-y: auto; padding-right: 5px;">
      <!-- Audio Settings -->
      <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="color: #00ffcc; font-weight: bold; margin-bottom: 10px; font-size: 14px;">🎛️ AUDIO & PLAYBACK</div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <div style="color: #fff; font-weight: bold;">Crossfade Antar Lagu</div>
            <div style="color: #777; font-size: 11px;">Transisi halus berganti lagu seperti DJ</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="set-crossfade-toggle" ${settings.crossfade ? 'checked' : ''}>
            <span class="pixel-switch"></span>
          </label>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <div style="color: #fff; font-weight: bold;">Durasi Crossfade</div>
            <div style="color: #777; font-size: 11px;">Waktu overlap perpindahan audio</div>
          </div>
          <select id="set-crossfade-duration" class="retro-select" style="padding: 4px 8px; background: #111; color: #00ffcc; border: 1px solid #00ffcc; border-radius: 4px; font-family: inherit;">
            <option value="2" ${settings.crossfadeDuration === 2 ? 'selected' : ''}>2 Detik</option>
            <option value="3" ${settings.crossfadeDuration === 3 ? 'selected' : ''}>3 Detik</option>
            <option value="5" ${settings.crossfadeDuration === 5 ? 'selected' : ''}>5 Detik</option>
            <option value="8" ${settings.crossfadeDuration === 8 ? 'selected' : ''}>8 Detik</option>
          </select>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="color: #fff; font-weight: bold;">Audio Normalization</div>
            <div style="color: #777; font-size: 11px;">Menyamakan volume seluruh lagu</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="set-normalization-toggle" ${settings.normalization ? 'checked' : ''}>
            <span class="pixel-switch"></span>
          </label>
        </div>
      </div>

      <!-- Sleep Timer -->
      <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="color: #ffaa00; font-weight: bold; margin-bottom: 10px; font-size: 14px;">⏱️ SLEEP TIMER (PENGATUR WAKTU TIDUR)</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
          <button class="sleep-btn ${currentSleepSec === 0 ? 'active' : ''}" data-mins="0" style="padding: 5px 10px; font-family: inherit; font-size: 11px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid #666; border-radius: 4px; cursor: pointer;">Mati</button>
          <button class="sleep-btn" data-mins="5" style="padding: 5px 10px; font-family: inherit; font-size: 11px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid #666; border-radius: 4px; cursor: pointer;">5 Menit</button>
          <button class="sleep-btn" data-mins="15" style="padding: 5px 10px; font-family: inherit; font-size: 11px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid #666; border-radius: 4px; cursor: pointer;">15 Menit</button>
          <button class="sleep-btn" data-mins="30" style="padding: 5px 10px; font-family: inherit; font-size: 11px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid #666; border-radius: 4px; cursor: pointer;">30 Menit</button>
          <button class="sleep-btn" data-mins="60" style="padding: 5px 10px; font-family: inherit; font-size: 11px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid #666; border-radius: 4px; cursor: pointer;">1 Jam</button>
        </div>
        <div id="sleep-timer-status" style="font-size: 11px; color: #ffaa00;">
          ${currentSleepSec > 0 ? `Aktif: ${Math.floor(currentSleepSec / 60)}m ${currentSleepSec % 60}s tersisa` : 'Timer sedang nonaktif'}
        </div>
      </div>

      <!-- General Settings -->
      <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="color: #ff007f; font-weight: bold; margin-bottom: 10px; font-size: 14px;">👾 SISTEM & RIWAYAT</div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <div style="color: #fff; font-weight: bold;">Suara UI Retro (SFX)</div>
            <div style="color: #777; font-size: 11px;">Efek suara ketukan tombol 8-bit</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="set-sfx-toggle" ${state.settings.sfxEnabled ? 'checked' : ''}>
            <span class="pixel-switch"></span>
          </label>
        </div>

        <button id="btn-clear-history" class="retro-btn" style="width: 100%; padding: 8px; font-size: 11px; color: #ff4757; border: 1px solid #ff4757; background: rgba(255,71,87,0.1); cursor: pointer; border-radius: 4px;">
          🗑️ Bersihkan Riwayat Putar (History)
        </button>
      </div>
    </div>
  `;

  container.classList.remove('hidden');
  sfx.play('tab');

  // Bind settings listeners
  const crossfadeToggle = document.getElementById('set-crossfade-toggle');
  if (crossfadeToggle) {
    crossfadeToggle.onchange = (e) => {
      state.updateSetting('crossfade', e.target.checked);
      showToast(e.target.checked ? 'Crossfade diaktifkan' : 'Crossfade dinonaktifkan');
      sfx.play('click');
    };
  }

  const crossfadeDur = document.getElementById('set-crossfade-duration');
  if (crossfadeDur) {
    crossfadeDur.onchange = (e) => {
      state.updateSetting('crossfadeDuration', parseInt(e.target.value, 10));
      showToast(`Durasi Crossfade: ${e.target.value} detik`);
      sfx.play('click');
    };
  }

  const normToggle = document.getElementById('set-normalization-toggle');
  if (normToggle) {
    normToggle.onchange = (e) => {
      state.updateSetting('normalization', e.target.checked);
      showToast(e.target.checked ? 'Audio Normalization Aktif' : 'Audio Normalization Nonaktif');
      sfx.play('click');
    };
  }

  const sfxToggle = document.getElementById('set-sfx-toggle');
  if (sfxToggle) {
    sfxToggle.onchange = (e) => {
      sfx.enabled = e.target.checked;
      state.updateSetting('sfxEnabled', e.target.checked);
      const bpSfxBtn = document.getElementById('bp-sfx-toggle');
      const ledBpSfx = document.getElementById('led-bp-sfx');
      if (bpSfxBtn) bpSfxBtn.classList.toggle('active', e.target.checked);
      if (ledBpSfx) ledBpSfx.classList.toggle('active', e.target.checked);
      showToast(e.target.checked ? 'Suara Retro SFX Aktif' : 'Suara Retro SFX Mati');
      if (e.target.checked) sfx.play('click');
    };
  }

  // Sleep Buttons
  bodyEl.querySelectorAll('.sleep-btn').forEach(btn => {
    btn.onclick = () => {
      const mins = parseInt(btn.getAttribute('data-mins'), 10);
      bodyEl.querySelectorAll('.sleep-btn').forEach(b => {
        b.style.borderColor = '#666';
        b.style.color = '#fff';
      });
      btn.style.borderColor = '#ffaa00';
      btn.style.color = '#ffaa00';

      if (audioEngine) {
        if (mins === 0) {
          audioEngine.cancelSleepTimer();
          showToast('⏱️ Sleep timer dibatalkan');
        } else {
          audioEngine.startSleepTimer(mins, (sec) => {
            const statusEl = document.getElementById('sleep-timer-status');
            if (statusEl) statusEl.innerText = `Aktif: ${Math.floor(sec / 60)}m ${sec % 60}s tersisa`;
          }, () => {
            showToast('😴 Sleep timer selesai: Audio dimatikan.');
          });
          showToast(`⏱️ Sleep timer diatur untuk ${mins} menit`);
        }
      }
      sfx.play('click');
    };
  });

  const clearHistoryBtn = document.getElementById('btn-clear-history');
  if (clearHistoryBtn) {
    clearHistoryBtn.onclick = () => {
      state.playHistory = [];
      localStorage.removeItem('retro_groove_play_history');
      showToast('Riwayat putar telah dibersihkan ✨');
      sfx.play('delete');
    };
  }

  btnCancel.onclick = () => {
    hideModal();
    sfx.play('click');
  };
}

// Command Palette (Ctrl+K)
export function showCommandPalette(router, playCallback) {
  const { container, title: titleEl, body: bodyEl, btnCancel, btnConfirm } = getModalElements();
  if (!container) return;

  titleEl.innerText = '⚡ COMMAND PALETTE (CTRL+K)';
  btnConfirm.style.display = 'none';
  btnCancel.innerText = 'TUTUP';

  bodyEl.innerHTML = `
    <input type="text" id="cmd-palette-input" class="retro-input" placeholder="Ketik perintah atau cari lagu..." style="width:100%; margin-bottom: 12px; box-sizing: border-box;" autofocus>
    <div id="cmd-palette-results" style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
    </div>
  `;

  const input = document.getElementById('cmd-palette-input');
  const results = document.getElementById('cmd-palette-results');

  const defaultActions = [
    { label: '🏠 Buka Halaman Beranda', action: () => router.navigate('home') },
    { label: '🧭 Buka Halaman Eksplorasi', action: () => router.navigate('explore') },
    { label: '📁 Buka Koleksi & Playlist', action: () => router.navigate('library') },
    { label: '💽 Buka Pemutar Vinyl Turntable', action: () => router.navigate('player') },
    { label: '🎤 Buka Karaoke & Lirik (Fullscreen)', action: () => router.navigate('fullscreenLyrics') },
    { label: '⚙️ Buka Pengaturan Aplikasi', action: () => showSettingsModal() },
    { label: '🔀 Putar Acak Seluruh Koleksi (Shuffle All)', action: () => {
      state.playlist = [...state.masterPlaylist];
      state.isShuffled = true;
      if (playCallback) playCallback(Math.floor(Math.random() * state.playlist.length));
    }},
    { label: '❤️ Putar Lagu Disukai', action: () => {
      const liked = state.masterPlaylist.filter(t => state.isFavorite(t.filename));
      if (liked.length > 0) {
        state.playlist = liked;
        if (playCallback) playCallback(0);
      } else {
        showToast('Belum ada lagu disukai');
      }
    }}
  ];

  function renderCmdResults(query = '') {
    if (!results) return;
    const q = query.toLowerCase().trim();

    let matches = defaultActions.filter(a => !q || a.label.toLowerCase().includes(q));

    // Also include matched songs
    if (q) {
      const songMatches = state.masterPlaylist
        .filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q))
        .slice(0, 5)
        .map(t => ({
          label: `🎵 Putar: ${t.title} - ${t.artist}`,
          action: () => {
            state.playlist = [...state.masterPlaylist];
            const idx = state.masterPlaylist.findIndex(s => s.filename === t.filename);
            if (playCallback) playCallback(idx >= 0 ? idx : 0);
          }
        }));
      matches = [...songMatches, ...matches];
    }

    if (matches.length === 0) {
      results.innerHTML = `<div style="color: #666; text-align: center; padding: 20px;">Tidak ada perintah yang cocok</div>`;
      return;
    }

    results.innerHTML = matches.map((m, i) => `
      <div class="cmd-item" data-index="${i}" style="padding: 10px 14px; background: rgba(255,255,255,0.05); border-radius: 6px; color: #fff; font-size: 13px; cursor: pointer; border: 1px solid transparent; transition: 0.15s;">
        ${m.label}
      </div>
    `).join('');

    results.querySelectorAll('.cmd-item').forEach(el => {
      el.onmouseenter = () => {
        el.style.borderColor = '#00ffcc';
        el.style.background = 'rgba(0,255,204,0.1)';
      };
      el.onmouseleave = () => {
        el.style.borderColor = 'transparent';
        el.style.background = 'rgba(255,255,255,0.05)';
      };
      el.onclick = () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        hideModal();
        sfx.play('click');
        matches[idx].action();
      };
    });
  }

  if (input) {
    input.oninput = (e) => renderCmdResults(e.target.value);
    setTimeout(() => input.focus(), 50);
    input.onkeydown = (e) => {
      if (e.key === 'Escape') hideModal();
      if (e.key === 'Enter') {
        const first = results.querySelector('.cmd-item');
        if (first) first.click();
      }
    };
  }

  renderCmdResults('');
  container.classList.remove('hidden');
  sfx.play('powerup');

  btnCancel.onclick = () => {
    hideModal();
    sfx.play('click');
  };
}

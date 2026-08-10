try {

  let playlist = [];
  let currentIndex = -1;
  let isPlaying = false;
  let isShuffled = false;
  let isRepeat = false;

  const audio = document.getElementById('audio-player');
  const vinylContainer = document.getElementById('vinyl-container');
  const vinylDisc = document.getElementById('vinyl-disc');
  const toneArm = document.getElementById('tone-arm');
  const playBtnIcon = document.getElementById('icon-play');
  const timeDisplay = document.getElementById('time-display');
  const progressBg = document.getElementById('progress-bg');
  const progressFill = document.getElementById('progress-fill');
  const progressThumb = document.getElementById('progress-thumb');
  const volSlider = document.getElementById('volume-slider');
  const volKnob = document.getElementById('vol-knob');
  const lcdTitle = document.getElementById('lcd-title');
  const lcdArtist = document.getElementById('lcd-artist');
  const playlistContainer = document.getElementById('playlist-list');

  const vinylColors = ['red', 'blue', 'green', 'purple', 'orange', 'teal'];
  const rgbColors = {
    'red': '255, 80, 100', 'blue': '80, 150, 255', 'green': '80, 220, 100',
    'purple': '180, 80, 220', 'orange': '255, 170, 60', 'teal': '60, 200, 180'
  };

  // Web Audio API for Bass Glow
  let audioCtx;
  let analyser;
  let dataArray;
  let source;

  function initAudioVisualizer() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    function renderFrame() {
      requestAnimationFrame(renderFrame);
      if (!isPlaying) {
        vinylContainer.style.boxShadow = 'none';
        return;
      }
      analyser.getByteFrequencyData(dataArray);
      // Get average of lower frequencies for bass
      let bass = 0;
      for (let i = 0; i < 5; i++) {
        bass += dataArray[i];
      }
      bass = bass / 5;

      // Calculate intensity 0-1
      const intensity = Math.pow(bass / 255, 2);
      const track = playlist[currentIndex];
      const col = rgbColors[track.vinylColor];

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

  // Load Music Files
  async function loadMusic() {
    try {
      const result = await window.api.readDir('music');
      if (result.success) {
        playlist = result.files.filter(f => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.ogg'));
        playlist = playlist.map(f => ({
          filename: f,
          path: window.api.getMusicPath(f),
          title: f.replace(/\.[^/.]+$/, ""), // Fallback to filename
          vinylColor: vinylColors[Math.floor(Math.random() * vinylColors.length)]
        }));

        // Render default Album
        const albumContainer = document.getElementById('album-list');
        if (albumContainer) {
          albumContainer.innerHTML = `
          <div class="album-item active">
            <div class="album-title">All Tracks</div>
            <div class="album-tracks">${playlist.length} tracks</div>
          </div>
        `;
        }

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
        <div class="track-artist">Unknown Artist</div>
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
  }

  function loadTrack(index) {
    currentIndex = index;
    const track = playlist[currentIndex];
    audio.src = track.path;
    lcdTitle.innerText = track.title;
    lcdArtist.innerText = 'Unknown Artist';

    // Vinyl change animation
    vinylDisc.style.opacity = 0;
    setTimeout(() => {
      vinylDisc.src = window.api.getAssetPath(`vinyl_${track.vinylColor}.png`);
      vinylDisc.style.opacity = 1;
    }, 200);

    updatePlaylistUI();
  }

  function playTrack() {
    initAudioVisualizer();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (currentIndex === -1 && playlist.length > 0) loadTrack(0);
    audio.play();
    isPlaying = true;
    playBtnIcon.src = window.api.getAssetPath('btn_start_stop_active.png');
    vinylContainer.classList.add('spinning');
    updateToneArm();
  }

  function pauseTrack() {
  audio.pause();
  isPlaying = false;
  playBtnIcon.src = window.api.getAssetPath('btn_start_stop.png');
  vinylContainer.classList.remove('spinning');
  toneArm.style.transform = 'rotate(-32deg) scale(0.8)';
}

function togglePlay() {
  if (isPlaying) pauseTrack();
  else playTrack();
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateToneArm() {
  if (!isPlaying) return;
  const pct = (audio.currentTime && audio.duration) ? (audio.currentTime / audio.duration) : 0;
  // Starts at outer edge (-16 deg), moves inward to inner groove (+4 deg)
  const targetAngle = -16 + (pct * 20); 
  toneArm.style.transform = `rotate(${targetAngle}deg) scale(0.8)`;
}

  // Audio Events
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = audio.currentTime / audio.duration;
    progressFill.style.width = `${pct * 100}%`;
    progressThumb.style.left = `${pct * 100}%`;
    timeDisplay.innerText = formatTime(audio.currentTime);
    updateToneArm();
  });

  audio.addEventListener('ended', () => {
    if (isRepeat) {
      playTrack();
    } else {
      document.getElementById('btn-next').click();
    }
  });

  // UI Controls
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

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      document.getElementById('btn-next').click();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      document.getElementById('btn-prev').click();
    } else if (e.code === 'ArrowUp') {
      e.preventDefault();
      let v = parseFloat(audio.volume) + 0.05;
      if (v > 1) v = 1;
      volSlider.value = v;
      volSlider.dispatchEvent(new Event('input'));
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      let v = parseFloat(audio.volume) - 0.05;
      if (v < 0) v = 0;
      volSlider.value = v;
      volSlider.dispatchEvent(new Event('input'));
    }
  });

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

  // Volume
  volSlider.oninput = (e) => {
    audio.volume = e.target.value;
    const pct = 1 - e.target.value; // 1 is max (top), 0 is min (bottom)
    volKnob.style.top = `${pct * 100}%`;
  };

  // Default volume
  volKnob.style.top = '50%';

  // Start
  loadMusic();

} catch (err) {
  if (window.api && window.api.logError) {
    window.api.logError("Init Error: " + err.message + "\n" + err.stack);
  }
  document.body.innerHTML += `<div style="position:absolute;top:0;left:0;color:red;z-index:9999;background:black;padding:10px;font-size:20px;">Init Error: ${err.message}<br>${err.stack}</div>`;
}

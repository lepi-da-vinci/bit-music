try {

  let masterPlaylist = [];
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
  const navLibrary = document.getElementById('nav-library');

  const vinylColors = ['red', 'blue', 'green', 'purple', 'orange', 'teal'];
  const rgbColors = {
    'red': '255, 80, 100', 'blue': '80, 150, 255', 'green': '80, 220, 100',
    'purple': '180, 80, 220', 'orange': '255, 170, 60', 'teal': '60, 200, 180'
  };

  // Web Audio API for Bass Glow and Visualizer
  let audioCtx;
  let analyser;
  let dataArray;
  let source;
  let bassFilter, midFilter, trebFilter;
  let delayNode, feedbackGain, echoMix;

  function initAudioVisualizer() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
    const ctx = canvas.getContext('2d');
    
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        vinylRotation += 2 * currentPlaybackRate; // ~3s per rotation at 1.0x
        vinylContainer.style.transform = `rotate(${vinylRotation}deg)`;
      }
      
      // Update canvas dimensions if needed
      if (canvas.width !== canvas.offsetWidth) canvas.width = canvas.offsetWidth;
      if (canvas.height !== canvas.offsetHeight) canvas.height = canvas.offsetHeight;

      analyser.getByteFrequencyData(dataArray);
      
      // Draw Spectrum Analyzer
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / 15) - 2;
      let x = 0;
      
      for (let i = 0; i < 15; i++) {
        // Skip some very low frequencies, take steps
        const dataIndex = i * 2 + 2; 
        const barHeight = (dataArray[dataIndex] / 255) * canvas.height;
        
        ctx.fillStyle = `rgba(100, 255, 120, ${0.4 + (barHeight/canvas.height)*0.6})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
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

  // Load Music Files
  async function loadMusic() {
    try {
      const result = await window.api.readDir('music');
      if (result.success) {
        masterPlaylist = result.files.map(f => ({
          filename: f.filename,
          path: window.api.getMusicPath(f.filename),
          title: f.title || f.filename.replace(/\.[^/.]+$/, ""),
          artist: f.artist || "Unknown Artist",
          genre: f.genre || "Unknown",
          album: f.album || "Unknown Album",
          coverBase64: f.coverBase64,
          vinylColor: vinylColors[Math.floor(Math.random() * vinylColors.length)]
        }));

        playlist = [...masterPlaylist];

        // Group by Album
        const albumMap = {};
        masterPlaylist.forEach(t => {
          if (!albumMap[t.album]) albumMap[t.album] = [];
          albumMap[t.album].push(t);
        });

        // Render Albums
        const albumContainer = document.getElementById('album-list');
        if (albumContainer) {
          albumContainer.innerHTML = `
          <div class="album-item active" data-album="all">
            <div class="album-title">All Tracks</div>
            <div class="album-tracks">${masterPlaylist.length} tracks</div>
          </div>
          `;
          
          Object.keys(albumMap).forEach(albumName => {
            const tracks = albumMap[albumName];
            albumContainer.innerHTML += `
            <div class="album-item" data-album="${albumName}">
              <div class="album-title">${albumName}</div>
              <div class="album-tracks">${tracks.length} tracks</div>
            </div>
            `;
            
            // Populate Home Carousel
            if (homeAlbums) {
              const cover = tracks[0].coverBase64 ? `url('${tracks[0].coverBase64}')` : '#222';
              homeAlbums.innerHTML += `
              <div class="album-card" data-album="${albumName}">
                <div class="album-card-art" style="background: ${cover}; background-size: cover; background-position: center;"></div>
                <div class="album-card-title">${albumName}</div>
                <div class="album-card-artist">${tracks[0].artist}</div>
              </div>
              `;
            }
          });
          
          // Bind clicks for Home Carousel
          if (homeAlbums) {
            document.querySelectorAll('.album-card').forEach(el => {
              el.onclick = () => {
                const selectedAlbum = el.getAttribute('data-album');
                playlist = albumMap[selectedAlbum];
                
                // Switch to Player View
                if (homeView) homeView.classList.add('hidden');
                if (playerView) playerView.classList.remove('hidden');
                if (navHome) navHome.classList.remove('active');
                
                renderPlaylist();
                if (playlist.length > 0) {
                  loadTrack(0);
                  playTrack();
                }
              };
            });
          }
          
          // Bind clicks
          document.querySelectorAll('.album-item').forEach(el => {
            el.onclick = () => {
              document.querySelectorAll('.album-item').forEach(a => a.classList.remove('active'));
              el.classList.add('active');
              
              const selectedAlbum = el.getAttribute('data-album');
              if (selectedAlbum === 'all') {
                playlist = [...masterPlaylist];
              } else {
                playlist = albumMap[selectedAlbum];
              }
              
              renderPlaylist();
              if (playlist.length > 0) {
                loadTrack(0);
                playTrack();
              }
            };
          });
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
  }

  let vinylRotation = 0;
  let targetPlaybackRate = 1.0;
  let currentPlaybackRate = 0.0;
  let isVinylDragging = false;
  let isToneArmDragging = false;

  function playTrack() {
    initAudioVisualizer();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (currentIndex === -1 && playlist.length > 0) loadTrack(0);
    if (audio.paused) audio.play();
    isPlaying = true;
    playBtnIcon.src = window.api.getAssetPath('btn_start_stop_active.png');
    if (bpPlay) bpPlay.innerText = '⏸';
    updateToneArm();
  }

  function pauseTrack() {
    isPlaying = false;
    audio.pause();
    currentPlaybackRate = 0;
    playBtnIcon.src = window.api.getAssetPath('btn_start_stop.png');
    if (bpPlay) bpPlay.innerText = '▶';
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
  if (!isPlaying && !isToneArmDragging) return;
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
    
    const timeDuration = document.getElementById('time-duration');
    if (timeDuration) {
      timeDuration.innerText = formatTime(audio.duration);
    }
    
    if (bpTime && audio.duration) {
      bpTime.innerText = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
    
    updateToneArm();
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
  volSlider.oninput = (e) => {
    audio.volume = e.target.value;
  };

  // Default volume
  audio.volume = 0.5;
  volSlider.value = 0.5;

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
      // Toggle between Player and Home
      if (playerView.classList.contains('hidden')) {
        homeView.classList.add('hidden');
        playerView.classList.remove('hidden');
        if (navHome) navHome.classList.remove('active');
      } else {
        playerView.classList.add('hidden');
        homeView.classList.remove('hidden');
        if (navHome) navHome.classList.add('active');
      }
    };
  }

  // Navigation Routing
  if (navHome) {
    navHome.onclick = (e) => {
      e.preventDefault();
      playerView.classList.add('hidden');
      homeView.classList.remove('hidden');
      navHome.classList.add('active');
      if (navLibrary) navLibrary.classList.remove('active');
    };
  }
  if (navLibrary) {
    navLibrary.onclick = (e) => {
      e.preventDefault();
      // Future library implementation
      navLibrary.classList.add('active');
      if (navHome) navHome.classList.remove('active');
    };
  }

  // Start
  loadMusic();

} catch (err) {
  if (window.api && window.api.logError) {
    window.api.logError("Init Error: " + err.message + "\n" + err.stack);
  }
  document.body.innerHTML += `<div style="position:absolute;top:0;left:0;color:red;z-index:9999;background:black;padding:10px;font-size:20px;">Init Error: ${err.message}<br>${err.stack}</div>`;
}

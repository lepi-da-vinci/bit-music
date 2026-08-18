// High-Fidelity Retro Web Audio Engine with Crossfade, EQ, Lo-Fi FX, Sleep Timer & Visualizer

import { state } from './StateManager.js';

export class AudioEngine {
  constructor(primaryAudioEl) {
    this.primaryAudio = primaryAudioEl || document.getElementById('audio-player');
    this.secondaryAudio = document.createElement('audio');
    this.activeAudio = this.primaryAudio;
    this.crossfadeAudio = this.secondaryAudio;

    this.audioCtx = null;
    this.sourcePrimary = null;
    this.sourceSecondary = null;
    this.analyser = null;
    this.dataArray = null;

    // Filters & Effects
    this.bassFilter = null;
    this.midFilter = null;
    this.trebFilter = null;
    this.delayNode = null;
    this.feedbackGain = null;
    this.echoMix = null;
    this.normalizerGain = null;

    // Lo-Fi Noise
    this.noiseNode = null;
    this.noiseGain = null;

    // Physics & RPM
    this.baseSpeed = 1.0;
    this.pitchMultiplier = 1.0;
    this.targetPlaybackRate = 1.0;
    this.currentPlaybackRate = 0.0;
    this.vinylRotation = 0;
    this.isVinylDragging = false;
    this.isToneArmDragging = false;

    // Sleep Timer
    this.sleepTimerId = null;
    this.sleepTimerEnd = null;
    this.sleepTimerCallback = null;

    // Crossfade State
    this.isCrossfading = false;

    this.setupAudioListeners();
  }

  initContext() {
    if (this.audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.audioCtx = new AudioContextClass();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    // 1. EQ Filters
    this.bassFilter = this.audioCtx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 250;
    const bassEl = document.getElementById('eq-bass');
    this.bassFilter.gain.value = bassEl ? parseFloat(bassEl.value) : 0;

    this.midFilter = this.audioCtx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 1;
    const midEl = document.getElementById('eq-mid');
    this.midFilter.gain.value = midEl ? parseFloat(midEl.value) : 0;

    this.trebFilter = this.audioCtx.createBiquadFilter();
    this.trebFilter.type = 'highshelf';
    this.trebFilter.frequency.value = 4000;
    const trebEl = document.getElementById('eq-treb');
    this.trebFilter.gain.value = trebEl ? parseFloat(trebEl.value) : 0;

    // 2. Echo / Delay Node
    this.delayNode = this.audioCtx.createDelay(1.0);
    this.delayNode.delayTime.value = 0.4;
    this.feedbackGain = this.audioCtx.createGain();
    this.feedbackGain.gain.value = 0.3;
    this.echoMix = this.audioCtx.createGain();
    const echoEl = document.getElementById('fx-echo');
    this.echoMix.gain.value = echoEl ? parseFloat(echoEl.value) : 0;

    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.echoMix);
    this.echoMix.connect(this.audioCtx.destination);

    // 3. Normalizer & Dynamic Compressor Node
    this.compressor = this.audioCtx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-24, this.audioCtx.currentTime);
    this.compressor.knee.setValueAtTime(30, this.audioCtx.currentTime);
    this.compressor.ratio.setValueAtTime(12, this.audioCtx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.audioCtx.currentTime);

    // 4. Connect Primary Source
    try {
      this.sourcePrimary = this.audioCtx.createMediaElementSource(this.primaryAudio);
      this.sourcePrimary.connect(this.bassFilter);
    } catch (e) {
      console.warn("Primary source already connected or restricted:", e);
    }

    try {
      this.sourceSecondary = this.audioCtx.createMediaElementSource(this.secondaryAudio);
      this.sourceSecondary.connect(this.bassFilter);
    } catch (e) {
      console.warn("Secondary source notice:", e);
    }

    // Audio Graph Chain:
    // Source -> Bass -> Mid -> Treble -> Compressor -> Analyser -> Destination
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebFilter);
    this.trebFilter.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    // Also send treble output to delay node
    this.trebFilter.connect(this.delayNode);

    // Start Lo-Fi Crackle Generator
    this.initLofiNoise();

    // Start Visualizer Loop
    this.startVisualizerLoop();
  }

  setupAudioListeners() {
    this.primaryAudio.addEventListener('ended', () => this.handleTrackEnded());
    this.secondaryAudio.addEventListener('ended', () => this.handleTrackEnded());

    // Monitor for crossfade trigger
    this.primaryAudio.addEventListener('timeupdate', () => this.checkCrossfade(this.primaryAudio));
    this.secondaryAudio.addEventListener('timeupdate', () => this.checkCrossfade(this.secondaryAudio));
  }

  handleTrackEnded() {
    if (this.isCrossfading) return;
    state.emit('trackEnded');
  }

  checkCrossfade(audioEl) {
    if (audioEl !== this.activeAudio) return;
    if (!state.settings.crossfade || this.isCrossfading) return;
    if (!audioEl.duration || audioEl.duration < 10) return;

    const crossfadeTime = state.settings.crossfadeDuration || 3;
    const remainingTime = audioEl.duration - audioEl.currentTime;

    if (remainingTime <= crossfadeTime && remainingTime > 0.3) {
      this.triggerCrossfade();
    }
  }

  triggerCrossfade() {
    if (this.isCrossfading) return;
    this.isCrossfading = true;

    // Tell state manager to cue next track with crossfade
    state.emit('crossfadeTriggered', {
      duration: state.settings.crossfadeDuration || 3
    });
  }

  // Crossfade Playback Transition
  playWithCrossfade(nextTrackPath, nextTrackDuration = 3) {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const currentEl = this.activeAudio;
    const nextEl = this.crossfadeAudio;
    const crossDuration = state.settings.crossfadeDuration || 3;

    nextEl.src = nextTrackPath;
    nextEl.volume = 0;
    
    nextEl.play().then(() => {
      // Smooth fade out current, fade in next
      const fadeSteps = 20;
      const stepInterval = (crossDuration * 1000) / fadeSteps;
      const targetVol = this.getVolume();
      let step = 0;

      const fadeTimer = setInterval(() => {
        step++;
        const factor = step / fadeSteps;
        nextEl.volume = Math.min(1, targetVol * factor);
        currentEl.volume = Math.max(0, targetVol * (1 - factor));

        if (step >= fadeSteps) {
          clearInterval(fadeTimer);
          currentEl.pause();
          currentEl.currentTime = 0;
          currentEl.volume = targetVol;
          
          // Swap active elements
          this.activeAudio = nextEl;
          this.crossfadeAudio = currentEl;
          this.isCrossfading = false;
        }
      }, stepInterval);
    }).catch(err => {
      console.warn("Crossfade play fallback:", err);
      this.isCrossfading = false;
      this.playDirect(nextTrackPath);
    });
  }

  playDirect(trackPath) {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.activeAudio.src = trackPath;
    this.activeAudio.volume = this.getVolume();

    return this.activeAudio.play().then(() => {
      this.isCrossfading = false;
      return true;
    });
  }

  pause() {
    this.activeAudio.pause();
    this.crossfadeAudio.pause();
    this.currentPlaybackRate = 0;
  }

  play() {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.activeAudio.play();
  }

  seek(seconds) {
    if (this.activeAudio.duration) {
      this.activeAudio.currentTime = Math.max(0, Math.min(this.activeAudio.duration, seconds));
    }
  }

  getCurrentTime() {
    return this.activeAudio.currentTime || 0;
  }

  getDuration() {
    return this.activeAudio.duration || 0;
  }

  getVolume() {
    const volSlider = document.getElementById('vol-slider') || document.getElementById('bp-vol-slider');
    return volSlider ? parseFloat(volSlider.value) : 0.5;
  }

  setVolume(val) {
    const clamped = Math.max(0, Math.min(1, val));
    this.activeAudio.volume = clamped;
    this.crossfadeAudio.volume = clamped;

    const volSlider = document.getElementById('vol-slider');
    const bpVolSlider = document.getElementById('bp-vol-slider');
    if (volSlider) volSlider.value = clamped;
    if (bpVolSlider) bpVolSlider.value = clamped;
  }

  // Equalizer & FX Setters
  setBass(val) {
    if (this.bassFilter) this.bassFilter.gain.value = val;
  }

  setMid(val) {
    if (this.midFilter) this.midFilter.gain.value = val;
  }

  setTreble(val) {
    if (this.trebFilter) this.trebFilter.gain.value = val;
  }

  setEcho(val) {
    if (this.echoMix) this.echoMix.gain.value = val;
  }

  setSpeedRPM(speed) {
    if (speed === 33) {
      this.baseSpeed = 1.0;
    } else {
      this.baseSpeed = 1.36; // 45 / 33 RPM ratio
    }
    this.targetPlaybackRate = this.baseSpeed * this.pitchMultiplier;
  }

  setPitch(multiplier) {
    this.pitchMultiplier = parseFloat(multiplier);
    this.targetPlaybackRate = this.baseSpeed * this.pitchMultiplier;
  }

  // Lo-Fi Vinyl Crackle Pink Noise Generator
  createVinylNoiseBuffer() {
    if (!this.audioCtx) return null;
    const bufferSize = this.audioCtx.sampleRate * 2;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
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

      if (Math.random() < 0.005) pink += (Math.random() * 2 - 1) * 8; // Random Vinyl Crackles
      data[i] = pink * 0.03;
    }
    return buffer;
  }

  initLofiNoise() {
    if (this.noiseNode || !this.audioCtx) return;
    const buf = this.createVinylNoiseBuffer();
    if (!buf) return;

    this.noiseNode = this.audioCtx.createBufferSource();
    this.noiseNode.buffer = buf;
    this.noiseNode.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3000;

    this.noiseGain = this.audioCtx.createGain();
    this.noiseGain.gain.value = 0;

    this.noiseNode.connect(filter);
    filter.connect(this.noiseGain);
    this.noiseGain.connect(this.audioCtx.destination);

    this.noiseNode.start();
  }

  // Sleep Timer System
  startSleepTimer(minutes, onTick, onComplete) {
    this.cancelSleepTimer();
    if (!minutes || minutes <= 0) return;

    const durationMs = minutes * 60 * 1000;
    this.sleepTimerEnd = Date.now() + durationMs;

    this.sleepTimerId = setInterval(() => {
      const remainingMs = this.sleepTimerEnd - Date.now();
      if (remainingMs <= 0) {
        this.cancelSleepTimer();
        this.pause();
        state.isPlaying = false;
        state.emit('sleepTimerFinished');
        if (onComplete) onComplete();
      } else {
        // Fade out in last 10 seconds
        if (remainingMs <= 10000) {
          const factor = remainingMs / 10000;
          this.activeAudio.volume = Math.max(0, this.getVolume() * factor);
        }
        if (onTick) onTick(Math.ceil(remainingMs / 1000));
      }
    }, 1000);
  }

  cancelSleepTimer() {
    if (this.sleepTimerId) {
      clearInterval(this.sleepTimerId);
      this.sleepTimerId = null;
      this.sleepTimerEnd = null;
    }
  }

  getSleepTimerRemainingSeconds() {
    if (!this.sleepTimerEnd) return 0;
    return Math.max(0, Math.ceil((this.sleepTimerEnd - Date.now()) / 1000));
  }

  // Visualizer Animation Loop
  initVUMeter() {
    const vuL = document.getElementById('vu-l');
    const vuR = document.getElementById('vu-r');
    if (!vuL || !vuR) return;

    const createLeds = (container) => {
      if (container.children.length === 10) return;
      container.innerHTML = '';
      for (let i = 0; i < 10; i++) {
        const led = document.createElement('div');
        led.className = 'vu-led ' + (i < 6 ? 'green' : (i < 8 ? 'yellow' : 'red'));
        container.appendChild(led);
      }
    };

    createLeds(vuL);
    createLeds(vuR);
  }

  startVisualizerLoop() {
    this.initVUMeter();

    const canvas = document.getElementById('lcd-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const bpCanvas = document.getElementById('bp-visualizer');
    const bpCtx = bpCanvas ? bpCanvas.getContext('2d') : null;
    const vinylContainer = document.getElementById('vinyl-container');
    const vuL = document.getElementById('vu-l');
    const vuR = document.getElementById('vu-r');

    const renderLoop = () => {
      requestAnimationFrame(renderLoop);

      // Motor Physics
      if (!this.isVinylDragging) {
        if (state.isPlaying) {
          this.currentPlaybackRate += (this.targetPlaybackRate - this.currentPlaybackRate) * 0.05;
        } else {
          this.currentPlaybackRate = 0;
        }
        this.activeAudio.playbackRate = Math.max(0.01, this.currentPlaybackRate);
      }

      // If stopped, clear visualizers and VU meters
      if (this.currentPlaybackRate < 0.01 && !state.isPlaying && !this.isVinylDragging) {
        if (vinylContainer) vinylContainer.style.boxShadow = 'none';
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (bpCtx && bpCanvas) bpCtx.clearRect(0, 0, bpCanvas.width, bpCanvas.height);
        if (vuL && vuR) {
          for (let i = 0; i < vuL.children.length; i++) vuL.children[i].classList.remove('active');
          for (let i = 0; i < vuR.children.length; i++) vuR.children[i].classList.remove('active');
        }
        if (this.noiseGain && this.audioCtx) this.noiseGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.1);
        return;
      }

      // Lo-Fi Crackle Gain
      if (this.noiseGain && this.audioCtx) {
        if (state.settings.lofiNoise && this.currentPlaybackRate > 0.05) {
          this.noiseGain.gain.setTargetAtTime(0.5, this.audioCtx.currentTime, 0.1);
        } else {
          this.noiseGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.1);
        }
      }

      // Rotate Vinyl
      if (!this.isVinylDragging && vinylContainer) {
        this.vinylRotation += 2 * this.currentPlaybackRate;
        vinylContainer.style.transform = `rotate(${this.vinylRotation}deg)`;
      }

      if (!this.analyser || !this.dataArray) return;
      this.analyser.getByteFrequencyData(this.dataArray);

      // 1. LCD Canvas Turntable Spectrum
      if (canvas && ctx) {
        if (canvas.width !== canvas.offsetWidth) canvas.width = canvas.offsetWidth;
        if (canvas.height !== canvas.offsetHeight) canvas.height = canvas.offsetHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const numBars = 16;
        const barWidth = Math.floor((canvas.width - 4) / numBars) - 2;
        let x = 2;

        for (let i = 0; i < numBars; i++) {
          const dataIndex = i * 2 + 2;
          const barHeightRatio = (this.dataArray[dataIndex] || 0) / 255;
          const barHeight = Math.max(3, barHeightRatio * (canvas.height * 0.7));

          ctx.fillStyle = `rgba(57, 255, 20, ${0.15 + barHeightRatio * 0.35})`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 2;
        }
      }

      // 2. Bottom Player 8-Bit Pixel Spectrum
      if (bpCanvas && bpCtx) {
        bpCtx.clearRect(0, 0, bpCanvas.width, bpCanvas.height);
        const numBars = 12;
        const barWidth = Math.floor((bpCanvas.width - 4) / numBars) - 2;
        const blockHeight = 3;
        const blockGap = 1;
        const maxBlocks = Math.floor(bpCanvas.height / (blockHeight + blockGap));

        for (let i = 0; i < numBars; i++) {
          const dataIndex = Math.floor(i * 3 + 2);
          const rawVal = this.dataArray[dataIndex] || 0;
          const barHeightRatio = rawVal / 255;
          const numBlocks = Math.floor(barHeightRatio * maxBlocks);
          const x = 2 + i * (barWidth + 2);

          for (let b = 0; b < numBlocks; b++) {
            const y = bpCanvas.height - (b + 1) * (blockHeight + blockGap);
            if (b >= maxBlocks - 2) {
              bpCtx.fillStyle = '#ff0055'; // Pink/Red Peak
            } else if (b >= maxBlocks - 4) {
              bpCtx.fillStyle = '#ffff00'; // Yellow
            } else if (b >= 2) {
              bpCtx.fillStyle = '#39ff14'; // Green
            } else {
              bpCtx.fillStyle = '#00ffcc'; // Cyan base
            }
            bpCtx.fillRect(x, y, barWidth, blockHeight);
          }
        }
      }

      // 3. VU Meter calculation & LED Animation
      let overallL = 0;
      let overallR = 0;
      const count = this.dataArray.length;
      for (let i = 0; i < count; i++) {
        if (i % 2 === 0) overallL += this.dataArray[i];
        else overallR += this.dataArray[i];
      }
      overallL = ((overallL / (count / 2)) / 255) * 1.8;
      overallR = ((overallR / (count / 2)) / 255) * 1.8;

      if (vuL && vuR && vuL.children.length === 10 && vuR.children.length === 10) {
        const ledsL = vuL.children;
        const ledsR = vuR.children;
        const countL = Math.min(10, Math.floor(overallL * 10));
        const countR = Math.min(10, Math.floor(overallR * 10));

        for (let i = 0; i < 10; i++) {
          if (i < countL) {
            ledsL[i].classList.add('active');
          } else {
            ledsL[i].classList.remove('active');
          }

          if (i < countR) {
            ledsR[i].classList.add('active');
          } else {
            ledsR[i].classList.remove('active');
          }
        }
      }

      // 4. Bass Glow on Vinyl
      let bass = 0;
      for (let i = 0; i < 5; i++) bass += this.dataArray[i];
      bass = bass / 5;
      const intensity = Math.pow(bass / 255, 2);

      const track = state.getCurrentTrack();
      if (track && vinylContainer) {
        const rgbMap = {
          'red': '255, 80, 100', 'blue': '80, 150, 255', 'green': '80, 220, 100',
          'purple': '180, 80, 220', 'orange': '255, 170, 60', 'teal': '60, 200, 180'
        };
        const col = rgbMap[track.vinylColor] || '0, 255, 204';
        if (intensity > 0.1) {
          const alpha = Math.min(1, intensity * 0.8);
          const spread = 5 + (intensity * 15);
          vinylContainer.style.boxShadow = `0 0 ${spread}px ${spread}px rgba(${col}, ${alpha})`;
        } else {
          vinylContainer.style.boxShadow = 'none';
        }
      }
    };

    renderLoop();
  }
}

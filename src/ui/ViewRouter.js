// View Router for Seamless Screen Transitions & Navigation History

import { state } from '../core/StateManager.js';
import { sfx } from './SFXEngine.js';

export class ViewRouter {
  constructor() {
    this.views = {
      home: document.getElementById('home-view'),
      explore: document.getElementById('explore-view'),
      library: document.getElementById('library-view'),
      player: document.getElementById('player-view'),
      artist: document.getElementById('artist-view'),
      fullscreenLyrics: document.getElementById('fullscreen-lyrics-view')
    };

    this.navItems = {
      home: document.getElementById('nav-home'),
      explore: document.getElementById('nav-explore'),
      library: document.getElementById('nav-library')
    };

    this.bpTogglePlayer = document.getElementById('bp-toggle-player');
    this.historyStack = ['home'];
    this.activeView = 'home';

    this.setupListeners();
  }

  setupListeners() {
    if (this.navItems.home) {
      this.navItems.home.onclick = (e) => {
        e.preventDefault();
        this.navigate('home');
      };
    }
    if (this.navItems.explore) {
      this.navItems.explore.onclick = (e) => {
        e.preventDefault();
        this.navigate('explore');
      };
    }
    if (this.navItems.library) {
      this.navItems.library.onclick = (e) => {
        e.preventDefault();
        this.navigate('library');
      };
    }

    // Rightmost Bottom Player Button: Exclusively Toggles / Closes the Vinyl Player
    if (this.bpTogglePlayer) {
      this.bpTogglePlayer.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Always hide drawers when toggling player
        const lrcDrawer = document.getElementById('lyrics-drawer');
        const qDrawer = document.getElementById('queue-drawer');
        if (lrcDrawer) lrcDrawer.classList.add('hidden');
        if (qDrawer) qDrawer.classList.add('hidden');

        if (this.activeView === 'player') {
          // If currently in Vinyl Player, CLOSE IT and return to previous screen
          let targetPrev = 'home';
          for (let i = this.historyStack.length - 2; i >= 0; i--) {
            const v = this.historyStack[i];
            if (v && v !== 'player' && v !== 'fullscreenLyrics' && this.views[v]) {
              targetPrev = v;
              break;
            }
          }
          if (state.previousView && state.previousView !== 'player' && state.previousView !== 'fullscreenLyrics' && this.views[state.previousView]) {
            targetPrev = state.previousView;
          }
          this.navigate(targetPrev);
        } else {
          // If outside Vinyl Player, OPEN IT
          this.navigate('player');
        }
      };
    }

    // Top close button inside player view (if exists)
    const btnClosePlayer = document.getElementById('btn-close-player');
    if (btnClosePlayer) {
      btnClosePlayer.onclick = (e) => {
        e.preventDefault();
        const prev = (state.previousView && state.previousView !== 'player') ? state.previousView : 'home';
        this.navigate(prev);
      };
    }
  }

  navigate(viewName, params = {}) {
    if (!this.views[viewName]) return;

    if (this.activeView !== viewName) {
      state.previousView = this.activeView;
      this.historyStack.push(viewName);
      if (this.historyStack.length > 20) this.historyStack.shift();
    }

    this.activeView = viewName;
    state.currentView = viewName;

    // 1. Hide all views
    Object.keys(this.views).forEach(key => {
      const el = this.views[key];
      if (el) {
        el.classList.add('hidden');
        el.classList.remove('active');
      }
    });

    // 2. Show target view
    const targetEl = this.views[viewName];
    if (targetEl) {
      targetEl.classList.remove('hidden');
      targetEl.classList.add('active');
    }

    // 3. Highlight sidebar nav tab
    Object.keys(this.navItems).forEach(key => {
      const navEl = this.navItems[key];
      if (navEl) {
        navEl.classList.toggle('active', key === viewName);
      }
    });

    // 4. Update rightmost bottom player toggle button (Icon & Tooltip)
    if (this.bpTogglePlayer) {
      const upImg = '<img class="pixel-icon" src="assets/icons/icon_up.bmp">';
      const downImg = '<img class="pixel-icon" src="assets/icons/icon_down.bmp">';
      if (viewName === 'player') {
        this.bpTogglePlayer.innerHTML = downImg;
        this.bpTogglePlayer.title = 'Tutup Pemutar Vinyl (Minimize)';
      } else {
        this.bpTogglePlayer.innerHTML = upImg;
        this.bpTogglePlayer.title = 'Buka Pemutar Vinyl (Expand)';
      }
    }

    sfx.play('tab');
    state.emit('viewChanged', { viewName, params });
  }

  back() {
    if (this.historyStack.length > 1) {
      this.historyStack.pop(); // remove current
      const prev = this.historyStack.pop(); // get previous
      this.navigate(prev || 'home');
    } else {
      this.navigate('home');
    }
  }
}

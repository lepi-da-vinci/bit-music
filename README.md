# 👾 Retro Groove (Bit Music)

<div align="center">
  <img src="assets/app_icon.png" alt="Retro Groove Icon" width="160" height="160" />
  <h3>Aesthetic 8-Bit Pixel Art Music Player & Vinyl Turntable</h3>
  <p>Built with Electron, Web Audio API, and Pure Modular JavaScript</p>

  [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
  [![Electron](https://img.shields.io/badge/Electron-43.3.0-47848F?logo=electron&logoColor=white)](https://electronjs.org/)
  [![JavaScript](https://img.shields.io/badge/ES6-Modular-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
</div>

---

## ✨ Features

### 🎛️ 1. Realistic 8-Bit Vinyl Turntable
- **Physical Vinyl Playback**: Real-time rotating vinyl record, mechanical tone arm movement, and start/stop platter animation.
- **6 Dynamic Vinyl Themes**: Red, Blue, Green, Purple, Orange, and Teal themes that change ambient glows dynamically.
- **Lo-Fi Noise & Vinyl Crackle Generator**: Built-in real-time audio synthesizer for vintage vinyl crackle, warm tape saturation, and lo-fi warmth.
- **Graphic Equalizer & Spectrum Visualizer**: 3-Band retro EQ (Bass, Mid, Treble) and live 8-bit frequency spectrum visualizer.

### 🎤 2. Multi-Source Lyrics & Karaoke Synchronization
- **Multi-Engine Lyric Resolver**: Automatically fetches and synchronizes authentic lyrics from YouTube Music captions, LRCLIB, and Web Lyrics API.
- **Dual Display Modes**:
  - **Karaoke Mode**: Real-time line-by-line auto-scroll and highlight synced with playback timestamp.
  - **Reading Mode**: Clean static text view for full song lyrics.
- **Fullscreen Lyrics View**: Immersive fullscreen karaoke display with customizable font sizes (`Ctrl + L`).

### 👤 3. YouTube Music Style Artist Experience
- **Dedicated Artist Profile Pages**: Procedurally generated 8-bit pixel art avatars for every artist in your collection.
- **Quick Controls**: "Putar Semua" (Play All) and "Putar Acak" (Shuffle Play) artist discography.
- **Smart Filtering**: One-click artist navigation from LCD displays, bottom player bars, and album cards.

### 📁 4. Smart Library & Playlist Management
- **Smart Curated Albums**: Automatic categorization for top artists (The Weeknd, Shawn Mendes, Rex Orange County, Indie Rock, Shoegaze, Pop Hits).
- **Custom Playlists**: Create, rename, delete, and curate custom playlists with procedural 8-bit pixel art covers.
- **Mood Mix Chips**: Instant mood filtering (Sedih, Tidur, Bersantai, Senang, Olahraga, Fokus).
- **Favorites & History**: Heart tracks to store in "Lagu Disukai" with persistent local storage.

### 🚀 5. Performance & Desktop Integration
- **Zero-Latency Instant Startup**: Pre-indexed metadata cache renders entire music library in 0 milliseconds.
- **Global Keyboard Shortcuts & Command Palette**: Full keyboard control and `Ctrl + K` command palette.
- **OS Media Session Integration**: Native desktop media notifications and hardware multimedia key support.
- **Draggable Mini Player**: Compact floating mini player widget when navigating library or background tasks.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause |
| `Left Arrow` (`←`) | Seek Backward 5 seconds |
| `Right Arrow` (`→`) | Seek Forward 5 seconds |
| `Up Arrow` (`↑`) | Volume Up (+5%) |
| `Down Arrow` (`↓`) | Volume Down (-5%) |
| `Ctrl + N` / `N` | Next Track |
| `Ctrl + P` / `P` | Previous Track |
| `S` | Toggle Shuffle Mode |
| `R` | Toggle Repeat Mode |
| `M` | Mute / Unmute Audio |
| `Ctrl + F` / `F` | Focus Search Bar |
| `Ctrl + L` / `L` | Toggle Lyrics View |
| `Ctrl + K` | Open Command Palette |
| `F12` | Toggle Developer Tools |

---

## 📂 Project Architecture

```text
music-app/
├── assets/                  # High-res app icons, pixel UI icons & vinyl textures
│   ├── app_icon.png         # 512x512 Master Application Icon
│   ├── icons/               # 8-bit BMP UI icons
│   └── vinyl_*.png          # Color variants for vinyl records
├── lyrics/                  # Authentic synced .lrc lyric files
├── music/                   # Local audio library (.mp3, .wav, .flac)
├── src/
│   ├── core/
│   │   ├── AudioEngine.js   # Web Audio API, EQ, Lo-Fi FX, Crossfade
│   │   ├── LyricsEngine.js  # Multi-source LRC parser & online lyrics fetcher
│   │   └── StateManager.js  # Reactive state, favorites, playlists & storage
│   ├── data/
│   │   ├── builtinLyrics.js # Verified fallback lyrics dictionary
│   │   ├── preloadedTracks.js # Instant zero-latency preloaded track index
│   │   └── smartAlbumDefs.js  # Curated album patterns & mood keywords
│   └── ui/
│       ├── ComponentRenderer.js # Toast notifications, modal popups & command palette
│       ├── PixelArtGenerator.js # Procedural 16x16 pixel covers & avatars
│       ├── SFXEngine.js         # 8-bit synthesizer sound effects
│       └── ViewRouter.js        # Screen transitions (Home, Explore, Library, Player, Artist)
├── index.html               # Main application layout & DOM structure
├── style.css                # Pure Vanilla CSS design system & pixel aesthetics
├── main.js                  # Electron main process & IPC handlers
├── preload.js               # Secure ContextBridge IPC bridge
└── package.json             # App scripts and electron-builder configuration
```

---

## 🛠️ Installation & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/)

### Clone and Run
```bash
# 1. Clone the repository
git clone https://github.com/your-username/bit-music.git

# 2. Enter directory
cd bit-music

# 3. Install dependencies
npm install

# 4. Start the application
npm start
```

### Packaging & Distribution (.exe Installer)
```bash
# Build standalone Windows installer in dist/
npm run dist
```

---

## 📜 License
This project is licensed under the [ISC License](LICENSE).
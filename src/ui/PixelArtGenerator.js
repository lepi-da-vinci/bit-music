// Procedural 8-bit Pixel Art Generator for Retro Groove

const PALETTES = [
  ['#2b2b2b', '#e13c50', '#ffdc64', '#ffffff'], // Retro Groove
  ['#1a1c2c', '#5d275d', '#b13e53', '#ef7d57'], // Sunset
  ['#291814', '#743a36', '#b55945', '#ea8b54'], // Rust
  ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'], // Gameboy
  ['#181425', '#404973', '#68aed4', '#c0cbdc'], // Ice
  ['#2ce8f4', '#f038ff', '#ffeb3b', '#000000']  // Cyberpunk
];

const PLAYLIST_PALETTES = [
  { bg: '#0b1d28', border: '#043444', primary: '#00ffcc', sec: '#008877', hi: '#ffffff' }, // Teal
  { bg: '#291814', border: '#4d261b', primary: '#ffaa00', sec: '#aa5500', hi: '#ffee88' }, // Gold
  { bg: '#181425', border: '#332650', primary: '#a855f7', sec: '#6b21a8', hi: '#f3e8ff' }, // Purple
  { bg: '#0f281e', border: '#174834', primary: '#10b981', sec: '#047857', hi: '#a7f3d0' }, // Green
  { bg: '#2a1215', border: '#4d1e24', primary: '#ef4444', sec: '#b91c1c', hi: '#fca5a5' }, // Red
  { bg: '#172554', border: '#1e3a8a', primary: '#3b82f6', sec: '#1d4ed8', hi: '#93c5fd' }  // Blue
];

/**
 * Generates a procedural 16x16 symmetrical pixel album cover
 */
export function generateProceduralCover(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash);
  const size = 16;
  const cellSize = 16;
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" shape-rendering="crispEdges">';

  let seed = index;
  const random = () => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const palette = PALETTES[index % PALETTES.length];
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

/**
 * Generates an 8-bit pixel heart cover for Liked Songs
 */
export function generatePixelHeartCover() {
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
    '3': '#ffffff'  // pixel shine highlight
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

/**
 * Generates an 8-bit cassette cover for custom playlists
 */
export function generatePixelPlaylistCover(name, id) {
  const cellSize = 16;
  let hash = 0;
  const str = (id || '') + (name || 'Playlist');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash);
  const pal = PLAYLIST_PALETTES[idx % PLAYLIST_PALETTES.length];

  let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" shape-rendering="crispEdges">';
  svg += `<rect width="256" height="256" fill="${pal.bg}" />`;
  svg += `<rect x="16" y="16" width="224" height="224" fill="none" stroke="${pal.border}" stroke-width="4" />`;

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

/**
 * Generates an 8x8 symmetrical retro avatar for artists
 */
export function generateArtistPixelAvatar(artistName) {
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

/**
 * Returns dynamic theme accent colors based on a seed or vinyl color
 */
export function getThemeColor(vinylColor) {
  const map = {
    'red': { primary: '#ff3366', secondary: '#ff6b8b', rgb: '255, 51, 102' },
    'blue': { primary: '#3b82f6', secondary: '#60a5fa', rgb: '59, 130, 246' },
    'green': { primary: '#10b981', secondary: '#34d399', rgb: '16, 185, 129' },
    'purple': { primary: '#a855f7', secondary: '#c084fc', rgb: '168, 85, 247' },
    'orange': { primary: '#f97316', secondary: '#fb923c', rgb: '249, 115, 22' },
    'teal': { primary: '#00ffcc', secondary: '#38bdf8', rgb: '0, 255, 204' }
  };
  return map[vinylColor] || map['teal'];
}

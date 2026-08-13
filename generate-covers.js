const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'assets', 'covers');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const palettes = [
  ['#2b2b2b', '#e13c50', '#ffdc64', '#ffffff'], // Retro Groove
  ['#1a1c2c', '#5d275d', '#b13e53', '#ef7d57'], // Sunset
  ['#291814', '#743a36', '#b55945', '#ea8b54'], // Rust
  ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'], // Gameboy
  ['#181425', '#404973', '#68aed4', '#c0cbdc'], // Ice
  ['#2ce8f4', '#f038ff', '#ffeb3b', '#000000'], // Cyberpunk
];

function generateRetroCover(index) {
  const size = 16;
  const cellSize = 16;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">\n`;
  
  let seed = index * 1234567;
  const random = () => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  const palette = palettes[index % palettes.length];
  
  svg += `<rect width="256" height="256" fill="${palette[0]}" />\n`;
  
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size / 2; x++) {
      if (random() > 0.4) {
        const color = palette[Math.floor(random() * (palette.length - 1)) + 1];
        // left side
        svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" />\n`;
        // right side (mirrored)
        svg += `<rect x="${(size - 1 - x) * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}" />\n`;
      }
    }
  }
  
  svg += `</svg>`;
  return svg;
}

for (let i = 1; i <= 30; i++) {
  const svg = generateRetroCover(i);
  fs.writeFileSync(path.join(outDir, `cover_${i}.svg`), svg);
}

console.log('Successfully generated 30 pixel art covers!');

const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'assets', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function createBMP(pattern) {
  const width = 8;
  const height = 8;
  const headerSize = 54;
  const dataSize = width * height * 4;
  const fileSize = headerSize + dataSize;
  const buf = Buffer.alloc(fileSize);

  // BMP Header
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(headerSize, 10);

  // DIB Header
  buf.writeUInt32LE(40, 14); // Header size
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(-height, 22); // Top-down
  buf.writeUInt16LE(1, 26); // Planes
  buf.writeUInt16LE(32, 28); // 32 bpp
  buf.writeUInt32LE(0, 30); // Compression
  buf.writeUInt32LE(dataSize, 34); // Image size
  buf.writeInt32LE(2835, 38);
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);

  // Pixel Data
  let offset = 54;
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === '\n') continue;
    if (char === '#') {
      buf.writeUInt8(255, offset);     // B
      buf.writeUInt8(255, offset + 1); // G
      buf.writeUInt8(255, offset + 2); // R
      buf.writeUInt8(255, offset + 3); // A
    } else if (char === '.') {
      buf.writeUInt8(0, offset);       // B
      buf.writeUInt8(0, offset + 1);   // G
      buf.writeUInt8(0, offset + 2);   // R
      buf.writeUInt8(0, offset + 3);   // A
    } else {
      continue;
    }
    offset += 4;
  }
  return buf;
}

const icons = {
  search: `
........
..###...
.#...#..
.#...#..
.#...#..
..####..
......#.
.......#`,
  play: `
........
..##....
..###...
..####..
..####..
..###...
..##....
........`,
  pause: `
........
..##.##.
..##.##.
..##.##.
..##.##.
..##.##.
..##.##.
........`,
  prev: `
........
...#.#..
..##.##.
.###.###
.###.###
..##.##.
...#.#..
........`,
  next: `
........
..#.#...
.##.##..
###.###.
###.###.
.##.##..
..#.#...
........`,
  like: `
........
...##...
...##...
...##...
.#######
.#######
.#######
..#####.`,
  dislike: `
..#####.
.#######
.#######
.#######
...##...
...##...
...##...
........`,
  volume: `
........
....#...
...##.#.
.#.##..#
.#.##..#
...##.#.
....#...
........`,
  repeat: `
........
..####..
.#...#..
.#...#..
.#...#..
.....##.
..####..
........`,
  shuffle: `
........
......##
..##..##
...##...
........
...##...
..##..##
......##`,
  up: `
........
........
....#...
...##...
..####..
.######.
........
........`,
  down: `
........
........
.######.
..####..
...##...
....#...
........
........`,
  back: `
........
........
........
..##....
.#######
..##....
........
........`,
  edit: `
........
.....##.
....##..
...##...
..##....
........
.##.....
........`,
  share: `
.#####..
.#...#..
.#.#.##.
.#...#.#
.#####.#
..#....#
..######
........`,
  copy: `
.#####..
.#...#..
.#.#.##.
.#...#.#
.#####.#
..#....#
..######
........`,
  more: `
........
...##...
...##...
........
...##...
...##...
........
...##...`
};

for (const [name, pattern] of Object.entries(icons)) {
  const buf = createBMP(pattern.trim());
  fs.writeFileSync(path.join(outDir, `icon_${name}.bmp`), buf);
}
console.log('BMP icons created successfully! Silakan buka di Aseprite.');

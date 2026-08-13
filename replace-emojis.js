const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const replacements = {
  '🔍': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="2" y="1" width="3" height="1"/><rect x="1" y="2" width="1" height="3"/><rect x="5" y="2" width="1" height="3"/><rect x="2" y="5" width="3" height="1"/><rect x="5" y="5" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/></svg>',
  '⬅ Kembali': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="1" y="4" width="6" height="1"/><rect x="2" y="3" width="2" height="3"/><rect x="1" y="4" width="1" height="1"/></svg> Kembali',
  '⬇': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="3" y="1" width="2" height="5"/><rect x="2" y="5" width="4" height="1"/><rect x="3" y="6" width="2" height="1"/><rect x="1" y="7" width="6" height="1"/></svg>',
  '✎': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="5" y="1" width="2" height="2"/><rect x="4" y="2" width="2" height="2"/><rect x="3" y="3" width="2" height="2"/><rect x="2" y="4" width="2" height="2"/><rect x="1" y="6" width="2" height="1"/></svg>',
  '▶': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="2" y="1" width="1" height="7"/><rect x="3" y="2" width="1" height="5"/><rect x="4" y="3" width="1" height="3"/><rect x="5" y="4" width="1" height="1"/></svg>',
  '➦': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="1" y="3" width="4" height="1"/><rect x="1" y="4" width="1" height="3"/><rect x="2" y="7" width="4" height="1"/><rect x="5" y="2" width="1" height="3"/><rect x="6" y="3" width="1" height="1"/></svg>',
  '⋮': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="3" y="1" width="2" height="2"/><rect x="3" y="4" width="2" height="2"/><rect x="3" y="7" width="2" height="2"/></svg>',
  '⏮': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="1" y="2" width="1" height="5"/><rect x="2" y="4" width="1" height="1"/><rect x="3" y="3" width="1" height="3"/><rect x="4" y="2" width="1" height="5"/><rect x="5" y="4" width="1" height="1"/><rect x="6" y="3" width="1" height="3"/><rect x="7" y="2" width="1" height="5"/></svg>',
  '⏭': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="1" y="2" width="1" height="5"/><rect x="2" y="3" width="1" height="3"/><rect x="3" y="4" width="1" height="1"/><rect x="4" y="2" width="1" height="5"/><rect x="5" y="3" width="1" height="3"/><rect x="6" y="4" width="1" height="1"/><rect x="7" y="2" width="1" height="5"/></svg>',
  '👍': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="3" y="1" width="2" height="3"/><rect x="2" y="4" width="5" height="4"/><rect x="1" y="4" width="1" height="3"/></svg>',
  '👎': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="3" y="4" width="2" height="3"/><rect x="2" y="0" width="5" height="4"/><rect x="1" y="1" width="1" height="3"/></svg>',
  '🔊': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="1" y="3" width="2" height="2"/><rect x="3" y="2" width="1" height="4"/><rect x="4" y="1" width="1" height="6"/><rect x="6" y="2" width="1" height="4"/><rect x="7" y="3" width="1" height="2"/></svg>',
  '🔁': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="2" y="1" width="4" height="1"/><rect x="1" y="2" width="1" height="4"/><rect x="6" y="2" width="1" height="4"/><rect x="2" y="6" width="4" height="1"/><rect x="5" y="5" width="2" height="2"/></svg>',
  '🔀': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="1" y="2" width="2" height="1"/><rect x="3" y="3" width="2" height="2"/><rect x="5" y="5" width="2" height="1"/><rect x="1" y="5" width="2" height="1"/><rect x="5" y="2" width="2" height="1"/><rect x="6" y="1" width="2" height="2"/><rect x="6" y="5" width="2" height="2"/></svg>',
  '▲': '<svg class="pixel-icon" viewBox="0 0 8 8"><rect x="4" y="2" width="1" height="1"/><rect x="3" y="3" width="2" height="1"/><rect x="2" y="4" width="4" height="1"/><rect x="1" y="5" width="6" height="1"/></svg>'
};

for (const [key, value] of Object.entries(replacements)) {
  html = html.split(key).join(value);
}

fs.writeFileSync('index.html', html, 'utf8');

// Also update style.css to support .pixel-icon
let css = fs.readFileSync('style.css', 'utf8');
if(!css.includes('.pixel-icon')) {
  css += `\n.pixel-icon {\n  width: 1em;\n  height: 1em;\n  display: inline-block;\n  fill: currentColor;\n}\n`;
  fs.writeFileSync('style.css', css, 'utf8');
}

console.log('Replaced successfully');

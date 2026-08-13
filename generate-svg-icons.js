const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'assets', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const svgs = {
  search: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="1" width="3" height="1"/><rect x="1" y="2" width="1" height="3"/><rect x="5" y="2" width="1" height="3"/><rect x="2" y="5" width="3" height="1"/><rect x="5" y="5" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/></svg>',
  back: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="4" width="6" height="1"/><rect x="2" y="3" width="2" height="3"/><rect x="1" y="4" width="1" height="1"/></svg>',
  down: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="1" width="2" height="5"/><rect x="2" y="5" width="4" height="1"/><rect x="3" y="6" width="2" height="1"/><rect x="1" y="7" width="6" height="1"/></svg>',
  edit: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="1" width="2" height="2"/><rect x="4" y="2" width="2" height="2"/><rect x="3" y="3" width="2" height="2"/><rect x="2" y="4" width="2" height="2"/><rect x="1" y="6" width="2" height="1"/></svg>',
  play: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="1" width="1" height="7"/><rect x="3" y="2" width="1" height="5"/><rect x="4" y="3" width="1" height="3"/><rect x="5" y="4" width="1" height="1"/></svg>',
  pause: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="1" width="2" height="6"/><rect x="5" y="1" width="2" height="6"/></svg>',
  share: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="3" width="4" height="1"/><rect x="1" y="4" width="1" height="3"/><rect x="2" y="7" width="4" height="1"/><rect x="5" y="2" width="1" height="3"/><rect x="6" y="3" width="1" height="1"/></svg>',
  more: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="1" width="2" height="2"/><rect x="3" y="4" width="2" height="2"/><rect x="3" y="7" width="2" height="2"/></svg>',
  prev: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="2" width="1" height="5"/><rect x="2" y="4" width="1" height="1"/><rect x="3" y="3" width="1" height="3"/><rect x="4" y="2" width="1" height="5"/><rect x="5" y="4" width="1" height="1"/><rect x="6" y="3" width="1" height="3"/><rect x="7" y="2" width="1" height="5"/></svg>',
  next: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="2" width="1" height="5"/><rect x="2" y="3" width="1" height="3"/><rect x="3" y="4" width="1" height="1"/><rect x="4" y="2" width="1" height="5"/><rect x="5" y="3" width="1" height="3"/><rect x="6" y="4" width="1" height="1"/><rect x="7" y="2" width="1" height="5"/></svg>',
  like: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="1" width="2" height="3"/><rect x="2" y="4" width="5" height="4"/><rect x="1" y="4" width="1" height="3"/></svg>',
  dislike: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="2" height="3"/><rect x="2" y="0" width="5" height="4"/><rect x="1" y="1" width="1" height="3"/></svg>',
  volume: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="3" width="2" height="2"/><rect x="3" y="2" width="1" height="4"/><rect x="4" y="1" width="1" height="6"/><rect x="6" y="2" width="1" height="4"/><rect x="7" y="3" width="1" height="2"/></svg>',
  repeat: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="1" width="4" height="1"/><rect x="1" y="2" width="1" height="4"/><rect x="6" y="2" width="1" height="4"/><rect x="2" y="6" width="4" height="1"/><rect x="5" y="5" width="2" height="2"/></svg>',
  shuffle: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="2" width="2" height="1"/><rect x="3" y="3" width="2" height="2"/><rect x="5" y="5" width="2" height="1"/><rect x="1" y="5" width="2" height="1"/><rect x="5" y="2" width="2" height="1"/><rect x="6" y="1" width="2" height="2"/><rect x="6" y="5" width="2" height="2"/></svg>',
  up: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="2" width="1" height="1"/><rect x="3" y="3" width="2" height="1"/><rect x="2" y="4" width="4" height="1"/><rect x="1" y="5" width="6" height="1"/></svg>',
  down_arrow: '<svg viewBox="0 0 8 8" width="1em" height="1em" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="2" width="6" height="1"/><rect x="2" y="3" width="4" height="1"/><rect x="3" y="4" width="2" height="1"/><rect x="4" y="5" width="1" height="1"/></svg>'
};

for (const [name, content] of Object.entries(svgs)) {
  fs.writeFileSync(path.join(iconsDir, `icon_${name}.svg`), content, 'utf8');
}
console.log('SVGs created successfully.');

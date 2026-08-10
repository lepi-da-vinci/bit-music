const fs = require('fs');
const path = require('path');

const src1 = 'C:\\Users\\muham\\.gemini\\antigravity-ide\\brain\\d32b0767-6ff0-4cf6-a140-cabc35221915\\pixel_eq_thumb_1786376144870.png';
const src2 = 'C:\\Users\\muham\\.gemini\\antigravity-ide\\brain\\d32b0767-6ff0-4cf6-a140-cabc35221915\\pixel_switch_1786376166491.png';

const dest1 = 'd:\\Kuliah\\Projek\\music-app\\assets\\pixel_eq_thumb.png';
const dest2 = 'd:\\Kuliah\\Projek\\music-app\\assets\\pixel_switch.png';

fs.copyFileSync(src1, dest1);
fs.copyFileSync(src2, dest2);
console.log('Done!');

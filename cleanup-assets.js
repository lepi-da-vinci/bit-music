const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'assets');

// Files to delete
const filesToDelete = [
  'bg_player.png',
  'btn_33.png',
  'btn_45.png',
  'vol_knob.png',
  'vol_slider_bg.png'
];

// Folders to delete
const dirsToDelete = [
  'vinyl',
  'buttons',
  'bg'
];

console.log('🧹 Memulai pembersihan aset lama...\n');

filesToDelete.forEach(file => {
  const filePath = path.join(baseDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Berhasil menghapus file: ${file}`);
  }
});

dirsToDelete.forEach(dir => {
  const dirPath = path.join(baseDir, dir);
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✅ Berhasil menghapus folder: ${dir}`);
  }
});

console.log('\n✨ Pembersihan selesai! Folder assets Anda sekarang jauh lebih rapi.');

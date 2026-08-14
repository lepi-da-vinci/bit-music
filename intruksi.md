# Panduan Retro Groove Music Player

Selamat datang di repositori **Retro Groove Music Player**, sebuah pemutar musik desktop bergaya retro/piksel (8-bit) yang dibangun menggunakan teknologi web modern dan Electron.

Dokumen ini berisi informasi mendalam tentang struktur aplikasi, fitur, arsitektur, dan cara penggunaannya bagi pihak pengembang maupun pengguna.

---

## 1. Tentang Proyek Ini
**Retro Groove** adalah aplikasi pemutar audio lokal (mendukung MP3, WAV, OGG) dengan antarmuka yang sangat unik terinspirasi dari era gim konsol klasik.
Seluruh elemen grafis di aplikasi ini (tombol, ikon, warna, tata letak, dan *font*) dimodifikasi menjadi bentuk kotak-kotak piksel 32-bit yang kental dengan nostalgia.

---

## 2. Fitur Utama
1. **Pemutar Lokal:** Membaca semua file musik dari folder `music/` secara otomatis.
2. **Ekstraksi Metadata Otomatis:** Menggunakan pustaka `music-metadata` di sisi backend (Node.js) untuk membaca judul, artis, album, dan *cover art* (ID3 tags) langsung dari dalam file audio.
3. **Penyimpanan (*Cache*) Koleksi:** Menyimpan data metadata yang telah dipindai ke dalam `library_cache.json` agar pemuatan aplikasi selanjutnya berlangsung sekejap.
4. **Generator Aset Piksel:** Tersedia berbagai skrip khusus untuk secara otomatis memproduksi file gambar biner (.bmp) untuk ikon-ikon antarmuka UI (seperti tombol putar, ikon navigasi panel) berukuran 24x24 atau 8x8 piksel.
5. **UI Interaktif:** Tombol kontrol musik lengkap (Play, Pause, Next, Prev, Shuffle, Repeat, Like/Dislike) serta penggeser volume (*slider*).

---

## 3. Teknologi & Arsitektur
Proyek ini dikembangkan murni tanpa kerangka kerja (*framework*) tambahan yang berat seperti React atau Vue, melainkan berfokus pada kecepatan dan kesederhanaan dengan menggunakan Vanilla Javascript.

- **Frontend:**
  - `index.html` : Struktur kerangka utama aplikasi. Menggunakan sistem *multi-view* (Beranda, Eksplorasi, Koleksi).
  - `style.css` : Mengatur seluruh tata letak (*Flexbox/Grid*) serta tampilan piksel, mulai dari *hover effect* hingga pengubahan ukuran ikon. Menggunakan Google Font **Silkscreen** untuk merepresentasikan teks bergaya jadul.
  - `renderer.js` : Mengatur interaksi pengguna, logika *routing* antarmuka, *playlist* lagu, status *audio player* (`HTML5 Audio`), dan manipulasi DOM.

- **Backend (Electron):**
  - `main.js` : Menyiapkan *BrowserWindow* serta mengelola jalur komunikasi IPC (*Inter-Process Communication*) antara aplikasi antarmuka dan sistem operasi (membaca memori *disk* PC Anda).
  - `preload.js` : Jembatan penghubung yang mengekspos API Node.js secara aman (terisolasi) ke sisi Frontend melalui perintah `window.api`.

---

## 4. Struktur Direktori

```text
retro-groove/
│
├── assets/                    # Folder penampungan seluruh gambar, ikon (BMP), dan foto logo aplikasi
│   └── icons/                 # Kumpulan file ikon BMP yang dicetak oleh skrip (siap diedit di Aseprite)
├── music/                     # [PENTING] Masukkan semua koleksi file MP3/WAV/OGG Anda ke folder ini
│
├── main.js                    # Script backend Electron
├── preload.js                 # Bridge IPC (Sistem keamanan Electron)
├── renderer.js                # Script frontend (logika antarmuka UI)
├── index.html                 # Struktur markup antarmuka (DOM)
├── style.css                  # Gaya desain Retro 8-bit
│
├── generate-bmp-icons.js      # Generator ikon tombol player 8x8 piksel
├── generate-bmp-nav.js        # Generator ikon menu navigasi (Home/Explore/Library) 24x24 piksel
├── generate-covers.js         # Eksperimen sistem sampul album prosedural
│
├── library_cache.json         # File memori database (terbuat otomatis saat aplikasi diputar)
├── package.json               # Konfigurasi dependensi dan versi proyek
└── intruksi.md                # Dokumen petunjuk yang sedang Anda baca
```

---

## 5. Menjalankan Aplikasi

Jika Anda baru pertama kali mengunduh repositori ini atau ingin menjalankan aplikasi di tahap pengembangan, pastikan PC Anda sudah memiliki **Node.js**.

1. **Instalasi Dependensi**  
   Buka terminal, arahkan ke folder proyek, dan jalankan:
   ```bash
   npm install
   ```
2. **Jalankan Aplikasi**  
   Untuk meluncurkan aplikasi (mode *development*):
   ```bash
   npm start
   ```

---

## 6. Penyesuaian Aset (Modifikasi Ikon Piksel)

Proyek ini sangat ramah bagi penggemar seni piksel. Jika Anda tidak menyukai ikon UI bawaan dan ingin menggambarnya ulang, gunakan **Aseprite** (atau editor gambar lainnya).

**Langkah-langkah untuk mengubah aset:**
1. Anda bisa merender ulang *template* kanvas ikon bawaan dengan menjalankan `node generate-bmp-nav.js` atau `node generate-bmp-icons.js`.
2. Buka folder `assets/icons/`. Di sana terdapat puluhan ikon UI berformat BMP murni yang siap dilahap Aseprite (latar belakang sudah diset transparan).
3. Anda bisa mengimpor `nav_home.bmp` ke Aseprite, lalu warnai, tambahkan detail visual atau ornamen piksel apa pun.
4. Jika sudah selesai mendesain, cukup lakukan *Save* / *Export* menimpa (*overwrite*) nama file BMP yang ada.
5. Muat ulang (Refresh) aplikasi musik Anda dengan tombol `Ctrl + R`. Ikon karya Anda akan langsung termuat sempurna pada aplikasi.

---

## 7. Distribusi (*Build*) Produksi
Untuk mengekspor aplikasi ini ke format yang dapat di-instal di PC lain (misal dalam bentuk `.exe` untuk Windows), Anda bisa mengeksekusi modul *Electron Builder*:

```bash
npm run dist
```
Hasil kemasan akhir (file *installer*) akan ditemukan di dalam folder `dist/`.

---

Selamat berkreasi dan memodifikasi aplikasi musik impian Anda! 🎵👾

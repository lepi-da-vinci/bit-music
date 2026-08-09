import os
import re
import random
import json
import threading
import pygame
from mutagen.mp3 import MP3
from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3, APIC
from mutagen import File
import io
import config

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    print("Numpy not found. FFT audio visualizer will fall back to random animation.")

SETTINGS_FILE = "settings.json"
CACHE_FILE = "library_cache.json"

class AudioEngine:
    def __init__(self):
        pygame.mixer.init()
        pygame.mixer.music.set_endevent(config.TRACK_END_EVENT)
        
        self.playlist = []
        self.track_info = {}       # filepath -> {title, artist, duration, mtime, play_count}
        self.track_vinyl_colors = {}
        
        self.current_track_index = 0
        self.is_playing = False
        self.is_shuffled = False
        self.repeat_mode = 0  # 0=Off, 1=All, 2=One
        self.volume = 0.7
        self.playback_offset = 0.0
        
        self.audio_array = None
        self.sample_rate = 44100
        
        self.scan_thread = None
        self.is_scanning = False
        
        self.current_lyrics = []  # [(time_sec, text), ...]
        
        self.VINYL_NAMES = ['red', 'blue', 'green', 'purple', 'orange', 'teal']
        
        self.load_settings()
        pygame.mixer.music.set_volume(self.volume)

    # ============================================================
    #  SETTINGS PERSISTENCE
    # ============================================================
    def load_settings(self):
        try:
            with open(SETTINGS_FILE, 'r') as f:
                data = json.load(f)
            self.volume = data.get('volume', 0.7)
            self.current_track_index = data.get('last_track', 0)
            self.is_shuffled = data.get('shuffle', False)
            self.repeat_mode = data.get('repeat_mode', 0)
        except Exception:
            pass
            
    def save_settings(self):
        try:
            data = {
                'volume': self.volume,
                'last_track': self.current_track_index,
                'shuffle': self.is_shuffled,
                'repeat_mode': self.repeat_mode
            }
            with open(SETTINGS_FILE, 'w') as f:
                json.dump(data, f)
        except Exception:
            pass

    # ============================================================
    #  LIBRARY SCANNING (ASYNC)
    # ============================================================
    def scan_music_folder_async(self):
        if self.is_scanning:
            return
        self.is_scanning = True
        self.scan_thread = threading.Thread(target=self._scan_worker, daemon=True)
        self.scan_thread.start()
        
    def _scan_worker(self):
        try:
            self._scan_music_folder()
        finally:
            self.is_scanning = False
    
    def _scan_music_folder(self):
        music_dir = "music"
        if not os.path.exists(music_dir):
            os.makedirs(music_dir)
            
        # Load cache
        cached_info = {}
        try:
            with open(CACHE_FILE, 'r') as f:
                cached_info = json.load(f)
        except Exception:
            pass
            
        new_playlist = []
        new_track_info = {}
        
        for f in sorted(os.listdir(music_dir)):
            if f.lower().endswith(('.mp3', '.wav', '.ogg')):
                fp = os.path.join(music_dir, f)
                new_playlist.append(fp)
                
                mod_time = os.path.getmtime(fp)
                
                if fp in cached_info and cached_info[fp].get('mtime') == mod_time:
                    new_track_info[fp] = cached_info[fp]
                else:
                    info = self._extract_metadata(fp)
                    info['mtime'] = mod_time
                    info['play_count'] = cached_info.get(fp, {}).get('play_count', 0)
                    new_track_info[fp] = info
        
        # Save cache
        try:
            with open(CACHE_FILE, 'w') as f:
                json.dump(new_track_info, f)
        except Exception:
            pass
            
        self.playlist = new_playlist
        self.track_info = new_track_info
        
        for i in range(len(self.playlist)):
            self.track_vinyl_colors[i] = self.VINYL_NAMES[i % len(self.VINYL_NAMES)]
            
        if self.current_track_index >= len(self.playlist):
            self.current_track_index = 0

    def _extract_metadata(self, filepath):
        title = os.path.splitext(os.path.basename(filepath))[0]
        artist = "Unknown Artist"
        duration = 0
        
        try:
            audio = File(filepath)
            if audio and audio.info:
                duration = audio.info.length
        except Exception:
            try:
                snd = pygame.mixer.Sound(filepath)
                duration = snd.get_length()
            except Exception:
                pass
                
        if filepath.lower().endswith('.mp3'):
            try:
                tags = EasyID3(filepath)
                if 'title' in tags:
                    title = tags['title'][0]
                if 'artist' in tags:
                    artist = tags['artist'][0]
            except Exception:
                pass
                
        return {'title': title, 'artist': artist, 'duration': duration}

    # ============================================================
    #  TRACK INFO
    # ============================================================
    def get_track_info(self, index=None):
        if index is None:
            index = self.current_track_index
        if not self.playlist or index < 0 or index >= len(self.playlist):
            return "NO MUSIC", "Drop files in 'music'", 0
            
        filepath = self.playlist[index]
        info = self.track_info.get(filepath, {})
        title = info.get('title', os.path.splitext(os.path.basename(filepath))[0])
        artist = info.get('artist', 'Unknown Artist')
        dur = info.get('duration', 0)
        return title, artist, dur

    # ============================================================
    #  ALBUM ART EXTRACTION
    # ============================================================
    def get_album_art_surface_and_color(self, index):
        """Returns (pygame.Surface or None, dominant_color_tuple or None)"""
        if not self.playlist or index < 0 or index >= len(self.playlist):
            return None, None
            
        filepath = self.playlist[index]
        if not filepath.lower().endswith('.mp3'):
            return None, None
            
        try:
            tags = ID3(filepath)
            for tag in tags.values():
                if isinstance(tag, APIC):
                    img_data = io.BytesIO(tag.data)
                    surf = pygame.image.load(img_data)
                    
                    # Extract dominant color (average of center pixels)
                    small = pygame.transform.smoothscale(surf, (16, 16))
                    r_sum, g_sum, b_sum, count = 0, 0, 0, 0
                    for x in range(16):
                        for y in range(16):
                            c = small.get_at((x, y))
                            r_sum += c[0]; g_sum += c[1]; b_sum += c[2]
                            count += 1
                    dom_col = (r_sum // count, g_sum // count, b_sum // count) if count > 0 else None
                    
                    return surf, dom_col
        except Exception:
            pass
        return None, None

    # ============================================================
    #  AUDIO ARRAY EXTRACTION (for FFT visualizer)
    # ============================================================
    def _extract_audio_array(self, filepath):
        self.audio_array = None
        if not NUMPY_AVAILABLE:
            return
        try:
            snd = pygame.mixer.Sound(filepath)
            arr = pygame.sndarray.array(snd)
            if len(arr.shape) > 1 and arr.shape[1] > 0:
                arr = arr[:, 0]
            self.audio_array = arr
            init_info = pygame.mixer.get_init()
            if init_info:
                self.sample_rate = init_info[0]
        except Exception as e:
            print(f"Gagal mengekstrak audio array untuk {filepath}: {e}")
            self.audio_array = None

    # ============================================================
    #  LRC LYRICS
    # ============================================================
    def _load_lyrics(self, filepath):
        self.current_lyrics = []
        lrc_path = os.path.splitext(filepath)[0] + ".lrc"
        if os.path.exists(lrc_path):
            try:
                with open(lrc_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        match = re.search(r'\[(\d+):(\d+(?:\.\d+)?)\](.*)', line)
                        if match:
                            m = int(match.group(1))
                            s = float(match.group(2))
                            text = match.group(3).strip()
                            self.current_lyrics.append((m * 60 + s, text))
            except Exception:
                pass
                
    def get_current_lyric(self):
        if not self.current_lyrics:
            return None
        pos = self.get_playback_pos()
        current_text = None
        for time_sec, text in self.current_lyrics:
            if pos >= time_sec:
                current_text = text
            else:
                break
        return current_text

    # ============================================================
    #  PLAYBACK CONTROL
    # ============================================================
    def load_and_play(self, skip_count=0, fade_ms=0):
        if not self.playlist or skip_count >= len(self.playlist):
            self.is_playing = False
            return False
        try:
            filepath = self.playlist[self.current_track_index]
            
            # Disable end event temporarily so fadeout/stop doesn't trigger it
            pygame.mixer.music.set_endevent()
            
            # Crossfade: fade out current track if playing
            if fade_ms > 0 and pygame.mixer.music.get_busy():
                pygame.mixer.music.fadeout(fade_ms)
                pygame.time.wait(fade_ms)
            else:
                pygame.mixer.music.stop()
            
            pygame.mixer.music.load(filepath)
            pygame.mixer.music.play()
            
            # Re-enable end event and clear any accidental triggers from queue
            pygame.mixer.music.set_endevent(config.TRACK_END_EVENT)
            pygame.event.clear(config.TRACK_END_EVENT)
            self.playback_offset = 0.0
            self.is_playing = True
            
            # Extract audio array in background thread
            t = threading.Thread(target=self._extract_audio_array, args=(filepath,), daemon=True)
            t.start()
            
            # Load lyrics
            self._load_lyrics(filepath)
            
            # Increment play count
            if filepath in self.track_info:
                self.track_info[filepath]['play_count'] = self.track_info[filepath].get('play_count', 0) + 1
                try:
                    with open(CACHE_FILE, 'w') as f:
                        json.dump(self.track_info, f)
                except Exception:
                    pass
            
            self.save_settings()
            return True
        except Exception as e:
            print(f"Error playing track: {e}")
            self.current_track_index = (self.current_track_index + 1) % len(self.playlist)
            return self.load_and_play(skip_count + 1, fade_ms=0)
            
    def play_next(self, crossfade=True):
        if not self.playlist: return False
        if self.repeat_mode == 2:
            pass  # repeat one — keep same index
        elif self.is_shuffled:
            self.current_track_index = random.randint(0, len(self.playlist) - 1)
        else:
            self.current_track_index = (self.current_track_index + 1) % len(self.playlist)
        return self.load_and_play(fade_ms=800 if crossfade else 0)
        
    def play_prev(self):
        if not self.playlist: return False
        self.current_track_index = (self.current_track_index - 1) % len(self.playlist)
        return self.load_and_play(fade_ms=800)
        
    def toggle_play_pause(self):
        if not self.playlist: return
        if self.is_playing:
            pygame.mixer.music.pause()
            self.is_playing = False
        else:
            if pygame.mixer.music.get_pos() > 0:
                pygame.mixer.music.unpause()
            else:
                self.load_and_play()
            self.is_playing = True
            
    def play_track(self, index):
        if not self.playlist or index < 0 or index >= len(self.playlist): return False
        self.current_track_index = index
        return self.load_and_play(fade_ms=800)
        
    def get_playback_pos(self):
        pos = pygame.mixer.music.get_pos()
        if pos == -1: return 0
        return self.playback_offset + (pos / 1000.0)
        
    def seek(self, target_time):
        pygame.mixer.music.play(start=target_time)
        self.playback_offset = target_time
        
    def set_volume(self, vol):
        self.volume = max(0.0, min(1.0, vol))
        pygame.mixer.music.set_volume(self.volume)
        self.save_settings()
        
    def cycle_repeat(self):
        self.repeat_mode = (self.repeat_mode + 1) % 3
        self.save_settings()
        
    def toggle_shuffle(self):
        self.is_shuffled = not self.is_shuffled
        self.save_settings()

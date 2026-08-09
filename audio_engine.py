import os
import random
import pygame
from mutagen.mp3 import MP3
from mutagen.easyid3 import EasyID3
from mutagen import File
import config

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    print("Numpy not found. FFT audio visualizer will fall back to random animation.")

class AudioEngine:
    def __init__(self):
        pygame.mixer.init()
        pygame.mixer.music.set_endevent(config.TRACK_END_EVENT)
        
        self.playlist = []
        self.track_durations = {}
        self.track_vinyl_colors = {}
        
        self.current_track_index = 0
        self.is_playing = False
        self.is_shuffled = False
        self.repeat_mode = 0  # 0=Off, 1=All, 2=One
        self.volume = 0.7
        self.playback_offset = 0.0
        
        # Array audio untuk FFT
        self.audio_array = None
        self.sample_rate = 44100
        
        pygame.mixer.music.set_volume(self.volume)
        
        self.VINYL_NAMES = ['red', 'blue', 'green', 'purple', 'orange', 'teal']
        
    def scan_music_folder(self):
        self.playlist = []
        self.track_durations = {}
        self.track_vinyl_colors = {}
        music_dir = "music"
        if not os.path.exists(music_dir):
            os.makedirs(music_dir)
            
        for f in os.listdir(music_dir):
            if f.lower().endswith(('.mp3', '.wav', '.ogg')):
                fp = os.path.join(music_dir, f)
                self.playlist.append(fp)
                try:
                    audio = File(fp)
                    if audio is not None and audio.info is not None:
                        self.track_durations[fp] = audio.info.length
                    else:
                        snd = pygame.mixer.Sound(fp)
                        self.track_durations[fp] = snd.get_length()
                except Exception:
                    try:
                        snd = pygame.mixer.Sound(fp)
                        self.track_durations[fp] = snd.get_length()
                    except Exception:
                        self.track_durations[fp] = 0
        self.playlist.sort()
        for i in range(len(self.playlist)):
            self.track_vinyl_colors[i] = self.VINYL_NAMES[i % len(self.VINYL_NAMES)]
            
    def get_track_info(self, index=None):
        if index is None:
            index = self.current_track_index
        if not self.playlist or index < 0 or index >= len(self.playlist):
            return "NO MUSIC", "Drop files in 'music'", 0
            
        filepath = self.playlist[index]
        filename = os.path.basename(filepath)
        title = os.path.splitext(filename)[0]
        artist = "Unknown Artist"
        if filepath.lower().endswith('.mp3'):
            try:
                audio = EasyID3(filepath)
                if 'title' in audio:
                    title = audio['title'][0]
                if 'artist' in audio:
                    artist = audio['artist'][0]
            except Exception:
                pass
        dur = self.track_durations.get(filepath, 0)
        return title, artist, dur
        
    def _extract_audio_array(self, filepath):
        self.audio_array = None
        if not NUMPY_AVAILABLE:
            return
        
        try:
            # Muat file ke memori untuk diekstrak array-nya
            # (Hanya direkomendasikan untuk file yang muat di RAM)
            snd = pygame.mixer.Sound(filepath)
            arr = pygame.sndarray.array(snd)
            
            # Jika stereo (2 channel), ambil rata-rata atau channel kiri
            if len(arr.shape) > 1 and arr.shape[1] > 0:
                arr = arr[:, 0]
                
            self.audio_array = arr
            # Ambil sample rate aktual dari mixer
            init_info = pygame.mixer.get_init()
            if init_info:
                self.sample_rate = init_info[0]
                
        except Exception as e:
            print(f"Gagal mengekstrak audio array untuk {filepath}: {e}")
            self.audio_array = None

    def load_and_play(self, skip_count=0):
        if not self.playlist or skip_count >= len(self.playlist):
            self.is_playing = False
            return False
        try:
            filepath = self.playlist[self.current_track_index]
            pygame.mixer.music.load(filepath)
            pygame.mixer.music.play()
            self.playback_offset = 0.0
            self.is_playing = True
            
            # Ekstrak array untuk visualizer
            self._extract_audio_array(filepath)
            
            return True
        except Exception as e:
            print(f"Error playing track: {e}")
            self.current_track_index = (self.current_track_index + 1) % len(self.playlist)
            return self.load_and_play(skip_count + 1)
            
    def play_next(self):
        if not self.playlist: return False
        old_idx = self.current_track_index
        if self.repeat_mode == 2:
            pass
        elif self.is_shuffled:
            self.current_track_index = random.randint(0, len(self.playlist) - 1)
        else:
            self.current_track_index = (self.current_track_index + 1) % len(self.playlist)
        return self.load_and_play()
        
    def play_prev(self):
        if not self.playlist: return False
        self.current_track_index = (self.current_track_index - 1) % len(self.playlist)
        return self.load_and_play()
        
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
        return self.load_and_play()
        
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
        
    def cycle_repeat(self):
        self.repeat_mode = (self.repeat_mode + 1) % 3
        
    def toggle_shuffle(self):
        self.is_shuffled = not self.is_shuffled

import pygame
import os
import shutil
import time
import random
import math
import config
from audio_engine import AudioEngine
from ui_elements import Button, VolumeSlider, LCDDisplay, ParticleSystem
from turntable import Turntable

class App:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((config.WINDOW_WIDTH, config.WINDOW_HEIGHT))
        self.display_surface = pygame.Surface((config.BASE_W, config.BASE_H))
        pygame.display.set_caption("Retro Groove Music Player - Ultimate Edition")
        self.clock = pygame.time.Clock()
        self.running = True
        
        # Screensaver state
        self.last_interaction_time = time.time()
        self.screensaver_alpha = 255.0
        
        # Search state
        self.search_query = ""
        self.is_searching = False
        self.filtered_indices = []
        
        # Adaptive theme state
        self.target_bg_color = config.COL_BG
        self.current_bg_color = list(config.COL_BG)
        self.target_particle_color = (255, 255, 255)
        self.current_particle_color = [255, 255, 255]
        
        self._load_assets()
        self._init_systems()
        
    def _load_img(self, path):
        if os.path.exists(path):
            return pygame.image.load(path).convert_alpha()
        return pygame.Surface((10, 10), pygame.SRCALPHA)
        
    def _load_assets(self):
        self.img_bg = self._load_img("assets/bg/bg_player.png")
        self.img_empty_platter = self._load_img("assets/bg/empty_platter.png")
        self.img_tone_arm = self._load_img("assets/bg/tone_arm.png")
        
        self.img_start_stop = self._load_img("assets/buttons/btn_start_stop.png")
        self.img_start_stop_active = self._load_img("assets/buttons/btn_start_stop_active.png")
        self.img_prev = self._load_img("assets/buttons/btn_prev.png")
        self.img_next = self._load_img("assets/buttons/btn_next.png")
        self.img_shuffle = self._load_img("assets/buttons/btn_shuffle.png")
        self.img_vol_knob = self._load_img("assets/buttons/vol_knob.png")
        self.img_33 = self._load_img("assets/buttons/btn_33.png")
        self.img_45 = self._load_img("assets/buttons/btn_45.png")
        
        if os.path.exists("assets/buttons/btn_repeat.png"):
            self.img_repeat = self._load_img("assets/buttons/btn_repeat.png")
        else:
            self.img_repeat = self.img_shuffle
            
        self.vinyl_images = {}
        for vn in ['red', 'blue', 'green', 'purple', 'orange', 'teal']:
            self.vinyl_images[vn] = self._load_img(f"assets/vinyl/vinyl_{vn}.png")

    def _init_systems(self):
        self.audio = AudioEngine()
        self.audio.scan_music_folder_async()
        
        self.turntable = Turntable(self.vinyl_images, self.img_tone_arm)
        self.particles = ParticleSystem(pygame.Rect(0, 0, config.BASE_W, config.BASE_H), count=40)
        self.lcd = LCDDisplay(config.PL_X, config.PL_Y, config.PL_W, 45)
        
        # Buttons — EXACT SAME coordinates as original
        self.btn_play = Button(pygame.Rect(config.T_X + 15, config.T_Y + 295, 50, 32), self.img_start_stop, self.img_start_stop_active)
        self.btn_prev = Button(pygame.Rect(config.T_X + 80, config.T_Y + 302, 18, 18), self.img_prev)
        self.btn_shuffle = Button(pygame.Rect(config.T_X + 104, config.T_Y + 302, 18, 18), self.img_shuffle)
        self.btn_repeat = Button(pygame.Rect(config.T_X + 128, config.T_Y + 302, 18, 18), self.img_repeat)
        self.btn_next = Button(pygame.Rect(config.T_X + 152, config.T_Y + 302, 18, 18), self.img_next)
        
        self.vol_slider = VolumeSlider(config.T_X + 325, config.T_Y + 135, 26, 120, self.img_vol_knob)
        
        # Scroll state
        self.dragging_progress = False
        self.playlist_scroll_offset = 0.0
        self.scroll_target = 0.0
        self.scroll_velocity = 0.0
        self.playlist_hover_index = -1
        
        # Try to load album art for initial track
        self._update_album_art_and_theme(self.audio.current_track_index)

    def _update_album_art_and_theme(self, idx):
        """Load album art + update adaptive theme colors for the given track."""
        art, dom_col = self.audio.get_album_art_surface_and_color(idx)
        if self.audio.playlist and 0 <= idx < len(self.audio.playlist):
            fp = self.audio.playlist[idx]
            self.turntable.set_album_art(fp, art)
            if dom_col:
                # Darken dominant color for background (keep it subtle)
                self.target_bg_color = (
                    min(50, max(15, int(dom_col[0] * 0.15))),
                    min(55, max(18, int(dom_col[1] * 0.18))),
                    min(65, max(25, int(dom_col[2] * 0.2)))
                )
                self.target_particle_color = dom_col[:3]
            else:
                self.target_bg_color = config.COL_BG
                self.target_particle_color = (255, 255, 255)

    def _change_track(self, change_func, *args):
        """Helper: capture old vinyl state, call change_func, trigger swap animation."""
        old_idx = self.audio.current_track_index
        old_c = self.audio.track_vinyl_colors.get(old_idx, 'red')
        old_fp = self.audio.playlist[old_idx] if self.audio.playlist else None
        old_art = self.turntable.album_art_cache.get(old_fp)
        
        res = change_func(*args)
        
        if res and self.audio.playlist:
            new_idx = self.audio.current_track_index
            new_c = self.audio.track_vinyl_colors.get(new_idx, 'red')
            new_fp = self.audio.playlist[new_idx]
            
            self._update_album_art_and_theme(new_idx)
            new_art = self.turntable.album_art_cache.get(new_fp)
            
            self.turntable.trigger_swap(old_c, new_c, old_art, new_art)

    def _interact(self):
        self.last_interaction_time = time.time()
        self.screensaver_alpha = 255.0

    def _format_time(self, seconds):
        if seconds <= 0: return "0:00"
        m = int(seconds) // 60
        s = int(seconds) % 60
        return f"{m}:{s:02d}"

    # ================================================================
    #  EVENT HANDLING
    # ================================================================
    def _handle_events(self):
        self.raw_mouse = pygame.mouse.get_pos()
        self.mouse_pos = (self.raw_mouse[0] // 2, self.raw_mouse[1] // 2)
        
        # Update filtered indices for search
        if self.is_searching and self.search_query:
            self.filtered_indices = []
            for i, fp in enumerate(self.audio.playlist):
                info = self.audio.track_info.get(fp, {})
                t = info.get('title', '').lower()
                a = info.get('artist', '').lower()
                q = self.search_query.lower()
                if q in t or q in a:
                    self.filtered_indices.append(i)
        else:
            self.filtered_indices = list(range(len(self.audio.playlist)))
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
                
            elif event.type == config.TRACK_END_EVENT:
                if self.audio.is_playing:
                    if self.audio.repeat_mode == 0 and self.audio.current_track_index == len(self.audio.playlist) - 1:
                        # Auto-DJ: instead of stopping, play a random track
                        next_idx = random.randint(0, len(self.audio.playlist) - 1)
                        self._change_track(self.audio.play_track, next_idx)
                    else:
                        self._change_track(self.audio.play_next, False)
                        
            elif event.type == pygame.DROPFILE:
                self._interact()
                file_path = event.file
                if file_path.lower().endswith(('.mp3', '.wav', '.ogg')):
                    music_dir = "music"
                    if not os.path.exists(music_dir):
                        os.makedirs(music_dir)
                    dest = os.path.join(music_dir, os.path.basename(file_path))
                    try:
                        shutil.copy2(file_path, dest)
                        if not self.audio.is_scanning:
                            self.audio.scan_music_folder_async()
                    except Exception:
                        pass
                        
            elif event.type == pygame.KEYDOWN:
                self._interact()
                if self.is_searching:
                    if event.key == pygame.K_ESCAPE:
                        self.is_searching = False
                        self.search_query = ""
                    elif event.key == pygame.K_BACKSPACE:
                        self.search_query = self.search_query[:-1]
                    elif event.key == pygame.K_RETURN:
                        if self.filtered_indices:
                            self._change_track(self.audio.play_track, self.filtered_indices[0])
                        self.is_searching = False
                        self.search_query = ""
                    elif event.unicode.isprintable():
                        self.search_query += event.unicode
                else:
                    if event.key == pygame.K_SPACE:
                        if not self.audio.is_playing and self.audio.playlist:
                            self._update_album_art_and_theme(self.audio.current_track_index)
                        self.audio.toggle_play_pause()
                    elif event.key == pygame.K_RIGHT:
                        self._change_track(self.audio.play_next)
                    elif event.key == pygame.K_LEFT:
                        self._change_track(self.audio.play_prev)
                    elif event.key == pygame.K_UP:
                        self.audio.set_volume(self.audio.volume + 0.05)
                    elif event.key == pygame.K_DOWN:
                        self.audio.set_volume(self.audio.volume - 0.05)
                    elif event.key == pygame.K_r:
                        self.audio.cycle_repeat()
                    elif event.key == pygame.K_s:
                        self.audio.toggle_shuffle()
                    elif event.key == pygame.K_SLASH or (event.key == pygame.K_f and (pygame.key.get_mods() & pygame.KMOD_CTRL)):
                        # Type-to-search: only trigger on '/' or Ctrl+F
                        self.is_searching = True
                        self.search_query = ""
                    
            elif event.type == pygame.MOUSEBUTTONDOWN:
                self._interact()
                if event.button == 1:
                    # Cancel search if clicking anywhere
                    if self.is_searching:
                        self.is_searching = False
                        self.search_query = ""
                        
                    pos = self.mouse_pos
                    
                    # Progress Bar
                    if config.PROG_X - 5 <= pos[0] <= config.PROG_X + config.PROG_W + 5 and config.PROG_Y - 10 <= pos[1] <= config.PROG_Y + config.PROG_H + 10:
                        if self.audio.playlist and self.audio.is_playing:
                            self.dragging_progress = True
                            _, _, dur = self.audio.get_track_info()
                            if dur > 0:
                                rel_x = max(0, min(pos[0] - config.PROG_X, config.PROG_W))
                                self.audio.seek((rel_x / config.PROG_W) * dur)
                                
                    # Volume
                    elif self.vol_slider.rect.collidepoint(pos):
                        self.vol_slider.is_dragging = True
                        self.audio.set_volume(1.0 - max(0.0, min(1.0, (pos[1] - self.vol_slider.rect.y) / self.vol_slider.rect.h)))
                        
                    # Buttons
                    elif self.btn_play.rect.collidepoint(pos):
                        self.btn_play.is_pressed = True
                        if not self.audio.is_playing and self.audio.playlist:
                            self._update_album_art_and_theme(self.audio.current_track_index)
                        self.audio.toggle_play_pause()
                    elif self.btn_prev.rect.collidepoint(pos):
                        self.btn_prev.is_pressed = True
                        self._change_track(self.audio.play_prev)
                    elif self.btn_next.rect.collidepoint(pos):
                        self.btn_next.is_pressed = True
                        self._change_track(self.audio.play_next)
                    elif self.btn_shuffle.rect.collidepoint(pos):
                        self.btn_shuffle.is_pressed = True
                        self.audio.toggle_shuffle()
                    elif self.btn_repeat.rect.collidepoint(pos):
                        self.btn_repeat.is_pressed = True
                        self.audio.cycle_repeat()
                        
                    # Playlist click
                    elif config.PL_X <= pos[0] <= config.PL_X + config.PL_W and config.PL_VIEW_Y <= pos[1] <= config.PL_VIEW_Y + config.PL_VIEW_H:
                        rel_y = pos[1] - config.PL_VIEW_Y + self.playlist_scroll_offset
                        idx = int(rel_y // config.PL_ITEM_H)
                        if 0 <= idx < len(self.filtered_indices):
                            real_idx = self.filtered_indices[idx]
                            self._change_track(self.audio.play_track, real_idx)
                        
                # Scroll
                if event.button == 4:
                    self.scroll_velocity -= 40
                elif event.button == 5:
                    self.scroll_velocity += 40
                    
            elif event.type == pygame.MOUSEBUTTONUP:
                if event.button == 1:
                    self.dragging_progress = False
                    self.vol_slider.is_dragging = False
                    for btn in [self.btn_play, self.btn_prev, self.btn_next, self.btn_shuffle, self.btn_repeat]:
                        btn.is_pressed = False
                        
            elif event.type == pygame.MOUSEMOTION:
                self._interact()
                if self.vol_slider.is_dragging:
                    self.audio.set_volume(1.0 - max(0.0, min(1.0, (self.mouse_pos[1] - self.vol_slider.rect.y) / self.vol_slider.rect.h)))
                if self.dragging_progress and self.audio.playlist and self.audio.is_playing:
                    _, _, dur = self.audio.get_track_info()
                    if dur > 0:
                        rel_x = max(0, min(self.mouse_pos[0] - config.PROG_X, config.PROG_W))
                        self.audio.seek((rel_x / config.PROG_W) * dur)

    # ================================================================
    #  UPDATE
    # ================================================================
    def _update(self, dt):
        # Adaptive theme color interpolation
        for i in range(3):
            self.current_bg_color[i] += (self.target_bg_color[i] - self.current_bg_color[i]) * 0.02 * dt
            self.current_particle_color[i] += (self.target_particle_color[i] - self.current_particle_color[i]) * 0.02 * dt
        
        # Screensaver fade
        idle_time = time.time() - self.last_interaction_time
        if idle_time > 30:
            self.screensaver_alpha = max(0.0, self.screensaver_alpha - 3.0 * dt)
        else:
            self.screensaver_alpha = min(255.0, self.screensaver_alpha + 15.0 * dt)
        
        # Momentum scrolling
        if self.audio.playlist:
            th = len(self.filtered_indices) * config.PL_ITEM_H
            max_scroll = max(0, th - config.PL_VIEW_H)
            self.scroll_velocity *= 0.85
            self.scroll_target += self.scroll_velocity * dt
            self.scroll_target = max(0, min(self.scroll_target, max_scroll))
            diff = self.scroll_target - self.playlist_scroll_offset
            if abs(diff) > 0.5:
                self.playlist_scroll_offset += diff * 0.2 * dt
            else:
                self.playlist_scroll_offset = self.scroll_target

        _, _, dur = self.audio.get_track_info()
        progress_ratio = min(1.0, self.audio.get_playback_pos() / dur) if dur > 0 else 0
        
        self.turntable.update(dt, self.audio.is_playing, progress_ratio)
        self.particles.update(dt)
        self.lcd.update(dt, self.audio.is_playing, audio_engine=self.audio)
        
        self.playlist_hover_index = -1
        if config.PL_X <= self.mouse_pos[0] <= config.PL_X + config.PL_W and config.PL_VIEW_Y <= self.mouse_pos[1] <= config.PL_VIEW_Y + config.PL_VIEW_H:
            rel_y = self.mouse_pos[1] - config.PL_VIEW_Y + self.playlist_scroll_offset
            h_idx = int(rel_y // config.PL_ITEM_H)
            if 0 <= h_idx < len(self.filtered_indices):
                self.playlist_hover_index = h_idx

    # ================================================================
    #  RENDER
    # ================================================================
    def _render(self):
        # Background with adaptive color
        self.display_surface.fill(tuple(int(c) for c in self.current_bg_color))
        self.display_surface.blit(self.img_bg, (0, 0))
        self.particles.draw(self.display_surface, base_color=tuple(int(c) for c in self.current_particle_color))
        
        # Platter & Turntable
        platter_rect = self.img_empty_platter.get_rect(center=self.turntable.vinyl_center)
        self.display_surface.blit(self.img_empty_platter, platter_rect.topleft)
        
        curr_color = self.audio.track_vinyl_colors.get(self.audio.current_track_index, 'red')
        is_busy = pygame.mixer.music.get_busy() and len(self.audio.playlist) > 0
        self.turntable.draw(self.display_surface, curr_color, self.audio.is_playing, is_busy, bass_pulse=self.lcd.bass_pulse)
        
        # --- UI Layer (affected by screensaver fade) ---
        ui_surface = pygame.Surface((config.BASE_W, config.BASE_H), pygame.SRCALPHA)
        
        self.vol_slider.draw(ui_surface, self.audio.volume)
        
        self.btn_play.draw(ui_surface, self.audio.is_playing)
        self.btn_prev.draw(ui_surface)
        self.btn_next.draw(ui_surface)
        self.btn_shuffle.draw(ui_surface)
        self.btn_repeat.draw(ui_surface)
        
        ui_surface.blit(self.img_33, (config.T_X + 268, config.T_Y + 308))
        ui_surface.blit(self.img_45, (config.T_X + 298, config.T_Y + 308))
        
        if self.audio.is_shuffled:
            pygame.draw.rect(ui_surface, config.COL_TEXT_GREEN, (self.btn_shuffle.rect.x + 5, self.btn_shuffle.rect.bottom + 2, 8, 2))
        if self.audio.repeat_mode == 1:
            pygame.draw.rect(ui_surface, config.COL_ACCENT_BLUE, (self.btn_repeat.rect.x + 5, self.btn_repeat.rect.bottom + 2, 8, 2))
        elif self.audio.repeat_mode == 2:
            pygame.draw.rect(ui_surface, config.COL_TEXT_YELLOW, (self.btn_repeat.rect.x + 5, self.btn_repeat.rect.bottom + 2, 8, 2))
            one_surf = config.font_vol.render("1", False, config.COL_TEXT_YELLOW)
            ui_surface.blit(one_surf, (self.btn_repeat.rect.x + 6, self.btn_repeat.rect.y - 8))
            
        # LCD Display with lyrics & search
        t_title, t_artist, _ = self.audio.get_track_info()
        time_str = self._format_time(self.audio.get_playback_pos())
        lyric = self.audio.get_current_lyric()
        self.lcd.draw(ui_surface, t_title, t_artist, time_str, self.audio.is_playing,
                      search_query=self.search_query if self.is_searching else "",
                      lyric_text=lyric)

        # Playlist Panel
        clip_rect = pygame.Rect(config.PL_X, config.PL_VIEW_Y, config.PL_W, config.PL_VIEW_H)
        ui_surface.set_clip(clip_rect)
        
        if self.audio.is_scanning and not self.audio.playlist:
            loading = config.font_item.render("Loading...", False, config.COL_TEXT_DIM)
            ui_surface.blit(loading, (config.PL_X + 20, config.PL_VIEW_Y + 20))
        
        for list_i, real_idx in enumerate(self.filtered_indices):
            item_y = config.PL_VIEW_Y + list_i * config.PL_ITEM_H - self.playlist_scroll_offset
            if item_y + config.PL_ITEM_H < config.PL_VIEW_Y or item_y > config.PL_VIEW_Y + config.PL_VIEW_H:
                continue
                
            irect = pygame.Rect(config.PL_X, item_y, config.PL_W, config.PL_ITEM_H - 2)
            
            if real_idx == self.audio.current_track_index and is_busy:
                pygame.draw.rect(ui_surface, config.COL_PANEL_ACTIVE, irect)
                pygame.draw.rect(ui_surface, config.COL_HIGHLIGHT, (irect.x, irect.y, 2, irect.h))
            elif list_i == self.playlist_hover_index:
                pygame.draw.rect(ui_surface, config.COL_PANEL_HOVER, irect)
            else:
                pygame.draw.rect(ui_surface, config.COL_PANEL_ITEM, irect)
                
            v_col_name = self.audio.track_vinyl_colors.get(real_idx, 'red')
            v_map = {'red': (225,65,85), 'blue': (50,120,210), 'green': (60,180,80),
                     'purple': (150,60,180), 'orange': (240,140,40), 'teal': (40,170,160)}
            pygame.draw.rect(ui_surface, v_map.get(v_col_name, (200,200,200)), (irect.x + 6, irect.y + 6, 6, 6))
            
            p_title, p_artist, p_dur = self.audio.get_track_info(real_idx)
            
            # Play count / favorite coloring
            fp = self.audio.playlist[real_idx]
            play_count = self.audio.track_info.get(fp, {}).get('play_count', 0)
            
            if real_idx == self.audio.current_track_index:
                col_t = config.COL_TEXT_YELLOW
            elif play_count > 3:
                col_t = config.COL_GOLD  # Favorite
            else:
                col_t = config.COL_TEXT
            
            ui_surface.blit(config.font_item.render(p_title[:22], False, col_t), (irect.x + 16, irect.y + 3))
            ui_surface.blit(config.font_item_sm.render(p_artist[:28], False, config.COL_TEXT_DIM), (irect.x + 16, irect.y + 14))
            if p_dur > 0:
                dur_surf = config.font_item_sm.render(self._format_time(p_dur), False, config.COL_TEXT_DIM)
                ui_surface.blit(dur_surf, (irect.right - dur_surf.get_width() - 6, irect.y + 3))
                
        ui_surface.set_clip(None)
        
        # Progress Bar
        _, _, dur = self.audio.get_track_info()
        progress_ratio = min(1.0, self.audio.get_playback_pos() / dur) if dur > 0 else 0
        pygame.draw.rect(ui_surface, config.COL_PROGRESS_BG, (config.PROG_X, config.PROG_Y, config.PROG_W, config.PROG_H), border_radius=2)
        if progress_ratio > 0:
            fill_w = max(1, int(config.PROG_W * progress_ratio))
            pygame.draw.rect(ui_surface, config.COL_PROGRESS_FILL, (config.PROG_X, config.PROG_Y, fill_w, config.PROG_H), border_radius=2)
            thumb_x = config.PROG_X + fill_w - 3
            pygame.draw.rect(ui_surface, (255, 255, 255), (thumb_x, config.PROG_Y - 2, 5, config.PROG_H + 4), border_radius=1)
            
        t_cur_surf = config.font_time.render(time_str, False, config.COL_TEXT_DIM)
        t_dur_surf = config.font_time.render(self._format_time(dur), False, config.COL_TEXT_DIM)
        ui_surface.blit(t_cur_surf, (config.PROG_X, config.PROG_Y - 11))
        ui_surface.blit(t_dur_surf, (config.PROG_X + config.PROG_W - t_dur_surf.get_width(), config.PROG_Y - 11))
        
        # Scrollbar
        if self.audio.playlist:
            th = len(self.filtered_indices) * config.PL_ITEM_H
            max_scroll = max(0, th - config.PL_VIEW_H)
            if max_scroll > 0:
                sh = max(12, int(config.PL_VIEW_H * (config.PL_VIEW_H / th)))
                sy = config.PL_VIEW_Y + int((config.PL_VIEW_H - sh) * (self.playlist_scroll_offset / max_scroll))
                pygame.draw.rect(ui_surface, (30, 34, 42), (config.PL_X + config.PL_W - 5, config.PL_VIEW_Y, 3, config.PL_VIEW_H), border_radius=1)
                pygame.draw.rect(ui_surface, (90, 95, 110), (config.PL_X + config.PL_W - 5, sy, 3, sh), border_radius=1)
        
        # Screensaver: fade UI layer
        if self.screensaver_alpha < 255:
            ui_surface.set_alpha(int(self.screensaver_alpha))
        self.display_surface.blit(ui_surface, (0, 0))
        
        # UPSCALE
        scaled_screen = pygame.transform.scale(self.display_surface, (config.WINDOW_WIDTH, config.WINDOW_HEIGHT))
        self.screen.blit(scaled_screen, (0, 0))
        pygame.display.flip()

    # ================================================================
    #  MAIN LOOP
    # ================================================================
    def run(self):
        while self.running:
            dt = max(self.clock.get_time(), 1) / 16.67
            self._handle_events()
            self._update(dt)
            self._render()
            self.clock.tick(config.FPS)
        pygame.quit()

if __name__ == "__main__":
    app = App()
    app.run()

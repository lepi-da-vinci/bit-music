import pygame
import os
import shutil
import time
import random
import math
import config
from audio_engine import AudioEngine
from ui_elements import Button, VolumeSlider, LCDDisplay, ParticleSystem, AlbumGrid
from turntable import Turntable

class App:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((config.WINDOW_WIDTH, config.WINDOW_HEIGHT), pygame.RESIZABLE)
        self.display_surface = pygame.Surface((config.BASE_W, config.BASE_H))
        pygame.display.set_caption("Retro Groove Music Player - Ultimate Edition")
        self.clock = pygame.time.Clock()
        self.running = True
        
        # Screensaver state
        self.last_interaction_time = time.time()
        self.screensaver_alpha = 255.0
        
        # Search & Album state
        self.search_query = ""
        self.is_searching = False
        self.filtered_indices = []
        
        self.view_state = 0 # 0: Home, 1: Album, 2: Player
        self.selected_album = None
        self.hover_album = None
        
        # Panel X positions for animation
        self.album_x = 300
        self.target_album_x = 300
        self.track_x = 800
        self.target_track_x = 800
        self.player_x = 800
        self.target_player_x = 800
        
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
        # Programmatic Turntable removes the need for static background assets
        
        self.img_start_stop = self._load_img("assets/buttons/btn_start_stop.png")
        self.img_start_stop_active = self._load_img("assets/buttons/btn_start_stop_active.png")
        self.img_prev = self._load_img("assets/buttons/btn_prev.png")
        self.img_next = self._load_img("assets/buttons/btn_next.png")
        self.img_shuffle = self._load_img("assets/buttons/btn_shuffle.png")
        self.img_vol_knob = self._load_img("assets/buttons/vol_knob.png")
        
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
        
        self.turntable = Turntable(self.vinyl_images)
        self.particles = ParticleSystem(pygame.Rect(0, 0, config.BASE_W, config.BASE_H), count=60)
        
        self.album_grid = AlbumGrid(pygame.Rect(0, 20, 200, 410))
        self.lcd = LCDDisplay(0, 20, 200, 45) # Width updated dynamically later
        
        # Player buttons - coordinates will be relative to Player Panel X
        self.btn_play = Button(pygame.Rect(22, 350, 50, 32), self.img_start_stop, self.img_start_stop_active)
        self.btn_prev = Button(pygame.Rect(80, 357, 18, 18), self.img_prev)
        self.btn_shuffle = Button(pygame.Rect(104, 357, 18, 18), self.img_shuffle)
        self.btn_repeat = Button(pygame.Rect(128, 357, 18, 18), self.img_repeat)
        self.btn_next = Button(pygame.Rect(152, 357, 18, 18), self.img_next)
        
        self.vol_slider = VolumeSlider(315, 145, 26, 120, self.img_vol_knob)
        
        # Scroll state
        self.dragging_progress = False
        self.playlist_scroll_offset = 0.0
        self.scroll_target = 0.0
        self.scroll_velocity = 0.0
        self.playlist_hover_index = -1
        
        self._update_album_art_and_theme(self.audio.current_track_index)

    def _update_album_art_and_theme(self, idx):
        art, dom_col = self.audio.get_album_art_surface_and_color(idx)
        if self.audio.playlist and 0 <= idx < len(self.audio.playlist):
            fp = self.audio.playlist[idx]
            self.turntable.set_album_art(fp, art)
            if dom_col:
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
            
            # Switch to Player view
            self.view_state = 2

    def _interact(self):
        self.last_interaction_time = time.time()
        self.screensaver_alpha = 255.0

    def _format_time(self, seconds):
        if seconds <= 0: return "0:00"
        m = int(seconds) // 60
        s = int(seconds) % 60
        return f"{m}:{s:02d}"

    def _handle_events(self):
        self.raw_mouse = pygame.mouse.get_pos()
        scale_x = config.BASE_W / self.screen.get_width()
        scale_y = config.BASE_H / self.screen.get_height()
        self.mouse_pos = (int(self.raw_mouse[0] * scale_x), int(self.raw_mouse[1] * scale_y))
        
        # Filter indices based on state
        if self.is_searching and self.search_query:
            self.filtered_indices = []
            for i, fp in enumerate(self.audio.playlist):
                info = self.audio.track_info.get(fp, {})
                t = info.get('title', '').lower()
                a = info.get('artist', '').lower()
                q = self.search_query.lower()
                if q in t or q in a:
                    self.filtered_indices.append(i)
        elif self.selected_album and self.selected_album in self.audio.albums:
            self.filtered_indices = []
            album_fps = self.audio.albums[self.selected_album]
            for i, fp in enumerate(self.audio.playlist):
                if fp in album_fps:
                    self.filtered_indices.append(i)
        else:
            self.filtered_indices = list(range(len(self.audio.playlist)))
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
                
            elif event.type == config.TRACK_END_EVENT:
                if self.audio.is_playing:
                    if self.audio.repeat_mode == 0 and self.audio.current_track_index == len(self.audio.playlist) - 1:
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
                    else:
                        if event.unicode.isprintable():
                            self.search_query += event.unicode
                else:
                    if event.key == pygame.K_SPACE:
                        self._change_track(self.audio.toggle_play_pause)
                    elif event.key == pygame.K_RIGHT:
                        self._change_track(self.audio.play_next)
                    elif event.key == pygame.K_LEFT:
                        self._change_track(self.audio.play_prev)
                    elif event.key == pygame.K_r:
                        self.audio.cycle_repeat()
                    elif event.key == pygame.K_s:
                        self.audio.toggle_shuffle()
                    elif event.key == pygame.K_ESCAPE:
                        if self.view_state > 0:
                            self.view_state -= 1
                    elif event.key == pygame.K_SLASH or (event.key == pygame.K_f and (pygame.key.get_mods() & pygame.KMOD_CTRL)):
                        self.is_searching = True
                        self.search_query = ""
                        self.view_state = max(self.view_state, 1)
                    
            elif event.type == pygame.MOUSEBUTTONDOWN:
                self._interact()
                if event.button == 1:
                    if self.is_searching:
                        self.is_searching = False
                        self.search_query = ""
                        
                    pos = self.mouse_pos
                    
                    # Handle Albums click
                    if self.album_grid.rect.collidepoint(pos):
                        y_offset = self.album_grid.rect.y + 40 - self.album_grid.scroll_y
                        for album_name in self.audio.albums.keys():
                            if y_offset + 50 > self.album_grid.rect.y + 40 and y_offset < self.album_grid.rect.bottom:
                                item_rect = pygame.Rect(self.album_grid.rect.x + 10, y_offset, self.album_grid.rect.width - 20, 50)
                                if item_rect.collidepoint(pos):
                                    self.selected_album = album_name
                                    self.view_state = max(self.view_state, 1)
                                    self.playlist_scroll_offset = 0
                                    self.scroll_target = 0
                            y_offset += 55

                    # Handle Track click
                    track_rect = pygame.Rect(self.track_x, 20, config.TRACK_W, 410)
                    if track_rect.collidepoint(pos):
                        pl_view_y = 20 + 70
                        pl_view_h = 410 - 90
                        if self.track_x <= pos[0] <= self.track_x + config.TRACK_W and pl_view_y <= pos[1] <= pl_view_y + pl_view_h:
                            rel_y = pos[1] - pl_view_y + self.playlist_scroll_offset
                            idx = int(rel_y // config.PL_ITEM_H)
                            if 0 <= idx < len(self.filtered_indices):
                                real_idx = self.filtered_indices[idx]
                                self._change_track(self.audio.play_track, real_idx)
                                
                    # Handle Player buttons
                    pb_x = self.player_x
                    pb_y = 20
                    if self.btn_play.rect.collidepoint(pos):
                        self.btn_play.is_pressed = True
                        self._change_track(self.audio.toggle_play_pause)
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
                    elif self.vol_slider.rect.collidepoint(pos):
                        self.vol_slider.is_dragging = True
                        
                    # Progress Bar
                    prog_rect = pygame.Rect(self.track_x + 12, 20 + 410 - 16, config.TRACK_W - 24, 8)
                    if prog_rect.collidepoint(pos):
                        self.dragging_progress = True
                        pct = max(0.0, min(1.0, (pos[0] - prog_rect.x) / prog_rect.w))
                        new_pos = pct * self.audio.get_track_info()[2]
                        if new_pos > 0:
                            pygame.mixer.music.set_pos(new_pos)
                            self.audio.playback_offset = new_pos
                            
                # Scroll
                if event.button == 4:
                    if self.mouse_pos[0] < self.track_x:
                        self.album_grid.target_scroll_y -= 40
                    else:
                        self.scroll_velocity -= 40
                elif event.button == 5:
                    if self.mouse_pos[0] < self.track_x:
                        self.album_grid.target_scroll_y += 40
                    else:
                        self.scroll_velocity += 40
                    
            elif event.type == pygame.MOUSEBUTTONUP:
                if event.button == 1:
                    self.dragging_progress = False
                    self.vol_slider.is_dragging = False
                    self.btn_play.is_pressed = False
                    self.btn_prev.is_pressed = False
                    self.btn_next.is_pressed = False
                    self.btn_shuffle.is_pressed = False
                    self.btn_repeat.is_pressed = False

    def _update_logic(self, dt):
        self.album_x = 10
        
        if self.view_state == 0:
            self.track_x = config.BASE_W + 50
            self.player_x = config.BASE_W + 50
        elif self.view_state == 1:
            self.track_x = 220
            self.player_x = config.BASE_W + 50
        elif self.view_state == 2:
            self.track_x = 220
            self.player_x = 430
        
        self.album_grid.rect.x = int(self.album_x)
        self.album_grid.update(dt)

        for i in range(3):
            self.current_bg_color[i] += (self.target_bg_color[i] - self.current_bg_color[i]) * 2 * dt
            self.current_particle_color[i] += (self.target_particle_color[i] - self.current_particle_color[i]) * 2 * dt
            
        self.particles.update(dt)
        
        pct = 0.0
        _, _, tot = self.audio.get_track_info()
        if tot > 0:
            pct = self.audio.get_playback_pos() / tot
            pct = max(0.0, min(1.0, pct))
            
        self.turntable.update(dt, self.audio.is_playing, pct)
        
        # Hover handling
        pos = self.mouse_pos
        self.hover_album = None
        if self.album_grid.rect.collidepoint(pos):
            y_offset = self.album_grid.rect.y + 40 - self.album_grid.scroll_y
            for album_name in self.audio.albums.keys():
                if y_offset + 50 > self.album_grid.rect.y + 40 and y_offset < self.album_grid.rect.bottom:
                    item_rect = pygame.Rect(self.album_grid.rect.x + 10, y_offset, self.album_grid.rect.width - 20, 50)
                    if item_rect.collidepoint(pos):
                        self.hover_album = album_name
                y_offset += 55
                
        self.playlist_hover_index = -1
        track_rect = pygame.Rect(self.track_x, 20, config.TRACK_W, 410)
        pl_view_y = 90
        pl_view_h = 320
        if track_rect.collidepoint(pos) and pl_view_y <= pos[1] <= pl_view_y + pl_view_h:
            rel_y = pos[1] - pl_view_y + self.playlist_scroll_offset
            h_idx = int(rel_y // config.PL_ITEM_H)
            if 0 <= h_idx < len(self.filtered_indices):
                self.playlist_hover_index = h_idx
                
        # Scroll physics
        self.scroll_velocity *= 0.85
        self.scroll_target += self.scroll_velocity * dt
        max_scroll = max(0, len(self.filtered_indices) * config.PL_ITEM_H - pl_view_h)
        self.scroll_target = max(0.0, min(float(max_scroll), self.scroll_target))
        self.playlist_scroll_offset += (self.scroll_target - self.playlist_scroll_offset) * 15 * dt

        # Screensaver
        if self.audio.is_playing:
            idle_time = time.time() - self.last_interaction_time
            if idle_time > 30.0:
                self.screensaver_alpha = max(0.0, self.screensaver_alpha - 50 * dt)
            else:
                self.screensaver_alpha = min(255.0, self.screensaver_alpha + 200 * dt)
        else:
            self.screensaver_alpha = 255.0

    def _render(self):
        ui_surface = self.display_surface
        ui_surface.fill(tuple(int(c) for c in self.current_bg_color))
        
        # The dynamic color fill is sufficient for the background
        
        p_col = tuple(int(c) for c in self.current_particle_color)
        self.particles.draw(ui_surface, p_col)
        
        # 1. Draw Album Grid
        self.album_grid.draw(ui_surface, self.audio.albums, self.hover_album, self.selected_album)
        
        # 2. Draw Track Panel
        tx = int(self.track_x)
        ty = 20
        tw = config.TRACK_W
        th = 410
        
        bg_tracks = pygame.Surface((tw, th), pygame.SRCALPHA)
        pygame.draw.rect(bg_tracks, (*config.COL_PANEL_ITEM, 150), (0, 0, tw, th), border_radius=10)
        ui_surface.blit(bg_tracks, (tx, ty))
        
        self.lcd.rect.x = tx + 7
        self.lcd.rect.y = ty + 7
        self.lcd.rect.width = tw - 14
        t_title, t_artist, _ = self.audio.get_track_info()
        time_str = self._format_time(self.audio.get_playback_pos())
        lyric = self.audio.get_current_lyric()
        self.lcd.draw(ui_surface, t_title, t_artist, time_str, self.audio.is_playing,
                      search_query=self.search_query if self.is_searching else "",
                      lyric_text=lyric)
                      
        pl_view_y = ty + 70
        pl_view_h = th - 90
        clip_rect = pygame.Rect(tx, pl_view_y, tw, pl_view_h)
        old_clip = ui_surface.get_clip()
        ui_surface.set_clip(clip_rect)
        
        is_busy = pygame.mixer.music.get_busy()
        for list_i, real_idx in enumerate(self.filtered_indices):
            item_y = pl_view_y + list_i * config.PL_ITEM_H - self.playlist_scroll_offset
            if item_y + config.PL_ITEM_H < pl_view_y or item_y > pl_view_y + pl_view_h:
                continue
                
            irect = pygame.Rect(tx + 5, item_y, tw - 10, config.PL_ITEM_H - 4)
            
            if real_idx == self.audio.current_track_index and is_busy:
                pygame.draw.rect(ui_surface, config.COL_PANEL_ACTIVE, irect, border_radius=5)
                pygame.draw.rect(ui_surface, config.COL_HIGHLIGHT, (irect.x, irect.y, 4, irect.h), border_radius=5)
            elif list_i == self.playlist_hover_index:
                pygame.draw.rect(ui_surface, config.COL_PANEL_HOVER, irect, border_radius=5)
                
            fp = self.audio.playlist[real_idx]
            info = self.audio.track_info.get(fp, {})
            p_title = info.get('title', 'Unknown')
            p_artist = info.get('artist', 'Unknown Artist')
            p_dur = info.get('duration', 0)
            play_count = info.get('play_count', 0)
            
            col_t = config.COL_GOLD if play_count >= 3 else config.COL_TEXT
            v_col = self.audio.track_vinyl_colors.get(real_idx, 'red')
            v_col_rgb = {'red': (255, 80, 100), 'blue': (80, 150, 255), 'green': (80, 220, 100),
                         'purple': (180, 80, 220), 'orange': (255, 170, 60), 'teal': (60, 200, 180)}
            pygame.draw.rect(ui_surface, v_col_rgb.get(v_col, (255, 255, 255)), (irect.x + 5, irect.y + 10, 6, 6))
            
            ui_surface.blit(config.font_item.render(p_title[:22], True, col_t), (irect.x + 16, irect.y + 5))
            ui_surface.blit(config.font_artist.render(p_artist[:25], True, config.COL_TEXT_DIM), (irect.x + 16, irect.y + 18))
            dur_str = self._format_time(p_dur)
            ui_surface.blit(config.font_time.render(dur_str, True, config.COL_TEXT_DIM), (irect.right - 30, irect.y + 5))
            
        ui_surface.set_clip(old_clip)
        # Progress bar moved to player panel
            
        # 3. Draw Player Panel
        px = int(self.player_x)
        py = 20
        pw = config.PLAYER_W
        ph = 410
        
        # Programmatic Turntable Base (Sleek dark metallic style)
        bg_player = pygame.Surface((pw, ph), pygame.SRCALPHA)
        pygame.draw.rect(bg_player, (35, 38, 43, 255), (0, 0, pw, ph), border_radius=12)
        # Inner bezel
        pygame.draw.rect(bg_player, (50, 53, 58, 255), (2, 2, pw - 4, ph - 4), width=1, border_radius=11)
        ui_surface.blit(bg_player, (px, py))
        
        vol_pct = self.audio.volume
        bass_pulse = 0.0
        if is_busy and self.audio.is_playing:
            bass_pulse = max(0, min(1, 0.5 + 0.5 * math.sin(time.time() * 12))) * vol_pct
            
        self.turntable.draw(ui_surface, self.audio.track_vinyl_colors.get(self.audio.current_track_index, 'red'),
                            self.audio.is_playing, is_busy, bass_pulse, offset_x=px, offset_y=py)
        # Progress Bar on Player Panel
        prog_rect = pygame.Rect(px + 30, py + 370, pw - 60, 6)
        pygame.draw.rect(ui_surface, config.COL_PROGRESS_BG, prog_rect, border_radius=3)
        pct = 0.0
        _, _, tot = self.audio.get_track_info()
        if tot > 0:
            pct = self.audio.get_playback_pos() / tot
            pct = max(0.0, min(1.0, pct))
        f_rect = pygame.Rect(prog_rect.x, prog_rect.y, int(prog_rect.w * pct), prog_rect.h)
        if f_rect.w > 0:
            pygame.draw.rect(ui_surface, config.COL_PROGRESS_FILL, f_rect, border_radius=3)
            # Draw a tiny knob at the end of the progress bar
            pygame.draw.circle(ui_surface, config.COL_HIGHLIGHT, (f_rect.right, f_rect.centery), 5)
                            
        # Draw buttons (Original layout: T_X=15, T_Y=10)
        self.btn_play.rect.x = px + 37
        self.btn_play.rect.y = py + 305
        self.btn_play.draw(ui_surface)
        
        self.btn_prev.rect.x = px + 95
        self.btn_prev.rect.y = py + 312
        self.btn_prev.draw(ui_surface)
        
        self.btn_shuffle.rect.x = px + 119
        self.btn_shuffle.rect.y = py + 312
        self.btn_shuffle.draw(ui_surface, active=self.audio.is_shuffled)
        
        self.btn_repeat.rect.x = px + 143
        self.btn_repeat.rect.y = py + 312
        self.btn_repeat.draw(ui_surface, active=(self.audio.repeat_mode > 0))
        
        self.btn_next.rect.x = px + 167
        self.btn_next.rect.y = py + 312
        self.btn_next.draw(ui_surface)
        
        self.vol_slider.rect.x = px + 340
        self.vol_slider.rect.y = py + 145
        self.vol_slider.draw(ui_surface, self.audio.volume)
        
        # Handle volume dragging
        if self.vol_slider.is_dragging:
            rel_y = self.mouse_pos[1] - self.vol_slider.rect.y
            pct = 1.0 - max(0.0, min(1.0, rel_y / self.vol_slider.rect.height))
            self.audio.set_volume(pct)
        
        # Global alpha overlay for screensaver
        if self.screensaver_alpha < 255.0:
            overlay = pygame.Surface((config.BASE_W, config.BASE_H), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, int(255 - self.screensaver_alpha)))
            ui_surface.blit(overlay, (0, 0))
            
        scaled_screen = pygame.transform.smoothscale(self.display_surface, self.screen.get_size())
        self.screen.blit(scaled_screen, (0, 0))
        pygame.display.flip()

    def run(self):
        while self.running:
            dt = self.clock.tick(config.FPS) / 1000.0
            self._handle_events()
            self._update_logic(dt)
            self._render()
        pygame.quit()

if __name__ == "__main__":
    app = App()
    app.run()

import pygame
import math
import random
import config

class Button:
    def __init__(self, rect, img_normal, img_active=None):
        self.rect = rect
        self.img_normal = img_normal
        self.img_active = img_active
        self.is_pressed = False
        
    def draw(self, surface, active=False):
        img = self.img_active if (active and self.img_active) else self.img_normal
        if self.is_pressed:
            surface.blit(img, (self.rect.x, self.rect.y + 2))
        else:
            surface.blit(img, self.rect.topleft)

class VolumeSlider:
    def __init__(self, x, y, w, h, knob_img):
        self.rect = pygame.Rect(x, y, w, h)
        self.knob_img = knob_img
        self.is_dragging = False
        
    def draw(self, surface, volume):
        knob_y = self.rect.y + int((1.0 - volume) * self.rect.h)
        knob_y = max(self.rect.y, min(knob_y, self.rect.bottom - self.knob_img.get_height()))
        surface.blit(self.knob_img, (self.rect.x + 2, knob_y))
        
        vol_pct = config.font_vol.render(f"{int(volume * 100)}%", False, config.COL_TEXT_DIM)
        surface.blit(vol_pct, (self.rect.x + 2, self.rect.bottom + 5))

class LCDDisplay:
    def __init__(self, x, y, w, h):
        self.rect = pygame.Rect(x, y, w, h)
        self.marquee_offset = 0.0
        
        self.num_bars = 12
        self.bar_w = 4
        self.bar_gap = 2
        self.bars = [0.0] * self.num_bars
        self.target_bars = [0.0] * self.num_bars
        self.bass_pulse = 0.0  # NEW: exported for turntable glow
        
    def update(self, dt, is_playing, audio_engine=None):
        self.marquee_offset += 20 * dt * (1/60.0)
        use_random = True
        
        if is_playing:
            if audio_engine and audio_engine.audio_array is not None:
                try:
                    import numpy as np
                    curr_time = audio_engine.get_playback_pos()
                    sample_rate = audio_engine.sample_rate
                    chunk_size = 1024
                    start_idx = int(curr_time * sample_rate)
                    end_idx = start_idx + chunk_size
                    
                    if end_idx < len(audio_engine.audio_array):
                        chunk = audio_engine.audio_array[start_idx:end_idx]
                        if len(chunk) == chunk_size:
                            windowed = chunk * np.hanning(chunk_size)
                            fft_out = np.abs(np.fft.rfft(windowed))
                            
                            useful_fft = fft_out[1:int(chunk_size/3)]
                            bins = np.array_split(useful_fft, self.num_bars)
                            
                            for i in range(self.num_bars):
                                val = np.mean(bins[i])
                                norm_val = min(1.0, max(0.0, (np.log10(val + 1) - 4.5) / 3.0))
                                self.target_bars[i] = norm_val
                                
                            # NEW: Extract bass pulse from lowest frequency bin
                            self.bass_pulse = self.target_bars[0] if self.num_bars > 0 else 0.0
                            use_random = False
                except Exception:
                    use_random = True
                    
            if use_random:
                for i in range(self.num_bars):
                    if random.random() < 0.2:
                        self.target_bars[i] = random.uniform(0.2, 1.0)
                    else:
                        self.target_bars[i] = max(0.0, self.target_bars[i] - 0.05 * dt)
        else:
            for i in range(self.num_bars):
                self.target_bars[i] = 0.0
            self.bass_pulse = max(0.0, self.bass_pulse - 0.05 * dt)
                
        for i in range(self.num_bars):
            diff = self.target_bars[i] - self.bars[i]
            speed = 0.5 if not use_random else 0.3
            self.bars[i] += diff * speed * dt

    def draw(self, surface, title, artist, time_str, is_playing, search_query="", lyric_text=None):
        pygame.draw.rect(surface, config.COL_LCD_BG, self.rect, border_radius=4)
        pygame.draw.rect(surface, config.COL_LCD_DIM, self.rect, width=1, border_radius=4)
        
        for i in range(0, self.rect.h, 2):
            pygame.draw.line(surface, (10, 15, 12), (self.rect.x, self.rect.y + i), (self.rect.right, self.rect.y + i))
            
        old_clip = surface.get_clip()
        clip_rect = pygame.Rect(self.rect.x + 4, self.rect.y + 4, self.rect.w - 8, self.rect.h - 8)
        surface.set_clip(clip_rect)
        
        # Search mode overrides title/artist display
        if search_query:
            t_surf = config.font_lcd_large.render("SEARCH:" + search_query + "_", False, config.COL_LCD_TEXT)
            a_surf = config.font_lcd_small.render("Esc=cancel Enter=play", False, config.COL_LCD_DIM)
        else:
            t_surf = config.font_lcd_large.render(title, False, config.COL_LCD_TEXT)
            # Show lyric if available, otherwise artist
            sub_text = lyric_text if lyric_text else artist
            a_surf = config.font_lcd_small.render(sub_text, False, config.COL_LCD_TEXT)
        
        max_w = clip_rect.w - 60 
        if t_surf.get_width() > max_w:
            if self.marquee_offset > t_surf.get_width() + 20:
                self.marquee_offset = -max_w
            tx = clip_rect.x - self.marquee_offset
        else:
            tx = clip_rect.x
            self.marquee_offset = 0
            
        surface.blit(t_surf, (tx, clip_rect.y))
        surface.blit(a_surf, (clip_rect.x, clip_rect.y + 16))
        
        eq_x = clip_rect.right - (self.num_bars * (self.bar_w + self.bar_gap))
        eq_y = clip_rect.bottom
        max_h = 16
        for i in range(self.num_bars):
            h = int(self.bars[i] * max_h)
            if h > 0:
                bx = eq_x + i * (self.bar_w + self.bar_gap)
                by = eq_y - h
                pygame.draw.rect(surface, (*config.COL_LCD_TEXT[:3], 100), (bx-1, by-1, self.bar_w+2, h+2))
                pygame.draw.rect(surface, config.COL_LCD_TEXT, (bx, by, self.bar_w, h))
                
        surface.set_clip(old_clip)

class ParticleSystem:
    def __init__(self, rect, count=30):
        self.rect = rect
        self.particles = []
        for _ in range(count):
            self.spawn_particle(init=True)
            
    def spawn_particle(self, init=False):
        x = random.randint(self.rect.x, self.rect.right)
        y = random.randint(self.rect.y, self.rect.bottom) if init else self.rect.bottom
        vx = random.uniform(-0.1, 0.1)
        vy = random.uniform(-0.3, -0.05)
        radius = random.uniform(0.5, 1.5)
        alpha = random.randint(20, 80)
        self.particles.append([x, y, vx, vy, radius, alpha])
        
    def update(self, dt):
        for p in self.particles:
            p[0] += p[2] * dt
            p[1] += p[3] * dt
            if p[1] < self.rect.y or p[0] < self.rect.x or p[0] > self.rect.right:
                p[0] = random.randint(self.rect.x, self.rect.right)
                p[1] = self.rect.bottom
                
    def draw(self, surface, base_color=(255, 255, 255)):
        for p in self.particles:
            r = max(1, int(p[4]))
            a = max(0, min(255, int(p[5])))
            cr = max(0, min(255, int(base_color[0])))
            cg = max(0, min(255, int(base_color[1])))
            cb = max(0, min(255, int(base_color[2])))
            temp = pygame.Surface((4, 4), pygame.SRCALPHA)
            pygame.draw.circle(temp, (cr, cg, cb, a), (2, 2), r)
            surface.blit(temp, (int(p[0]-2), int(p[1]-2)))

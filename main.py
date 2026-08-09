import pygame
import os
import math
import config
from audio_engine import AudioEngine
from ui_elements import Button, VolumeSlider, LCDDisplay, ParticleSystem
from turntable import Turntable

# =============================================
#              INIT PYGAME
# =============================================
pygame.init()
screen = pygame.display.set_mode((config.WINDOW_WIDTH, config.WINDOW_HEIGHT))
display_surface = pygame.Surface((config.BASE_W, config.BASE_H))
pygame.display.set_caption("Retro Groove Music Player - Ultimate Edition")
clock = pygame.time.Clock()

# =============================================
#              LOAD ASSETS
# =============================================
def load_img(path):
    if os.path.exists(path):
        return pygame.image.load(path).convert_alpha()
    return pygame.Surface((10,10), pygame.SRCALPHA)

img_bg = load_img("assets/bg/bg_player.png")
img_empty_platter = load_img("assets/bg/empty_platter.png")
img_tone_arm = load_img("assets/bg/tone_arm.png")

img_start_stop = load_img("assets/buttons/btn_start_stop.png")
img_start_stop_active = load_img("assets/buttons/btn_start_stop_active.png")
img_prev = load_img("assets/buttons/btn_prev.png")
img_next = load_img("assets/buttons/btn_next.png")
img_shuffle = load_img("assets/buttons/btn_shuffle.png")
img_vol_knob = load_img("assets/buttons/vol_knob.png")
img_33 = load_img("assets/buttons/btn_33.png")
img_45 = load_img("assets/buttons/btn_45.png")
if os.path.exists("assets/buttons/btn_repeat.png"):
    img_repeat = load_img("assets/buttons/btn_repeat.png")
else:
    img_repeat = img_shuffle

VINYL_NAMES = ['red', 'blue', 'green', 'purple', 'orange', 'teal']
vinyl_images = {}
for vn in VINYL_NAMES:
    vinyl_images[vn] = load_img(f"assets/vinyl/vinyl_{vn}.png")

# =============================================
#              INITIALIZE SYSTEMS
# =============================================
audio = AudioEngine()
audio.scan_music_folder()

turntable = Turntable(vinyl_images, img_tone_arm)
particles = ParticleSystem(pygame.Rect(0, 0, config.BASE_W, config.BASE_H), count=40)
lcd = LCDDisplay(config.PL_X, config.PL_Y, config.PL_W, 45)

btn_play = Button(pygame.Rect(config.T_X + 15, config.T_Y + 295, 50, 32), img_start_stop, img_start_stop_active)
btn_prev = Button(pygame.Rect(config.T_X + 80, config.T_Y + 302, 18, 18), img_prev)
btn_shuffle = Button(pygame.Rect(config.T_X + 104, config.T_Y + 302, 18, 18), img_shuffle)
btn_repeat = Button(pygame.Rect(config.T_X + 128, config.T_Y + 302, 18, 18), img_repeat)
btn_next = Button(pygame.Rect(config.T_X + 152, config.T_Y + 302, 18, 18), img_next)

vol_slider = VolumeSlider(config.T_X + 325, config.T_Y + 135, 26, 120, img_vol_knob)

# State
dragging_progress = False
playlist_scroll_offset = 0.0
scroll_target = 0.0
scroll_velocity = 0.0
playlist_hover_index = -1

# =============================================
#              MAIN LOOP
# =============================================
running = True
frame_count = 0

def format_time(seconds):
    if seconds <= 0: return "0:00"
    m = int(seconds) // 60
    s = int(seconds) % 60
    return f"{m}:{s:02d}"

while running:
    raw_mouse = pygame.mouse.get_pos()
    mouse_pos = (raw_mouse[0] // 2, raw_mouse[1] // 2)
    dt = max(clock.get_time(), 1) / 16.67
    frame_count += 1
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
            
        elif event.type == config.TRACK_END_EVENT:
            if audio.is_playing:
                if audio.repeat_mode == 0 and audio.current_track_index == len(audio.playlist) - 1:
                    audio.is_playing = False
                else:
                    old_c = audio.track_vinyl_colors.get(audio.current_track_index, 'red')
                    audio.play_next()
                    new_c = audio.track_vinyl_colors.get(audio.current_track_index, 'red')
                    turntable.trigger_swap(old_c, new_c)
                    
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                audio.toggle_play_pause()
            elif event.key == pygame.K_RIGHT:
                old_c = audio.track_vinyl_colors.get(audio.current_track_index, 'red')
                audio.play_next()
                new_c = audio.track_vinyl_colors.get(audio.current_track_index, 'red')
                turntable.trigger_swap(old_c, new_c)
            elif event.key == pygame.K_LEFT:
                old_c = audio.track_vinyl_colors.get(audio.current_track_index, 'red')
                audio.play_prev()
                new_c = audio.track_vinyl_colors.get(audio.current_track_index, 'red')
                turntable.trigger_swap(old_c, new_c)
            elif event.key == pygame.K_UP:
                audio.set_volume(audio.volume + 0.05)
            elif event.key == pygame.K_DOWN:
                audio.set_volume(audio.volume - 0.05)
            elif event.key == pygame.K_r:
                audio.cycle_repeat()
            elif event.key == pygame.K_s:
                audio.toggle_shuffle()
                
        elif event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:
                pos = mouse_pos
                
                # Progress Bar
                if config.PROG_X - 5 <= pos[0] <= config.PROG_X + config.PROG_W + 5 and config.PROG_Y - 10 <= pos[1] <= config.PROG_Y + config.PROG_H + 10:
                    if audio.playlist and audio.is_playing:
                        dragging_progress = True
                        _, _, dur = audio.get_track_info()
                        if dur > 0:
                            rel_x = max(0, min(pos[0] - config.PROG_X, config.PROG_W))
                            audio.seek((rel_x / config.PROG_W) * dur)
                            
                # Volume
                elif vol_slider.rect.collidepoint(pos):
                    vol_slider.is_dragging = True
                    audio.set_volume(1.0 - max(0.0, min(1.0, (pos[1] - vol_slider.rect.y) / vol_slider.rect.h)))
                    
                # Buttons
                elif btn_play.rect.collidepoint(pos):
                    btn_play.is_pressed = True
                    audio.toggle_play_pause()
                elif btn_prev.rect.collidepoint(pos):
                    btn_prev.is_pressed = True
                    old_c = audio.track_vinyl_colors.get(audio.current_track_index, 'red')
                    audio.play_prev()
                    new_c = audio.track_vinyl_colors.get(audio.current_track_index, 'red')
                    turntable.trigger_swap(old_c, new_c)
                elif btn_next.rect.collidepoint(pos):
                    btn_next.is_pressed = True
                    old_c = audio.track_vinyl_colors.get(audio.current_track_index, 'red')
                    audio.play_next()
                    new_c = audio.track_vinyl_colors.get(audio.current_track_index, 'red')
                    turntable.trigger_swap(old_c, new_c)
                elif btn_shuffle.rect.collidepoint(pos):
                    btn_shuffle.is_pressed = True
                    audio.toggle_shuffle()
                elif btn_repeat.rect.collidepoint(pos):
                    btn_repeat.is_pressed = True
                    audio.cycle_repeat()
                    
                # Playlist
                elif config.PL_X <= pos[0] <= config.PL_X + config.PL_W and config.PL_VIEW_Y <= pos[1] <= config.PL_VIEW_Y + config.PL_VIEW_H:
                    rel_y = pos[1] - config.PL_VIEW_Y + playlist_scroll_offset
                    idx = int(rel_y // config.PL_ITEM_H)
                    if 0 <= idx < len(audio.playlist):
                        old_c = audio.track_vinyl_colors.get(audio.current_track_index, 'red')
                        audio.play_track(idx)
                        new_c = audio.track_vinyl_colors.get(audio.current_track_index, 'red')
                        turntable.trigger_swap(old_c, new_c)
                        
            # Momentum Scroll implementation (Mouse wheel)
            if event.button == 4: # Scroll Up
                scroll_velocity -= 40
            elif event.button == 5: # Scroll Down
                scroll_velocity += 40
                
        elif event.type == pygame.MOUSEBUTTONUP:
            if event.button == 1:
                dragging_progress = False
                vol_slider.is_dragging = False
                for btn in [btn_play, btn_prev, btn_next, btn_shuffle, btn_repeat]:
                    btn.is_pressed = False
                    
        elif event.type == pygame.MOUSEMOTION:
            if vol_slider.is_dragging:
                audio.set_volume(1.0 - max(0.0, min(1.0, (mouse_pos[1] - vol_slider.rect.y) / vol_slider.rect.h)))
            if dragging_progress and audio.playlist and audio.is_playing:
                _, _, dur = audio.get_track_info()
                if dur > 0:
                    rel_x = max(0, min(mouse_pos[0] - config.PROG_X, config.PROG_W))
                    audio.seek((rel_x / config.PROG_W) * dur)
                    
    # ============ UPDATES ============
    # Momentum scrolling
    if audio.playlist:
        th = len(audio.playlist) * config.PL_ITEM_H
        max_scroll = max(0, th - config.PL_VIEW_H)
        
        scroll_velocity *= 0.85 # Friction
        scroll_target += scroll_velocity * dt
        scroll_target = max(0, min(scroll_target, max_scroll))
        
        diff = scroll_target - playlist_scroll_offset
        if abs(diff) > 0.5:
            playlist_scroll_offset += diff * 0.2 * dt
        else:
            playlist_scroll_offset = scroll_target

    _, _, dur = audio.get_track_info()
    progress_ratio = min(1.0, audio.get_playback_pos() / dur) if dur > 0 else 0
    
    turntable.update(dt, audio.is_playing, progress_ratio)
    particles.update(dt)
    lcd.update(dt, audio.is_playing, audio_engine=audio)
    
    playlist_hover_index = -1
    if config.PL_X <= mouse_pos[0] <= config.PL_X + config.PL_W and config.PL_VIEW_Y <= mouse_pos[1] <= config.PL_VIEW_Y + config.PL_VIEW_H:
        rel_y = mouse_pos[1] - config.PL_VIEW_Y + playlist_scroll_offset
        h_idx = int(rel_y // config.PL_ITEM_H)
        if 0 <= h_idx < len(audio.playlist):
            playlist_hover_index = h_idx

    # ============ RENDER ============
    display_surface.fill(config.COL_BG)
    display_surface.blit(img_bg, (0, 0))
    particles.draw(display_surface)
    
    # Platter & Turntable
    platter_rect = img_empty_platter.get_rect(center=turntable.vinyl_center)
    display_surface.blit(img_empty_platter, platter_rect.topleft)
    
    curr_color = audio.track_vinyl_colors.get(audio.current_track_index, 'red')
    is_busy = pygame.mixer.music.get_busy() and len(audio.playlist) > 0
    turntable.draw(display_surface, curr_color, audio.is_playing, is_busy)
    
    vol_slider.draw(display_surface, audio.volume)
    
    btn_play.draw(display_surface, audio.is_playing)
    btn_prev.draw(display_surface)
    btn_next.draw(display_surface)
    btn_shuffle.draw(display_surface)
    btn_repeat.draw(display_surface)
    
    display_surface.blit(img_33, (config.T_X + 268, config.T_Y + 308))
    display_surface.blit(img_45, (config.T_X + 298, config.T_Y + 308))
    
    if audio.is_shuffled:
        pygame.draw.rect(display_surface, config.COL_TEXT_GREEN, (btn_shuffle.rect.x + 5, btn_shuffle.rect.bottom + 2, 8, 2))
    if audio.repeat_mode == 1:
        pygame.draw.rect(display_surface, config.COL_ACCENT_BLUE, (btn_repeat.rect.x + 5, btn_repeat.rect.bottom + 2, 8, 2))
    elif audio.repeat_mode == 2:
        pygame.draw.rect(display_surface, config.COL_TEXT_YELLOW, (btn_repeat.rect.x + 5, btn_repeat.rect.bottom + 2, 8, 2))
        one_surf = config.font_vol.render("1", False, config.COL_TEXT_YELLOW)
        display_surface.blit(one_surf, (btn_repeat.rect.x + 6, btn_repeat.rect.y - 8))
        
    # LCD Display
    t_title, t_artist, _ = audio.get_track_info()
    time_str = format_time(audio.get_playback_pos())
    lcd.draw(display_surface, t_title, t_artist, time_str, audio.is_playing)

    # Playlist Panel
    clip_rect = pygame.Rect(config.PL_X, config.PL_VIEW_Y, config.PL_W, config.PL_VIEW_H)
    display_surface.set_clip(clip_rect)
    
    for i, track_path in enumerate(audio.playlist):
        item_y = config.PL_VIEW_Y + i * config.PL_ITEM_H - playlist_scroll_offset
        if item_y + config.PL_ITEM_H < config.PL_VIEW_Y or item_y > config.PL_VIEW_Y + config.PL_VIEW_H:
            continue
            
        irect = pygame.Rect(config.PL_X, item_y, config.PL_W, config.PL_ITEM_H - 2)
        
        if i == audio.current_track_index and is_busy:
            pygame.draw.rect(display_surface, config.COL_PANEL_ACTIVE, irect)
            pygame.draw.rect(display_surface, config.COL_HIGHLIGHT, (irect.x, irect.y, 2, irect.h))
        elif i == playlist_hover_index:
            pygame.draw.rect(display_surface, config.COL_PANEL_HOVER, irect)
        else:
            pygame.draw.rect(display_surface, config.COL_PANEL_ITEM, irect)
            
        v_col_name = audio.track_vinyl_colors.get(i, 'red')
        v_map = {'red': (225,65,85), 'blue': (50,120,210), 'green': (60,180,80),
                 'purple': (150,60,180), 'orange': (240,140,40), 'teal': (40,170,160)}
        pygame.draw.rect(display_surface, v_map.get(v_col_name, (200,200,200)), (irect.x + 6, irect.y + 6, 6, 6))
        
        p_title, p_artist, p_dur = audio.get_track_info(i)
        col_t = config.COL_TEXT_YELLOW if i == audio.current_track_index else config.COL_TEXT
        
        display_surface.blit(config.font_item.render(p_title[:22], False, col_t), (irect.x + 16, irect.y + 3))
        display_surface.blit(config.font_item_sm.render(p_artist[:28], False, config.COL_TEXT_DIM), (irect.x + 16, irect.y + 14))
        if p_dur > 0:
            dur_surf = config.font_item_sm.render(format_time(p_dur), False, config.COL_TEXT_DIM)
            display_surface.blit(dur_surf, (irect.right - dur_surf.get_width() - 6, irect.y + 3))
            
    display_surface.set_clip(None)
    
    # Progress Bar
    pygame.draw.rect(display_surface, config.COL_PROGRESS_BG, (config.PROG_X, config.PROG_Y, config.PROG_W, config.PROG_H), border_radius=2)
    if progress_ratio > 0:
        fill_w = max(1, int(config.PROG_W * progress_ratio))
        pygame.draw.rect(display_surface, config.COL_PROGRESS_FILL, (config.PROG_X, config.PROG_Y, fill_w, config.PROG_H), border_radius=2)
        thumb_x = config.PROG_X + fill_w - 3
        pygame.draw.rect(display_surface, (255, 255, 255), (thumb_x, config.PROG_Y - 2, 5, config.PROG_H + 4), border_radius=1)
        
    t_cur_surf = config.font_time.render(time_str, False, config.COL_TEXT_DIM)
    t_dur_surf = config.font_time.render(format_time(dur), False, config.COL_TEXT_DIM)
    display_surface.blit(t_cur_surf, (config.PROG_X, config.PROG_Y - 11))
    display_surface.blit(t_dur_surf, (config.PROG_X + config.PROG_W - t_dur_surf.get_width(), config.PROG_Y - 11))
    
    # Scrollbar
    if audio.playlist and max_scroll > 0:
        sh = max(12, int(config.PL_VIEW_H * (config.PL_VIEW_H / th)))
        sy = config.PL_VIEW_Y + int((config.PL_VIEW_H - sh) * (playlist_scroll_offset / max_scroll))
        pygame.draw.rect(display_surface, (30, 34, 42), (config.PL_X + config.PL_W - 5, config.PL_VIEW_Y, 3, config.PL_VIEW_H), border_radius=1)
        pygame.draw.rect(display_surface, (90, 95, 110), (config.PL_X + config.PL_W - 5, sy, 3, sh), border_radius=1)
        
    # UPSCALE
    scaled_screen = pygame.transform.scale(display_surface, (config.WINDOW_WIDTH, config.WINDOW_HEIGHT))
    screen.blit(scaled_screen, (0, 0))
    
    pygame.display.flip()
    clock.tick(config.FPS)

pygame.quit()

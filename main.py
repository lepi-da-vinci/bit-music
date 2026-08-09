import pygame
import os
import math
import random
from mutagen.mp3 import MP3
from mutagen.easyid3 import EasyID3
from mutagen import File

# =============================================
#              CONFIGURATION
# =============================================
WINDOW_WIDTH = 1280
WINDOW_HEIGHT = 720
BASE_W = 640
BASE_H = 360
FPS = 60

# --- Color Palette ---
COL_BG = (30, 33, 42)
COL_TEXT = (220, 220, 230)
COL_TEXT_DIM = (120, 125, 140)
COL_TEXT_YELLOW = (255, 220, 100)
COL_TEXT_PINK = (255, 120, 180)
COL_TEXT_GREEN = (100, 255, 120)
COL_HIGHLIGHT = (225, 60, 80)
COL_PANEL_ITEM = (38, 42, 52)
COL_PANEL_HOVER = (52, 57, 70)
COL_PANEL_ACTIVE = (70, 35, 50)
COL_PROGRESS_BG = (20, 22, 28)
COL_PROGRESS_FILL = (100, 200, 255)
COL_ACCENT_BLUE = (80, 180, 255)

# =============================================
#              INIT PYGAME
# =============================================
pygame.init()
pygame.mixer.init()
screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
display_surface = pygame.Surface((BASE_W, BASE_H))
pygame.display.set_caption("Retro Groove Music Player - Pixel Art Edition")
clock = pygame.time.Clock()

# =============================================
#              LOAD ASSETS
# =============================================
try:
    img_bg = pygame.image.load("assets/bg/bg_player.png").convert_alpha()
    img_empty_platter = pygame.image.load("assets/bg/empty_platter.png").convert_alpha()
    img_tone_arm = pygame.image.load("assets/bg/tone_arm.png").convert_alpha()
    img_start_stop = pygame.image.load("assets/buttons/btn_start_stop.png").convert_alpha()
    img_start_stop_active = pygame.image.load("assets/buttons/btn_start_stop_active.png").convert_alpha()
    img_prev = pygame.image.load("assets/buttons/btn_prev.png").convert_alpha()
    img_next = pygame.image.load("assets/buttons/btn_next.png").convert_alpha()
    img_shuffle = pygame.image.load("assets/buttons/btn_shuffle.png").convert_alpha()
    img_vol_knob = pygame.image.load("assets/buttons/vol_knob.png").convert_alpha()
    img_33 = pygame.image.load("assets/buttons/btn_33.png").convert_alpha()
    img_45 = pygame.image.load("assets/buttons/btn_45.png").convert_alpha()

    # Repeat button (optional, fallback to shuffle visual if missing)
    if os.path.exists("assets/buttons/btn_repeat.png"):
        img_repeat = pygame.image.load("assets/buttons/btn_repeat.png").convert_alpha()
    else:
        img_repeat = img_shuffle  # fallback

    # Vinyls
    VINYL_NAMES = ['red', 'blue', 'green', 'purple', 'orange', 'teal']
    vinyl_images = {}
    for vn in VINYL_NAMES:
        path = f"assets/vinyl/vinyl_{vn}.png"
        if os.path.exists(path):
            vinyl_images[vn] = pygame.image.load(path).convert_alpha()

except Exception as e:
    print(f"Error loading assets: {e}")
    pygame.quit()
    exit()

# =============================================
#              FONTS (PIXELATED)
# =============================================
font_title = pygame.font.SysFont("Consolas", 11, bold=True)
font_artist = pygame.font.SysFont("Consolas", 9)
font_item = pygame.font.SysFont("Consolas", 9)
font_item_sm = pygame.font.SysFont("Consolas", 8)
font_time = pygame.font.SysFont("Consolas", 8)
font_vol = pygame.font.SysFont("Consolas", 7)

# =============================================
#           AUDIO ENGINE & STATE
# =============================================
playlist = []
track_durations = {}
track_vinyl_colors = {}
current_track_index = 0
is_playing = False
is_shuffled = False
volume = 0.7
playback_offset = 0.0

# Repeat modes: 0 = Off, 1 = Repeat All, 2 = Repeat One
repeat_mode = 0

TRACK_END_EVENT = pygame.USEREVENT + 1
pygame.mixer.music.set_endevent(TRACK_END_EVENT)
pygame.mixer.music.set_volume(volume)


def scan_music_folder():
    global playlist, track_durations, track_vinyl_colors
    playlist = []
    track_durations = {}
    track_vinyl_colors = {}
    music_dir = "music"
    if not os.path.exists(music_dir):
        os.makedirs(music_dir)
    for f in os.listdir(music_dir):
        if f.lower().endswith(('.mp3', '.wav', '.ogg')):
            fp = os.path.join(music_dir, f)
            playlist.append(fp)
            try:
                audio = File(fp)
                if audio is not None and audio.info is not None:
                    track_durations[fp] = audio.info.length
                else:
                    snd = pygame.mixer.Sound(fp)
                    track_durations[fp] = snd.get_length()
            except Exception:
                try:
                    snd = pygame.mixer.Sound(fp)
                    track_durations[fp] = snd.get_length()
                except Exception:
                    track_durations[fp] = 0
    playlist.sort()
    for i in range(len(playlist)):
        track_vinyl_colors[i] = VINYL_NAMES[i % len(VINYL_NAMES)]


def get_track_info(filepath):
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
    return title, artist


def format_time(seconds):
    if seconds <= 0:
        return "0:00"
    m = int(seconds) // 60
    s = int(seconds) % 60
    return f"{m}:{s:02d}"


def load_and_play(skip_count=0):
    global is_playing, playback_offset, current_track_index
    if not playlist or skip_count >= len(playlist):
        is_playing = False
        return
    try:
        pygame.mixer.music.load(playlist[current_track_index])
        pygame.mixer.music.play()
        playback_offset = 0.0
        is_playing = True
    except Exception as e:
        print(f"Error playing track: {e}")
        current_track_index = (current_track_index + 1) % len(playlist)
        load_and_play(skip_count + 1)


def play_next():
    global current_track_index
    if not playlist: return
    old_idx = current_track_index
    if repeat_mode == 2:  # Repeat One
        pass  # keep same index
    elif is_shuffled:
        current_track_index = random.randint(0, len(playlist) - 1)
    else:
        current_track_index = (current_track_index + 1) % len(playlist)
    trigger_vinyl_swap(old_idx, current_track_index)
    load_and_play()


def play_prev():
    global current_track_index
    if not playlist: return
    old_idx = current_track_index
    current_track_index = (current_track_index - 1) % len(playlist)
    trigger_vinyl_swap(old_idx, current_track_index)
    load_and_play()


def toggle_play_pause():
    global is_playing
    if not playlist: return
    if is_playing:
        pygame.mixer.music.pause()
        is_playing = False
    else:
        if pygame.mixer.music.get_pos() > 0:
            pygame.mixer.music.unpause()
        else:
            load_and_play()
        is_playing = True


def play_track(index):
    global current_track_index
    if not playlist or index < 0 or index >= len(playlist): return
    old_idx = current_track_index
    current_track_index = index
    trigger_vinyl_swap(old_idx, current_track_index)
    load_and_play()


def get_playback_pos():
    pos = pygame.mixer.music.get_pos()
    if pos == -1:
        return 0
    return playback_offset + (pos / 1000.0)


def cycle_repeat_mode():
    global repeat_mode
    repeat_mode = (repeat_mode + 1) % 3


# =============================================
#       VINYL SWAP ANIMATION
# =============================================
vinyl_swap_active = False
vinyl_swap_timer = 0.0
VINYL_SWAP_DURATION = 30.0
vinyl_swap_old_index = 0
vinyl_swap_new_index = 0


def trigger_vinyl_swap(old_idx, new_idx):
    global vinyl_swap_active, vinyl_swap_timer, vinyl_swap_old_index, vinyl_swap_new_index
    if old_idx == new_idx: return
    vinyl_swap_active = True
    vinyl_swap_timer = 0.0
    vinyl_swap_old_index = old_idx
    vinyl_swap_new_index = new_idx


# =============================================
#       ANIMATION HELPERS
# =============================================
title_fade_alpha = 255
title_fade_target = ""
now_playing_blink_timer = 0.0
vinyl_glow_angle = 0.0


# =============================================
#              UI LAYOUT (Base 640x360)
# =============================================

# --- State & Base Coordinates ---
T_X, T_Y = 15, 10
T_W, T_H = 370, 340
TURNTABLE_CX = T_X + 160
TURNTABLE_CY = T_Y + 148

# --- Buttons ---
rect_start_stop = pygame.Rect(T_X + 15, T_Y + 295, 50, 32)

rect_prev = pygame.Rect(T_X + 80, T_Y + 302, 18, 18)
rect_shuffle = pygame.Rect(T_X + 104, T_Y + 302, 18, 18)
rect_repeat = pygame.Rect(T_X + 128, T_Y + 302, 18, 18)
rect_next = pygame.Rect(T_X + 152, T_Y + 302, 18, 18)

rect_33 = pygame.Rect(T_X + 268, T_Y + 308, 14, 14)
rect_45 = pygame.Rect(T_X + 298, T_Y + 308, 14, 14)

# --- State ---
vinyl_center = (TURNTABLE_CX, TURNTABLE_CY)
vinyl_angle = 0.0

# --- Tone Arm ---
ARM_PIVOT_ON_IMAGE = (150, 40)
ARM_PIVOT_SCREEN = (T_X + 295, T_Y + 45)
arm_angle_current = 0.0
ARM_ANGLE_REST = 45.0
ARM_ANGLE_OUTER = 23.0
ARM_ANGLE_INNER = 5.0
ARM_SPEED = 0.5

# --- Pitch Slider (Volume) ---
VOL_X = T_X + 325
VOL_Y = T_Y + 135
VOL_W = 26
VOL_H = 120
dragging_volume = False

# --- Playlist Panel ---
PL_X = 408
PL_Y = 18
PL_W = 214
PL_H = 332
PL_ITEM_H = 38

PL_VIEW_Y = PL_Y + 32
PL_VIEW_H = PL_H - 60

# --- Progress Bar ---
PROG_X = PL_X + 12
PROG_Y = PL_Y + PL_H - 14
PROG_W = PL_W - 24
PROG_H = 4
dragging_progress = False
playback_offset = 0.0
playlist_scroll_offset = 0
playlist_hover_index = -1

# --- Smooth scroll ---
scroll_target = 0
scroll_velocity = 0.0

# =============================================
#              MAIN LOOP
# =============================================
scan_music_folder()

if playlist:
    current_title, current_artist = get_track_info(playlist[current_track_index])
else:
    current_title = "NO MUSIC"
    current_artist = "Drop files in 'music'"

arm_angle_current = ARM_ANGLE_REST
frame_count = 0

running = True
while running:
    raw_mouse = pygame.mouse.get_pos()
    mouse_pos = (raw_mouse[0] // 2, raw_mouse[1] // 2)
    dt = max(clock.get_time(), 1) / 16.67
    frame_count += 1

    # ============ EVENTS ============
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        elif event.type == TRACK_END_EVENT:
            if is_playing:
                if repeat_mode == 0 and current_track_index == len(playlist) - 1:
                    is_playing = False  # Stop at end if no repeat
                else:
                    play_next()
                    if playlist:
                        current_title, current_artist = get_track_info(playlist[current_track_index])

        elif event.type == pygame.KEYDOWN:
            # Keyboard shortcuts
            if event.key == pygame.K_SPACE:
                toggle_play_pause()
                if playlist:
                    current_title, current_artist = get_track_info(playlist[current_track_index])
            elif event.key == pygame.K_RIGHT:
                play_next()
                if playlist:
                    current_title, current_artist = get_track_info(playlist[current_track_index])
            elif event.key == pygame.K_LEFT:
                play_prev()
                if playlist:
                    current_title, current_artist = get_track_info(playlist[current_track_index])
            elif event.key == pygame.K_UP:
                volume = min(1.0, volume + 0.05)
                pygame.mixer.music.set_volume(volume)
            elif event.key == pygame.K_DOWN:
                volume = max(0.0, volume - 0.05)
                pygame.mixer.music.set_volume(volume)
            elif event.key == pygame.K_r:
                cycle_repeat_mode()
            elif event.key == pygame.K_s:
                is_shuffled = not is_shuffled

        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            pos = mouse_pos

            # Progress Drag Start
            if PROG_X - 5 <= pos[0] <= PROG_X + PROG_W + 5 and PROG_Y - 10 <= pos[1] <= PROG_Y + PROG_H + 10:
                if playlist and is_playing:
                    dragging_progress = True
                    duration = track_durations.get(playlist[current_track_index], 0)
                    if duration > 0:
                        rel_x = max(0, min(pos[0] - PROG_X, PROG_W))
                        ratio = rel_x / PROG_W
                        seek_time = ratio * duration
                        pygame.mixer.music.play(start=seek_time)
                        playback_offset = seek_time

            # Start/Stop
            elif rect_start_stop.collidepoint(pos):
                toggle_play_pause()
                if playlist:
                    current_title, current_artist = get_track_info(playlist[current_track_index])

            # Mini buttons
            elif rect_prev.collidepoint(pos):
                play_prev()
                if playlist:
                    current_title, current_artist = get_track_info(playlist[current_track_index])
            elif rect_next.collidepoint(pos):
                play_next()
                if playlist:
                    current_title, current_artist = get_track_info(playlist[current_track_index])
            elif rect_shuffle.collidepoint(pos):
                is_shuffled = not is_shuffled
            elif rect_repeat.collidepoint(pos):
                cycle_repeat_mode()

            # Volume Drag Start
            elif VOL_X <= pos[0] <= VOL_X + VOL_W and VOL_Y <= pos[1] <= VOL_Y + VOL_H:
                dragging_volume = True
                rel_y = pos[1] - VOL_Y
                volume = 1.0 - max(0.0, min(1.0, rel_y / VOL_H))
                pygame.mixer.music.set_volume(volume)

            # Playlist Click
            elif PL_X <= pos[0] <= PL_X + PL_W and PL_VIEW_Y <= pos[1] <= PL_VIEW_Y + PL_VIEW_H:
                rel_y = pos[1] - PL_VIEW_Y + playlist_scroll_offset
                clicked_idx = int(rel_y // PL_ITEM_H)
                if 0 <= clicked_idx < len(playlist):
                    play_track(clicked_idx)
                    current_title, current_artist = get_track_info(playlist[current_track_index])

        elif event.type == pygame.MOUSEBUTTONUP:
            dragging_volume = False
            dragging_progress = False

        elif event.type == pygame.MOUSEMOTION:
            if dragging_volume:
                rel_y = mouse_pos[1] - VOL_Y
                volume = 1.0 - max(0.0, min(1.0, rel_y / VOL_H))
                pygame.mixer.music.set_volume(volume)
            
            if dragging_progress and playlist and is_playing:
                duration = track_durations.get(playlist[current_track_index], 0)
                if duration > 0:
                    rel_x = max(0, min(mouse_pos[0] - PROG_X, PROG_W))
                    ratio = rel_x / PROG_W
                    seek_time = ratio * duration
                    pygame.mixer.music.play(start=seek_time)
                    playback_offset = seek_time

        elif event.type == pygame.MOUSEWHEEL:
            if PL_X <= mouse_pos[0] <= PL_X + PL_W and PL_Y <= mouse_pos[1] <= PL_Y + PL_H:
                if playlist:
                    th = len(playlist) * PL_ITEM_H
                    if th > PL_VIEW_H:
                        scroll_target -= event.y * 25
                        scroll_target = max(0, min(scroll_target, th - PL_VIEW_H))
                    else:
                        scroll_target = 0

    # ============ UPDATE ============
    # Smooth scroll interpolation
    scroll_diff = scroll_target - playlist_scroll_offset
    if abs(scroll_diff) > 0.5:
        playlist_scroll_offset += scroll_diff * 0.2 * dt
    else:
        playlist_scroll_offset = scroll_target

    # Vinyl rotation
    if is_playing:
        vinyl_angle -= 1.5 * dt
        if vinyl_angle <= -360:
            vinyl_angle += 360

    # Vinyl glow rotation
    vinyl_glow_angle += 0.5 * dt
    if vinyl_glow_angle >= 360:
        vinyl_glow_angle -= 360

    # Now playing blink
    now_playing_blink_timer += dt
    if now_playing_blink_timer >= 60:
        now_playing_blink_timer = 0.0

    # Tone arm
    if is_playing and playlist:
        playback_pos = get_playback_pos()
        duration = track_durations.get(playlist[current_track_index], 0)
        if duration > 0:
            progress = min(1.0, playback_pos / duration)
            target_arm = ARM_ANGLE_OUTER + (ARM_ANGLE_INNER - ARM_ANGLE_OUTER) * progress
        else:
            target_arm = ARM_ANGLE_OUTER
    else:
        target_arm = ARM_ANGLE_REST

    diff = target_arm - arm_angle_current
    if abs(diff) > 0.05:
        arm_angle_current += diff * 0.1 * dt
    else:
        arm_angle_current = target_arm

    # Vinyl swap animation
    if vinyl_swap_active:
        vinyl_swap_timer += 1.0 * dt
        if vinyl_swap_timer >= VINYL_SWAP_DURATION:
            vinyl_swap_active = False
            vinyl_swap_timer = 0.0

    # Hover
    playlist_hover_index = -1
    if PL_X <= mouse_pos[0] <= PL_X + PL_W and PL_VIEW_Y <= mouse_pos[1] <= PL_VIEW_Y + PL_VIEW_H:
        rel_y = mouse_pos[1] - PL_VIEW_Y + playlist_scroll_offset
        h_idx = int(rel_y // PL_ITEM_H)
        if 0 <= h_idx < len(playlist):
            playlist_hover_index = h_idx

    # ============ RENDER TO LOW-RES SURFACE ============
    display_surface.fill(COL_BG)
    display_surface.blit(img_bg, (0, 0))

    # --- Platter / Vinyl ---
    platter_rect = img_empty_platter.get_rect(center=vinyl_center)
    display_surface.blit(img_empty_platter, platter_rect.topleft)

    if is_playing or (playlist and pygame.mixer.music.get_busy()):
        vinyl_color = track_vinyl_colors.get(current_track_index, 'red')
        current_vinyl_img = vinyl_images.get(vinyl_color, list(vinyl_images.values())[0])

        if vinyl_swap_active:
            half = VINYL_SWAP_DURATION / 2
            if vinyl_swap_timer < half:
                t = vinyl_swap_timer / half
                old_c = track_vinyl_colors.get(vinyl_swap_old_index, 'red')
                old_img = vinyl_images.get(old_c, current_vinyl_img)
                rot = pygame.transform.rotate(old_img, vinyl_angle)
                scale = 1.0 - t * 0.2
                scaled = pygame.transform.scale(rot, (int(rot.get_width() * scale), int(rot.get_height() * scale)))
                scaled.set_alpha(int(255 * (1.0 - t)))
                r = scaled.get_rect(center=(vinyl_center[0], vinyl_center[1] - t * 30))
                display_surface.blit(scaled, r.topleft)
            else:
                t = (vinyl_swap_timer - half) / half
                rot = pygame.transform.rotate(current_vinyl_img, vinyl_angle)
                scale = 0.8 + t * 0.2
                scaled = pygame.transform.scale(rot, (int(rot.get_width() * scale), int(rot.get_height() * scale)))
                scaled.set_alpha(int(255 * t))
                r = scaled.get_rect(center=(vinyl_center[0], vinyl_center[1] - (1 - t) * 30))
                display_surface.blit(scaled, r.topleft)
        else:
            rot = pygame.transform.rotate(current_vinyl_img, vinyl_angle)
            r = rot.get_rect(center=vinyl_center)
            display_surface.blit(rot, r.topleft)

        # Vinyl glow rim when playing
        if is_playing and not vinyl_swap_active:
            glow_surf = pygame.Surface((280, 280), pygame.SRCALPHA)
            glow_c = 140
            v_col_rgb = {'red': (255, 80, 100), 'blue': (80, 150, 255), 'green': (80, 220, 100),
                         'purple': (180, 80, 220), 'orange': (255, 170, 60), 'teal': (60, 200, 180)}
            gc = v_col_rgb.get(vinyl_color, (255, 255, 255))
            alpha = int(30 + 15 * math.sin(vinyl_glow_angle * 0.05))
            pygame.draw.circle(glow_surf, (*gc, alpha), (glow_c, glow_c), 125, 3)
            gr = glow_surf.get_rect(center=vinyl_center)
            display_surface.blit(glow_surf, gr.topleft)

    # --- Tone Arm ---
    rot_arm = pygame.transform.rotate(img_tone_arm, arm_angle_current)
    orig_w, orig_h = img_tone_arm.get_size()
    dx = ARM_PIVOT_ON_IMAGE[0] - orig_w / 2
    dy = ARM_PIVOT_ON_IMAGE[1] - orig_h / 2
    rad = math.radians(-arm_angle_current)
    rdx = dx * math.cos(rad) - dy * math.sin(rad)
    rdy = dx * math.sin(rad) + dy * math.cos(rad)
    rw, rh = rot_arm.get_size()
    arm_x = ARM_PIVOT_SCREEN[0] - rw / 2 - rdx
    arm_y = ARM_PIVOT_SCREEN[1] - rh / 2 - rdy
    display_surface.blit(rot_arm, (arm_x, arm_y))

    # --- Volume Slider ---
    knob_y = VOL_Y + int((1.0 - volume) * VOL_H)
    knob_y = max(VOL_Y, min(knob_y, VOL_Y + VOL_H - img_vol_knob.get_height()))
    display_surface.blit(img_vol_knob, (VOL_X + 2, knob_y))
    
    # Volume percentage text
    vol_pct = font_vol.render(f"{int(volume * 100)}%", False, COL_TEXT_DIM)
    display_surface.blit(vol_pct, (VOL_X + 2, VOL_Y + VOL_H + 5))

    # --- Buttons ---
    if is_playing:
        display_surface.blit(img_start_stop_active, rect_start_stop.topleft)
    else:
        display_surface.blit(img_start_stop, rect_start_stop.topleft)
    
    display_surface.blit(img_prev, rect_prev.topleft)
    display_surface.blit(img_shuffle, rect_shuffle.topleft)
    display_surface.blit(img_repeat, rect_repeat.topleft)
    display_surface.blit(img_next, rect_next.topleft)
    
    display_surface.blit(img_33, rect_33.topleft)
    display_surface.blit(img_45, rect_45.topleft)

    # Shuffle active indicator
    if is_shuffled:
        pygame.draw.rect(display_surface, COL_TEXT_GREEN, (rect_shuffle.x + 5, rect_shuffle.bottom + 2, 8, 2))

    # Repeat mode indicator
    if repeat_mode == 1:
        pygame.draw.rect(display_surface, COL_ACCENT_BLUE, (rect_repeat.x + 5, rect_repeat.bottom + 2, 8, 2))
    elif repeat_mode == 2:
        pygame.draw.rect(display_surface, COL_TEXT_YELLOW, (rect_repeat.x + 5, rect_repeat.bottom + 2, 8, 2))
        # "1" indicator for repeat one
        one_surf = font_vol.render("1", False, COL_TEXT_YELLOW)
        display_surface.blit(one_surf, (rect_repeat.x + 6, rect_repeat.y - 8))

    # --- Current Track Header Text ---
    if playlist:
        # Title with yellow
        t_surf = font_title.render(current_title[:22], False, COL_TEXT_YELLOW)
        display_surface.blit(t_surf, (PL_X, PL_Y))

        # Artist
        a_surf = font_artist.render(current_artist[:28], False, COL_TEXT)
        display_surface.blit(a_surf, (PL_X, PL_Y + 14))

        # Now playing dot (blinking)
        if is_playing:
            blink = now_playing_blink_timer % 60
            if blink < 40:
                pygame.draw.circle(display_surface, COL_HIGHLIGHT, (PL_X + PL_W - 10, PL_Y + 8), 3)

    # --- Playlist Panel ---
    clip_rect = pygame.Rect(PL_X, PL_VIEW_Y, PL_W, PL_VIEW_H)
    display_surface.set_clip(clip_rect)
    
    for i, track_path in enumerate(playlist):
        item_y = PL_VIEW_Y + i * PL_ITEM_H - playlist_scroll_offset
        if item_y + PL_ITEM_H < PL_VIEW_Y or item_y > PL_VIEW_Y + PL_VIEW_H:
            continue
        
        irect = pygame.Rect(PL_X, item_y, PL_W, PL_ITEM_H - 2)
        
        # Background
        if i == current_track_index and (is_playing or pygame.mixer.music.get_busy()):
            pygame.draw.rect(display_surface, COL_PANEL_ACTIVE, irect)
            pygame.draw.rect(display_surface, COL_HIGHLIGHT, (irect.x, irect.y, 2, irect.h))
        elif i == playlist_hover_index:
            pygame.draw.rect(display_surface, COL_PANEL_HOVER, irect)
        else:
            pygame.draw.rect(display_surface, COL_PANEL_ITEM, irect)

        # Vinyl color dot
        v_col_name = track_vinyl_colors.get(i, 'red')
        v_map = {'red': (225,65,85), 'blue': (50,120,210), 'green': (60,180,80),
                 'purple': (150,60,180), 'orange': (240,140,40), 'teal': (40,170,160)}
        pygame.draw.rect(display_surface, v_map.get(v_col_name, (200,200,200)), (irect.x + 6, irect.y + 6, 6, 6))

        # Track info
        t_title, t_artist = get_track_info(track_path)
        col_t = COL_TEXT_YELLOW if i == current_track_index else COL_TEXT
        
        display_surface.blit(font_item.render(t_title[:22], False, col_t), (irect.x + 16, irect.y + 3))
        display_surface.blit(font_item_sm.render(t_artist[:28], False, COL_TEXT_DIM), (irect.x + 16, irect.y + 14))
        
        # Duration text on right
        dur = track_durations.get(track_path, 0)
        if dur > 0:
            dur_surf = font_item_sm.render(format_time(dur), False, COL_TEXT_DIM)
            display_surface.blit(dur_surf, (irect.right - dur_surf.get_width() - 6, irect.y + 3))

        # Now playing mini indicator (animated dot)
        if i == current_track_index and is_playing:
            blink = now_playing_blink_timer % 60
            if blink < 40:
                pygame.draw.circle(display_surface, COL_TEXT_GREEN, (irect.x + 9, irect.y + 26), 2)

    display_surface.set_clip(None)

    # --- Progress Bar ---
    playback_pos = get_playback_pos()
    duration = track_durations.get(playlist[current_track_index], 0) if playlist else 0
    progress_ratio = min(1.0, playback_pos / duration) if duration > 0 else 0

    # Background track
    pygame.draw.rect(display_surface, COL_PROGRESS_BG, (PROG_X, PROG_Y, PROG_W, PROG_H), border_radius=2)
    
    # Fill
    if progress_ratio > 0:
        fill_w = max(1, int(PROG_W * progress_ratio))
        pygame.draw.rect(display_surface, COL_PROGRESS_FILL, (PROG_X, PROG_Y, fill_w, PROG_H), border_radius=2)
        # Scrubber thumb
        thumb_x = PROG_X + fill_w - 3
        pygame.draw.rect(display_surface, (255, 255, 255), (thumb_x, PROG_Y - 2, 5, PROG_H + 4), border_radius=1)

    # Time text
    t_cur_surf = font_time.render(format_time(playback_pos), False, COL_TEXT_DIM)
    t_dur_surf = font_time.render(format_time(duration), False, COL_TEXT_DIM)
    display_surface.blit(t_cur_surf, (PROG_X, PROG_Y - 11))
    display_surface.blit(t_dur_surf, (PROG_X + PROG_W - t_dur_surf.get_width(), PROG_Y - 11))

    # Scrollbar
    if playlist:
        th = len(playlist) * PL_ITEM_H
        if th > PL_VIEW_H:
            sh = max(12, int(PL_VIEW_H * (PL_VIEW_H / th)))
            max_scroll = th - PL_VIEW_H
            sy = PL_VIEW_Y + int((PL_VIEW_H - sh) * (playlist_scroll_offset / max_scroll)) if max_scroll > 0 else PL_VIEW_Y
            # Scrollbar track
            pygame.draw.rect(display_surface, (30, 34, 42), (PL_X + PL_W - 5, PL_VIEW_Y, 3, PL_VIEW_H), border_radius=1)
            # Scrollbar thumb
            pygame.draw.rect(display_surface, (90, 95, 110), (PL_X + PL_W - 5, sy, 3, sh), border_radius=1)

    # ============ UPSCALE & FLIP ============
    scaled_screen = pygame.transform.scale(display_surface, (WINDOW_WIDTH, WINDOW_HEIGHT))
    screen.blit(scaled_screen, (0, 0))

    pygame.display.flip()
    clock.tick(FPS)

pygame.quit()

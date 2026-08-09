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
COL_BG = (230, 230, 230)
COL_TEXT = (220, 220, 230)
COL_TEXT_DIM = (120, 125, 140)
COL_TEXT_YELLOW = (255, 220, 100)
COL_TEXT_PINK = (255, 120, 180)
COL_HIGHLIGHT = (225, 60, 80)
COL_PANEL_ITEM = (45, 50, 60)
COL_PANEL_HOVER = (60, 65, 80)
COL_PANEL_ACTIVE = (75, 40, 55)

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

    # Vinyls
    VINYL_NAMES = ['red', 'blue', 'green', 'purple', 'orange', 'teal']
    vinyl_images = {}
    for vn in VINYL_NAMES:
        if os.path.exists(f"assets/vinyl/vinyl_{vn}.png"):
            vinyl_images[vn] = pygame.image.load(f"assets/vinyl/vinyl_{vn}.png").convert_alpha()

except Exception as e:
    print(f"Error loading assets: {e}")
    pygame.quit()
    exit()

# =============================================
#              FONTS (PIXELATED)
# =============================================
# We use small font sizes without anti-aliasing to get true pixel text.
font_title = pygame.font.SysFont("Consolas", 10, bold=True)
font_artist = pygame.font.SysFont("Consolas", 9)
font_item = pygame.font.SysFont("Consolas", 9)
font_time = pygame.font.SysFont("Consolas", 8)

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
        if f.lower().endswith(('.mp3', '.wav')):
            fp = os.path.join(music_dir, f)
            playlist.append(fp)
            try:
                audio = File(fp)
                if audio is not None and audio.info is not None:
                    track_durations[fp] = audio.info.length
                else:
                    # Fallback ke Pygame jika mutagen gagal
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
        # Auto-skip if corrupt
        current_track_index = (current_track_index + 1) % len(playlist)
        load_and_play(skip_count + 1)


def play_next():
    global current_track_index, playback_offset
    if not playlist: return
    old_idx = current_track_index
    if is_shuffled:
        current_track_index = random.randint(0, len(playlist) - 1)
    else:
        current_track_index = (current_track_index + 1) % len(playlist)
    trigger_vinyl_swap(old_idx, current_track_index)
    load_and_play()


def play_prev():
    global current_track_index, playback_offset
    if not playlist: return
    old_idx = current_track_index
    current_track_index = (current_track_index - 1) % len(playlist)
    trigger_vinyl_swap(old_idx, current_track_index)
    load_and_play()


def toggle_play_pause():
    global is_playing, playback_offset
    if not playlist: return
    if is_playing:
        pygame.mixer.music.pause()
        is_playing = False
    else:
        # If it's paused, get_pos() will be > 0. If it's never started, get_pos() is -1 or 0
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
#              UI LAYOUT (Base 640x360)
# =============================================

# --- State & Base Coordinates ---
T_X, T_Y = 15, 10
T_W, T_H = 370, 340
TURNTABLE_CX = T_X + 160
TURNTABLE_CY = T_Y + 150

# --- Buttons ---
rect_start_stop = pygame.Rect(T_X + 15, T_Y + 295, 46, 30)

rect_prev = pygame.Rect(T_X + 80, T_Y + 305, 16, 16)
rect_shuffle = pygame.Rect(T_X + 104, T_Y + 305, 16, 16)
rect_next = pygame.Rect(T_X + 128, T_Y + 305, 16, 16)

rect_33 = pygame.Rect(T_X + 263, T_Y + 305, 12, 12)
rect_45 = pygame.Rect(T_X + 293, T_Y + 305, 12, 12)

# --- State ---
vinyl_center = (TURNTABLE_CX, TURNTABLE_CY)
vinyl_angle = 0.0

# --- Tone Arm ---
ARM_PIVOT_ON_IMAGE = (150, 40)
ARM_PIVOT_SCREEN = (T_X + 295, T_Y + 45)  # Adjusted for new base
arm_angle_current = 0.0
ARM_ANGLE_REST = 45.0    # Benar-benar di luar piringan (ke kanan)
ARM_ANGLE_OUTER = 23.0   # Tepat di ujung luar piringan
ARM_ANGLE_INNER = 5.0    # Diubah agar tidak menabrak label
ARM_SPEED = 0.5

# --- Pitch Slider (Volume) ---
VOL_X = T_X + 325
VOL_Y = T_Y + 140
VOL_W = 24
VOL_H = 110
dragging_volume = False

# --- Playlist Panel ---
PL_X = 410
PL_Y = 10
PL_W = 215
PL_H = 340
PL_ITEM_H = 42

PL_VIEW_Y = PL_Y + 35
PL_VIEW_H = PL_H - 65

# --- Progress Bar (Moved to Playlist Panel) ---
PROG_X = PL_X + 15
PROG_Y = PL_Y + PL_H - 15
PROG_W = PL_W - 30
PROG_H = 4
dragging_progress = False
playback_offset = 0.06
playlist_scroll_offset = 0
playlist_hover_index = -1

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

running = True
while running:
    # MOUSE SCALING: Since we render at 640x360 and display at 1280x720, 
    # we MUST divide mouse coordinates by 2.
    raw_mouse = pygame.mouse.get_pos()
    mouse_pos = (raw_mouse[0] // 2, raw_mouse[1] // 2)
    dt = max(clock.get_time(), 1) / 16.67

    # ============ EVENTS ============
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        elif event.type == TRACK_END_EVENT:
            if is_playing:
                play_next()
                if playlist:
                    current_title, current_artist = get_track_info(playlist[current_track_index])

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
                        playlist_scroll_offset -= event.y * 20
                        playlist_scroll_offset = max(0, min(playlist_scroll_offset, th - PL_VIEW_H))
                    else:
                        playlist_scroll_offset = 0

    # ============ UPDATE ============
    # Vinyl rotation
    if is_playing:
        vinyl_angle -= 1.5 * dt
        if vinyl_angle <= -360:
            vinyl_angle += 360

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
        current_vinyl_img = vinyl_images[vinyl_color]

        if vinyl_swap_active:
            half = VINYL_SWAP_DURATION / 2
            if vinyl_swap_timer < half:
                t = vinyl_swap_timer / half
                old_c = track_vinyl_colors.get(vinyl_swap_old_index, 'red')
                old_img = vinyl_images[old_c]
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

    # --- Pitch Slider (Volume) ---
    knob_y = VOL_Y + int((1.0 - volume) * VOL_H)
    knob_y = max(VOL_Y, min(knob_y, VOL_Y + VOL_H - img_vol_knob.get_height()))
    display_surface.blit(img_vol_knob, (VOL_X + 2, knob_y))

    # --- Buttons ---
    if is_playing:
        display_surface.blit(img_start_stop_active, rect_start_stop.topleft)
    else:
        display_surface.blit(img_start_stop, rect_start_stop.topleft)
    
    display_surface.blit(img_prev, rect_prev.topleft)
    display_surface.blit(img_shuffle, rect_shuffle.topleft)
    display_surface.blit(img_next, rect_next.topleft)
    
    display_surface.blit(img_33, rect_33.topleft)
    display_surface.blit(img_45, rect_45.topleft)

    if is_shuffled:
        pygame.draw.rect(display_surface, (100, 255, 100), (rect_shuffle.x+4, rect_shuffle.bottom+2, 8, 2))

    # --- Current Track Text ---
    if playlist:
        t_surf = font_title.render(current_title[:20], False, COL_TEXT_YELLOW)
        a_surf = font_artist.render(current_artist[:25], False, COL_TEXT)
        display_surface.blit(t_surf, (PL_X, 12))
        display_surface.blit(a_surf, (PL_X, 26))

    # --- Playlist Panel ---
    clip_rect = pygame.Rect(PL_X, PL_VIEW_Y, PL_W, PL_VIEW_H)
    display_surface.set_clip(clip_rect)
    
    for i, track_path in enumerate(playlist):
        item_y = PL_VIEW_Y + i * PL_ITEM_H - playlist_scroll_offset
        if item_y + PL_ITEM_H < PL_VIEW_Y or item_y > PL_VIEW_Y + PL_VIEW_H:
            continue
        
        irect = pygame.Rect(PL_X, item_y, PL_W, PL_ITEM_H - 2)
        
        if i == current_track_index and (is_playing or pygame.mixer.music.get_busy()):
            pygame.draw.rect(display_surface, COL_PANEL_ACTIVE, irect)
            pygame.draw.rect(display_surface, COL_HIGHLIGHT, (irect.x, irect.y, 2, irect.h))
        elif i == playlist_hover_index:
            pygame.draw.rect(display_surface, COL_PANEL_HOVER, irect)
        else:
            pygame.draw.rect(display_surface, COL_PANEL_ITEM, irect)

        v_col_name = track_vinyl_colors.get(i, 'red')
        v_map = {'red': (225,65,85), 'blue': (50,120,210), 'green': (60,180,80),
                 'purple': (150,60,180), 'orange': (240,140,40), 'teal': (40,170,160)}
        pygame.draw.rect(display_surface, v_map.get(v_col_name, (200,200,200)), (irect.x+6, irect.centery-3, 6, 6))

        t_title, t_artist = get_track_info(track_path)
        col_t = COL_TEXT_YELLOW if i == current_track_index else COL_TEXT
        
        display_surface.blit(font_item.render(t_title[:24], False, col_t), (irect.x + 16, irect.y + 2))
        display_surface.blit(font_time.render(t_artist[:28], False, COL_TEXT_DIM), (irect.x + 16, irect.y + 14))

    display_surface.set_clip(None)

    # --- Progress Bar (in Playlist Panel) ---
    playback_pos = get_playback_pos()
    duration = track_durations.get(playlist[current_track_index], 0) if playlist else 0
    progress_ratio = min(1.0, playback_pos / duration) if duration > 0 else 0

    # Background track
    pygame.draw.rect(display_surface, (20, 22, 28), (PROG_X, PROG_Y, PROG_W, PROG_H), border_radius=2)
    
    # Fill
    if progress_ratio > 0:
        fill_w = max(1, int(PROG_W * progress_ratio))
        pygame.draw.rect(display_surface, (100, 200, 255), (PROG_X, PROG_Y, fill_w, PROG_H), border_radius=2)
        # Thumb / scrubber dot
        pygame.draw.rect(display_surface, (255, 255, 255), (PROG_X + fill_w - 2, PROG_Y - 2, 4, PROG_H + 4))

    # Time text
    t_cur_surf = font_time.render(format_time(playback_pos), False, (150, 150, 160))
    t_dur_surf = font_time.render(format_time(duration), False, (150, 150, 160))
    display_surface.blit(t_cur_surf, (PROG_X, PROG_Y - 12))
    display_surface.blit(t_dur_surf, (PROG_X + PROG_W - t_dur_surf.get_width(), PROG_Y - 12))

    if playlist:
        th = len(playlist) * PL_ITEM_H
        if th > PL_VIEW_H:
            sh = max(10, int(PL_VIEW_H * (PL_VIEW_H / th)))
            sy = PL_VIEW_Y + int((PL_VIEW_H - sh) * (playlist_scroll_offset / (th - PL_VIEW_H)))
            pygame.draw.rect(display_surface, (100, 105, 120), (PL_X + PL_W - 6, sy, 4, sh))

    # ============ UPSCALE & FLIP ============
    # Scale 640x360 -> 1280x720 (nearest neighbor interpolation)
    scaled_screen = pygame.transform.scale(display_surface, (WINDOW_WIDTH, WINDOW_HEIGHT))
    screen.blit(scaled_screen, (0, 0))

    pygame.display.flip()
    clock.tick(FPS)

pygame.quit()

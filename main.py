import pygame
import os
import math
import random
from mutagen.mp3 import MP3
from mutagen.easyid3 import EasyID3

# =============================================
#              CONFIGURATION
# =============================================
WINDOW_WIDTH = 1280
WINDOW_HEIGHT = 720
FPS = 60

# --- Color Palette ---
COL_BG = (18, 16, 32)
COL_TEXT = (230, 230, 235)
COL_TEXT_DIM = (110, 115, 135)
COL_TEXT_YELLOW = (255, 220, 100)
COL_TEXT_PINK = (255, 120, 180)
COL_HIGHLIGHT = (225, 60, 80)
COL_NEON_PINK = (255, 80, 200)
COL_NEON_CYAN = (80, 200, 255)
COL_PANEL_ITEM = (48, 52, 70)
COL_PANEL_HOVER = (62, 68, 92)
COL_PANEL_ACTIVE = (75, 40, 55)
COL_PROGRESS_BG = (40, 43, 58)
COL_PROGRESS_FILL = (255, 80, 160)

# =============================================
#              INIT PYGAME
# =============================================
pygame.init()
pygame.mixer.init()
screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
pygame.display.set_caption("Retro Groove Music Player")
clock = pygame.time.Clock()

# =============================================
#              LOAD ASSETS
# =============================================
try:
    bg_player = pygame.image.load(os.path.join("assets", "bg_player.png")).convert()
    img_empty_platter = pygame.image.load(os.path.join("assets", "empty_platter.png")).convert_alpha()
    img_tone_arm = pygame.image.load(os.path.join("assets", "tone_arm.png")).convert_alpha()

    # Multiple vinyl colors
    VINYL_NAMES = ['red', 'blue', 'green', 'purple', 'orange', 'teal']
    vinyl_images = {}
    for vn in VINYL_NAMES:
        vinyl_images[vn] = pygame.image.load(os.path.join("assets", f"vinyl_{vn}.png")).convert_alpha()

    # Buttons
    img_start_stop = pygame.image.load(os.path.join("assets", "btn_start_stop.png")).convert_alpha()
    img_start_stop_active = pygame.image.load(os.path.join("assets", "btn_start_stop_active.png")).convert_alpha()
    img_prev = pygame.image.load(os.path.join("assets", "btn_prev.png")).convert_alpha()
    img_next = pygame.image.load(os.path.join("assets", "btn_next.png")).convert_alpha()
    img_shuffle = pygame.image.load(os.path.join("assets", "btn_shuffle.png")).convert_alpha()
    img_33 = pygame.image.load(os.path.join("assets", "btn_33.png")).convert_alpha()
    img_45 = pygame.image.load(os.path.join("assets", "btn_45.png")).convert_alpha()
    img_vol_knob = pygame.image.load(os.path.join("assets", "vol_knob.png")).convert_alpha()
except Exception as e:
    print(f"Error loading assets: {e}")
    pygame.quit()
    exit()

# =============================================
#              FONTS
# =============================================
try:
    font_title = pygame.font.SysFont("Courier New", 20, bold=True)
    font_artist = pygame.font.SysFont("Courier New", 14)
    font_header = pygame.font.SysFont("Courier New", 18, bold=True)
    font_item = pygame.font.SysFont("Courier New", 13)
    font_item_sm = pygame.font.SysFont("Courier New", 11)
    font_time = pygame.font.SysFont("Courier New", 12, bold=True)
    font_label = pygame.font.SysFont("Courier New", 10)
except Exception:
    font_title = pygame.font.Font(None, 28)
    font_artist = pygame.font.Font(None, 20)
    font_header = pygame.font.Font(None, 24)
    font_item = pygame.font.Font(None, 18)
    font_item_sm = pygame.font.Font(None, 14)
    font_time = pygame.font.Font(None, 16)
    font_label = pygame.font.Font(None, 14)

# =============================================
#           AUDIO ENGINE & STATE
# =============================================
playlist = []
track_durations = {}
track_vinyl_colors = {}  # track index -> vinyl color name
current_track_index = 0
is_playing = False
is_shuffled = False
volume = 0.7

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
                if f.lower().endswith('.mp3'):
                    audio = MP3(fp)
                    track_durations[fp] = audio.info.length
                else:
                    track_durations[fp] = 0
            except Exception:
                track_durations[fp] = 0
    playlist.sort()
    # Assign a unique vinyl color to each track
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


def load_and_play():
    global is_playing
    if not playlist:
        return
    try:
        pygame.mixer.music.load(playlist[current_track_index])
        pygame.mixer.music.play()
        is_playing = True
    except Exception as e:
        print(f"Error playing track: {e}")


def play_next():
    global current_track_index
    if not playlist:
        return
    old_index = current_track_index
    if is_shuffled:
        current_track_index = random.randint(0, len(playlist) - 1)
    else:
        current_track_index = (current_track_index + 1) % len(playlist)
    trigger_vinyl_swap(old_index, current_track_index)
    load_and_play()


def play_prev():
    global current_track_index
    if not playlist:
        return
    old_index = current_track_index
    current_track_index = (current_track_index - 1) % len(playlist)
    trigger_vinyl_swap(old_index, current_track_index)
    load_and_play()


def stop_music():
    global is_playing
    pygame.mixer.music.stop()
    is_playing = False


def toggle_play_pause():
    global is_playing
    if not playlist:
        return
    if is_playing:
        pygame.mixer.music.pause()
        is_playing = False
    else:
        if not pygame.mixer.music.get_busy() and pygame.mixer.music.get_pos() == -1:
            load_and_play()
        else:
            pygame.mixer.music.unpause()
            is_playing = True


def play_track(index):
    global current_track_index
    if not playlist or index < 0 or index >= len(playlist):
        return
    old_index = current_track_index
    current_track_index = index
    trigger_vinyl_swap(old_index, current_track_index)
    load_and_play()


def get_playback_pos():
    pos = pygame.mixer.music.get_pos()
    if pos == -1:
        return 0
    return pos / 1000.0


# =============================================
#       VINYL SWAP ANIMATION
# =============================================
vinyl_swap_active = False
vinyl_swap_timer = 0.0
VINYL_SWAP_DURATION = 40.0  # frames
vinyl_swap_old_index = 0
vinyl_swap_new_index = 0


def trigger_vinyl_swap(old_idx, new_idx):
    global vinyl_swap_active, vinyl_swap_timer
    global vinyl_swap_old_index, vinyl_swap_new_index
    if old_idx == new_idx:
        return
    vinyl_swap_active = True
    vinyl_swap_timer = 0.0
    vinyl_swap_old_index = old_idx
    vinyl_swap_new_index = new_idx


# =============================================
#       PARTICLES
# =============================================
particles = []
particle_timer = 0


def update_particles():
    global particle_timer
    particle_timer += 1

    if is_playing and particle_timer % 4 == 0:
        angle = random.uniform(0, 2 * math.pi)
        r = random.uniform(225, 245)
        x = TURNTABLE_CX + math.cos(angle) * r
        y = TURNTABLE_CY + math.sin(angle) * r
        col = random.choice([COL_NEON_PINK, COL_NEON_CYAN, COL_TEXT_YELLOW])
        particles.append({
            'x': x, 'y': y,
            'vx': math.cos(angle) * random.uniform(0.2, 0.6),
            'vy': math.sin(angle) * random.uniform(0.2, 0.6),
            'life': random.randint(25, 50),
            'max_life': random.randint(25, 50),
            'col': col,
            'size': random.randint(2, 3)
        })

    for p in particles[:]:
        p['x'] += p['vx']
        p['y'] += p['vy']
        p['life'] -= 1
        if p['life'] <= 0:
            particles.remove(p)


# =============================================
#       EQ BARS
# =============================================
NUM_EQ_BARS = 18
eq_heights = [0.0] * NUM_EQ_BARS
eq_targets = [0.0] * NUM_EQ_BARS
eq_timer = 0


def update_eq_bars():
    global eq_timer
    eq_timer += 1
    if eq_timer % 5 == 0:
        for i in range(NUM_EQ_BARS):
            if is_playing:
                eq_targets[i] = random.uniform(0.15, 1.0)
            else:
                eq_targets[i] = 0.0
    for i in range(NUM_EQ_BARS):
        eq_heights[i] += (eq_targets[i] - eq_heights[i]) * 0.12


# =============================================
#              UI LAYOUT
# =============================================

# --- Turntable ---
TURNTABLE_CX = 370
TURNTABLE_CY = 310
vinyl_center = (TURNTABLE_CX, TURNTABLE_CY)
vinyl_angle = 0.0

# --- Tone Arm ---
ARM_PIVOT_ON_IMAGE = (300, 75)
ARM_PIVOT_SCREEN = (620, 100)
arm_angle_current = 0.0
ARM_ANGLE_REST = 30.0
ARM_ANGLE_OUTER = 2.0    # start of song (outer groove)
ARM_ANGLE_INNER = -12.0   # end of song (near label)
ARM_SPEED = 0.5

# --- START/STOP Button ---
rect_start_stop = pygame.Rect(47, 618, 100, 55)

# --- Mini buttons ---
rect_prev = pygame.Rect(175, 638, 44, 44)
rect_next = pygame.Rect(230, 638, 44, 44)
rect_shuffle = pygame.Rect(285, 638, 44, 44)

# --- Speed buttons ---
rect_33 = pygame.Rect(645, 635, 36, 36)
rect_45 = pygame.Rect(695, 635, 36, 36)

# --- Volume slider (vertical) ---
VOL_SLIDER_X = 730
VOL_SLIDER_Y = 108
VOL_SLIDER_W = 32
VOL_SLIDER_H = 435
dragging_volume = False

# --- Progress bar ---
PROG_X = 50
PROG_Y = 598
PROG_W = 700
PROG_H = 6

# --- Playlist Panel ---
PL_X = 860
PL_Y = 100
PL_W = 380
PL_H = 570
PL_ITEM_H = 52
playlist_scroll_offset = 0
playlist_hover_index = -1

# =============================================
#              MAIN LOOP
# =============================================
scan_music_folder()

if playlist:
    current_title, current_artist = get_track_info(playlist[current_track_index])
else:
    current_title = "NO MUSIC FOUND"
    current_artist = "Drop .mp3/.wav files into 'music' folder"

arm_angle_current = ARM_ANGLE_REST

running = True
while running:
    mouse_pos = pygame.mouse.get_pos()
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
            pos = event.pos

            # Start/Stop
            if rect_start_stop.collidepoint(pos):
                toggle_play_pause()
                if playlist:
                    current_title, current_artist = get_track_info(playlist[current_track_index])

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

            # Progress seek
            elif PROG_X <= pos[0] <= PROG_X + PROG_W and PROG_Y - 8 <= pos[1] <= PROG_Y + PROG_H + 8:
                if playlist and is_playing:
                    duration = track_durations.get(playlist[current_track_index], 0)
                    if duration > 0:
                        ratio = (pos[0] - PROG_X) / PROG_W
                        pygame.mixer.music.play(start=ratio * duration)

            # Volume drag start
            elif (VOL_SLIDER_X <= pos[0] <= VOL_SLIDER_X + VOL_SLIDER_W and
                  VOL_SLIDER_Y <= pos[1] <= VOL_SLIDER_Y + VOL_SLIDER_H):
                dragging_volume = True
                rel_y = pos[1] - VOL_SLIDER_Y
                volume = 1.0 - max(0.0, min(1.0, rel_y / VOL_SLIDER_H))
                pygame.mixer.music.set_volume(volume)

            # Playlist click
            elif PL_X <= pos[0] <= PL_X + PL_W and PL_Y <= pos[1] <= PL_Y + PL_H:
                rel_y = pos[1] - PL_Y + playlist_scroll_offset
                clicked_idx = int(rel_y // PL_ITEM_H)
                if 0 <= clicked_idx < len(playlist):
                    play_track(clicked_idx)
                    current_title, current_artist = get_track_info(playlist[current_track_index])

        elif event.type == pygame.MOUSEBUTTONUP:
            dragging_volume = False

        elif event.type == pygame.MOUSEMOTION:
            if dragging_volume:
                rel_y = event.pos[1] - VOL_SLIDER_Y
                volume = 1.0 - max(0.0, min(1.0, rel_y / VOL_SLIDER_H))
                pygame.mixer.music.set_volume(volume)

        elif event.type == pygame.MOUSEWHEEL:
            if PL_X <= mouse_pos[0] <= PL_X + PL_W:
                max_scroll = max(0, len(playlist) * PL_ITEM_H - PL_H)
                playlist_scroll_offset -= event.y * 35
                playlist_scroll_offset = max(0, min(playlist_scroll_offset, max_scroll))

    # ============ UPDATE ============

    # Vinyl rotation
    if is_playing:
        vinyl_angle -= 1.0 * dt
        if vinyl_angle <= -360:
            vinyl_angle += 360

    # Tone arm: follow playback position when playing
    if is_playing and playlist:
        playback_pos = get_playback_pos()
        duration = track_durations.get(playlist[current_track_index], 0)
        if duration > 0:
            progress = min(1.0, playback_pos / duration)
            # Interpolate from outer groove to inner groove
            target_arm = ARM_ANGLE_OUTER + (ARM_ANGLE_INNER - ARM_ANGLE_OUTER) * progress
        else:
            target_arm = ARM_ANGLE_OUTER
    else:
        target_arm = ARM_ANGLE_REST

    # Smooth arm movement
    diff = target_arm - arm_angle_current
    if abs(diff) > 0.05:
        arm_angle_current += diff * 0.08 * dt
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
    if PL_X <= mouse_pos[0] <= PL_X + PL_W and PL_Y <= mouse_pos[1] <= PL_Y + PL_H:
        rel_y = mouse_pos[1] - PL_Y + playlist_scroll_offset
        h_idx = int(rel_y // PL_ITEM_H)
        if 0 <= h_idx < len(playlist):
            playlist_hover_index = h_idx

    update_eq_bars()
    update_particles()

    # ============ RENDER ============
    screen.blit(bg_player, (0, 0))

    # --- Particles ---
    for p in particles:
        alpha = int(200 * (p['life'] / p['max_life']))
        ps = pygame.Surface((p['size'] * 2, p['size'] * 2), pygame.SRCALPHA)
        pygame.draw.circle(ps, (*p['col'], min(255, alpha)), (p['size'], p['size']), p['size'])
        screen.blit(ps, (int(p['x'] - p['size']), int(p['y'] - p['size'])))

    # --- Empty platter (always visible as base) ---
    platter_rect = img_empty_platter.get_rect(center=vinyl_center)
    screen.blit(img_empty_platter, platter_rect.topleft)

    # --- Vinyl Record (only when playing or has played) ---
    if is_playing or (playlist and pygame.mixer.music.get_busy()):
        vinyl_color = track_vinyl_colors.get(current_track_index, 'red')
        current_vinyl_img = vinyl_images[vinyl_color]

        if vinyl_swap_active:
            # Animation: old vinyl lifts up (fades out), new one drops in (fades in)
            half = VINYL_SWAP_DURATION / 2
            if vinyl_swap_timer < half:
                # Phase 1: old vinyl goes up & fades
                t = vinyl_swap_timer / half  # 0 to 1
                old_color = track_vinyl_colors.get(vinyl_swap_old_index, 'red')
                old_img = vinyl_images[old_color]
                rotated = pygame.transform.rotate(old_img, vinyl_angle)
                # Scale down slightly
                scale = 1.0 - t * 0.15
                scaled = pygame.transform.smoothscale(rotated,
                    (int(rotated.get_width() * scale), int(rotated.get_height() * scale)))
                # Fade
                scaled.set_alpha(int(255 * (1.0 - t)))
                r = scaled.get_rect(center=(vinyl_center[0], vinyl_center[1] - t * 60))
                screen.blit(scaled, r.topleft)
            else:
                # Phase 2: new vinyl drops in & fades in
                t = (vinyl_swap_timer - half) / half  # 0 to 1
                rotated = pygame.transform.rotate(current_vinyl_img, vinyl_angle)
                scale = 0.85 + t * 0.15
                scaled = pygame.transform.smoothscale(rotated,
                    (int(rotated.get_width() * scale), int(rotated.get_height() * scale)))
                scaled.set_alpha(int(255 * t))
                r = scaled.get_rect(center=(vinyl_center[0], vinyl_center[1] - (1 - t) * 60))
                screen.blit(scaled, r.topleft)
        else:
            # Normal rotation
            rotated = pygame.transform.rotate(current_vinyl_img, vinyl_angle)
            r = rotated.get_rect(center=vinyl_center)
            screen.blit(rotated, r.topleft)

    # --- Tone Arm ---
    rotated_arm = pygame.transform.rotate(img_tone_arm, arm_angle_current)
    orig_w, orig_h = img_tone_arm.get_size()
    dx = ARM_PIVOT_ON_IMAGE[0] - orig_w / 2
    dy = ARM_PIVOT_ON_IMAGE[1] - orig_h / 2
    rad = math.radians(-arm_angle_current)
    rdx = dx * math.cos(rad) - dy * math.sin(rad)
    rdy = dx * math.sin(rad) + dy * math.cos(rad)
    rot_w, rot_h = rotated_arm.get_size()
    arm_x = ARM_PIVOT_SCREEN[0] - rot_w / 2 - rdx
    arm_y = ARM_PIVOT_SCREEN[1] - rot_h / 2 - rdy
    screen.blit(rotated_arm, (arm_x, arm_y))

    # --- Track Info ---
    if playlist:
        title_surf = font_title.render(current_title[:38], True, COL_TEXT)
        artist_surf = font_artist.render(current_artist[:45], True, COL_TEXT_DIM)
        screen.blit(title_surf, (PROG_X, PROG_Y - 42))
        screen.blit(artist_surf, (PROG_X, PROG_Y - 24))

    # --- Progress Bar ---
    playback_pos = get_playback_pos()
    duration = track_durations.get(playlist[current_track_index], 0) if playlist else 0
    progress_ratio = min(1.0, playback_pos / duration) if duration > 0 else 0

    pygame.draw.rect(screen, COL_PROGRESS_BG, (PROG_X, PROG_Y, PROG_W, PROG_H), border_radius=3)
    if progress_ratio > 0:
        fill_w = max(1, int(PROG_W * progress_ratio))
        pygame.draw.rect(screen, COL_PROGRESS_FILL, (PROG_X, PROG_Y, fill_w, PROG_H), border_radius=3)
        pygame.draw.circle(screen, (255, 255, 255), (PROG_X + fill_w, PROG_Y + PROG_H // 2), 4)

    time_cur = font_time.render(format_time(playback_pos), True, COL_TEXT_DIM)
    time_dur = font_time.render(format_time(duration), True, COL_TEXT_DIM)
    screen.blit(time_cur, (PROG_X, PROG_Y + 10))
    screen.blit(time_dur, (PROG_X + PROG_W - time_dur.get_width(), PROG_Y + 10))

    # --- EQ Bars ---
    eq_x = TURNTABLE_CX - (NUM_EQ_BARS * 7) // 2
    eq_base_y = PROG_Y - 52
    for i in range(NUM_EQ_BARS):
        bar_h = int(eq_heights[i] * 20)
        if bar_h < 1:
            continue
        t = i / NUM_EQ_BARS
        cr = int(255 * (1 - t))
        cg = int(80 + 140 * t)
        cb = int(180 * t + 75)
        col = (min(255, cr), min(255, cg), min(255, cb))
        pygame.draw.rect(screen, col, (eq_x + i * 7, eq_base_y - bar_h, 4, bar_h), border_radius=1)

    # --- START/STOP Button ---
    if is_playing:
        screen.blit(img_start_stop_active, rect_start_stop.topleft)
    else:
        screen.blit(img_start_stop, rect_start_stop.topleft)

    # --- Mini Buttons ---
    for img, rect in [(img_prev, rect_prev), (img_next, rect_next), (img_shuffle, rect_shuffle)]:
        # Hover glow
        if rect.collidepoint(mouse_pos):
            glow = pygame.Surface((rect.w + 6, rect.h + 6), pygame.SRCALPHA)
            pygame.draw.circle(glow, (255, 255, 255, 20),
                               (rect.w // 2 + 3, rect.h // 2 + 3), rect.w // 2 + 3)
            screen.blit(glow, (rect.x - 3, rect.y - 3))
        screen.blit(img, rect.topleft)

    # Shuffle active indicator
    if is_shuffled:
        pygame.draw.circle(screen, COL_NEON_CYAN,
                           (rect_shuffle.centerx, rect_shuffle.bottom + 6), 3)

    # --- Speed Buttons ---
    screen.blit(img_33, rect_33.topleft)
    screen.blit(img_45, rect_45.topleft)

    # --- Vertical Volume Slider ---
    # Slider track is drawn in background already
    # Draw fill (from bottom up)
    fill_h = int(VOL_SLIDER_H * volume)
    fill_y = VOL_SLIDER_Y + VOL_SLIDER_H - fill_h

    # Green/yellow/red fill
    for y in range(fill_y, VOL_SLIDER_Y + VOL_SLIDER_H):
        t_local = (y - VOL_SLIDER_Y) / VOL_SLIDER_H
        if t_local < 0.3:
            col = (200, 55, 55)
        elif t_local < 0.6:
            col = (200, 200, 55)
        else:
            col = (55, 200, 75)
        pygame.draw.line(screen, col, (VOL_SLIDER_X + 8, y), (VOL_SLIDER_X + VOL_SLIDER_W - 8, y))

    # Knob
    knob_y = fill_y - img_vol_knob.get_height() // 2
    knob_y = max(VOL_SLIDER_Y - 5, min(knob_y, VOL_SLIDER_Y + VOL_SLIDER_H - 10))
    screen.blit(img_vol_knob, (VOL_SLIDER_X, knob_y))

    # Volume label
    vol_label = font_label.render(f"{int(volume * 100)}%", True, COL_TEXT_DIM)
    screen.blit(vol_label, (VOL_SLIDER_X + 4, VOL_SLIDER_Y + VOL_SLIDER_H + 8))

    # ===== PLAYLIST PANEL =====
    # Header
    header_surf = font_header.render("♫  PLAYLIST", True, COL_TEXT_YELLOW)
    screen.blit(header_surf, (PL_X + 10, 48))
    count_surf = font_item_sm.render(f"{len(playlist)} tracks", True, COL_TEXT_DIM)
    screen.blit(count_surf, (PL_X + PL_W - count_surf.get_width() - 12, 55))

    # Clip
    playlist_clip = pygame.Rect(PL_X, PL_Y, PL_W, PL_H)
    screen.set_clip(playlist_clip)

    for i, track_path in enumerate(playlist):
        item_y = PL_Y + i * PL_ITEM_H - playlist_scroll_offset
        if item_y + PL_ITEM_H < PL_Y or item_y > PL_Y + PL_H:
            continue

        item_rect = pygame.Rect(PL_X + 5, item_y + 3, PL_W - 10, PL_ITEM_H - 6)

        if i == current_track_index and (is_playing or pygame.mixer.music.get_busy()):
            bg_col = COL_PANEL_ACTIVE
        elif i == playlist_hover_index:
            bg_col = COL_PANEL_HOVER
        else:
            bg_col = COL_PANEL_ITEM

        pygame.draw.rect(screen, bg_col, item_rect, border_radius=8)

        # Active bar
        if i == current_track_index:
            pygame.draw.rect(screen, COL_HIGHLIGHT,
                             (item_rect.x, item_rect.y + 5, 4, item_rect.h - 10), border_radius=2)
            if is_playing:
                dot_a = int(180 + 75 * math.sin(pygame.time.get_ticks() / 200))
                ds = pygame.Surface((8, 8), pygame.SRCALPHA)
                pygame.draw.circle(ds, (255, 80, 120, min(255, dot_a)), (4, 4), 4)
                screen.blit(ds, (item_rect.x + 11, item_rect.centery - 4))

        # Vinyl color dot
        v_col_name = track_vinyl_colors.get(i, 'red')
        v_col_map = {
            'red': (225, 65, 85), 'blue': (50, 120, 210), 'green': (55, 170, 80),
            'purple': (140, 60, 180), 'orange': (230, 130, 40), 'teal': (40, 160, 150)
        }
        pygame.draw.circle(screen, v_col_map.get(v_col_name, (200, 200, 200)),
                           (item_rect.x + 24, item_rect.centery), 5)

        # Number
        num_col = COL_TEXT_PINK if i == current_track_index else COL_TEXT_DIM
        num_surf = font_item_sm.render(f"{i + 1:02d}", True, num_col)
        screen.blit(num_surf, (item_rect.x + 34, item_rect.y + 8))

        # Title & artist
        t_title, t_artist = get_track_info(track_path)
        title_col = COL_TEXT_YELLOW if i == current_track_index else COL_TEXT
        name_surf = font_item.render(t_title[:28], True, title_col)
        screen.blit(name_surf, (item_rect.x + 58, item_rect.y + 5))
        art_surf = font_item_sm.render(t_artist[:32], True, COL_TEXT_DIM)
        screen.blit(art_surf, (item_rect.x + 58, item_rect.y + 24))

        # Duration
        dur = track_durations.get(track_path, 0)
        if dur > 0:
            dur_surf = font_item_sm.render(format_time(dur), True, COL_TEXT_DIM)
            screen.blit(dur_surf, (item_rect.right - dur_surf.get_width() - 10, item_rect.y + 14))

    screen.set_clip(None)

    # Scrollbar
    if playlist:
        total_h = len(playlist) * PL_ITEM_H
        if total_h > PL_H:
            sb_h = max(20, int(PL_H * (PL_H / total_h)))
            sb_y = PL_Y + int((PL_H - sb_h) * (playlist_scroll_offset / max(1, total_h - PL_H)))
            pygame.draw.rect(screen, (50, 54, 70), (PL_X + PL_W - 10, PL_Y, 6, PL_H), border_radius=3)
            pygame.draw.rect(screen, (125, 130, 150), (PL_X + PL_W - 10, sb_y, 6, sb_h), border_radius=3)

    # ===== FLIP =====
    pygame.display.flip()
    clock.tick(FPS)

pygame.quit()

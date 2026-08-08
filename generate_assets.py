import pygame
import os
import math

os.makedirs('assets', exist_ok=True)
pygame.init()

# =============================================
#   MAIN BACKGROUND (1280x720)
# =============================================
def create_bg_player():
    W, H = 1280, 720
    surf = pygame.Surface((W, H))

    # Gradient background
    for y in range(H):
        t = y / H
        r = int(18 + t * 10)
        g = int(16 + t * 6)
        b = int(32 + t * 15)
        pygame.draw.line(surf, (r, g, b), (0, y), (W, y))

    # ===== LEFT: Turntable shell =====
    pygame.draw.rect(surf, (42, 46, 62), (20, 20, 800, 680), border_radius=20)
    pygame.draw.rect(surf, (35, 38, 52), (24, 24, 792, 672), border_radius=18)
    # Inner darker area
    pygame.draw.rect(surf, (45, 48, 65), (34, 34, 772, 652), border_radius=14)

    # Neon rim glow
    cx, cy = 370, 310
    for i in range(3):
        w = max(1, 6 - i * 2)
        pink = (255, min(255, 80 + i * 25), min(255, 200 + i * 20))
        cyan = (min(255, 80 + i * 25), min(255, 200 + i * 20), 255)
        pygame.draw.arc(surf, pink, (cx - 248, cy - 248, 496, 496),
                        math.radians(70), math.radians(290), w)
        pygame.draw.arc(surf, cyan, (cx - 248, cy - 248, 496, 496),
                        math.radians(-110), math.radians(70), w)

    # ===== VOLUME SLIDER AREA (right of turntable, inside shell) =====
    # Track/groove for slider
    sl_x, sl_y, sl_w, sl_h = 730, 100, 40, 450
    pygame.draw.rect(surf, (30, 33, 45), (sl_x, sl_y, sl_w, sl_h), border_radius=8)
    pygame.draw.rect(surf, (38, 40, 55), (sl_x + 4, sl_y + 4, sl_w - 8, sl_h - 8), border_radius=6)
    # Notches / LED indicators
    for i in range(10):
        ny = sl_y + 20 + i * 42
        if i < 3:
            col = (60, 200, 80)  # green
        elif i < 6:
            col = (200, 200, 60)  # yellow
        else:
            col = (200, 60, 60)  # red (bottom = low volume)
        pygame.draw.rect(surf, col, (sl_x + 10, ny, 20, 3))

    # ===== BOTTOM CONTROLS AREA =====
    # START/STOP button area (bottom left)
    pygame.draw.rect(surf, (25, 28, 38), (40, 610, 120, 70), border_radius=10)
    pygame.draw.rect(surf, (32, 35, 48), (44, 614, 112, 62), border_radius=8)

    # Speed buttons area (bottom right of turntable)
    pygame.draw.rect(surf, (25, 28, 38), (630, 625, 130, 50), border_radius=8)

    # Top left knob
    pygame.draw.circle(surf, (30, 33, 45), (75, 70), 22)
    pygame.draw.circle(surf, (200, 50, 55), (75, 70), 8)

    # ===== RIGHT: Playlist panel =====
    pygame.draw.rect(surf, (30, 33, 48), (840, 20, 420, 680), border_radius=20)
    pygame.draw.rect(surf, (38, 42, 58), (850, 30, 400, 660), border_radius=14)
    # Header
    pygame.draw.rect(surf, (48, 52, 70), (860, 40, 380, 50), border_radius=10)
    pygame.draw.line(surf, (65, 70, 90), (865, 95), (1235, 95), 1)

    pygame.image.save(surf, 'assets/bg_player.png')


# =============================================
#   EMPTY PLATTER (no vinyl on it)
# =============================================
def create_empty_platter():
    size = 480
    surf = pygame.Surface((size, size), pygame.SRCALPHA)
    c = size // 2

    # Metal platter
    for r in range(240, 200, -1):
        t = (r - 200) / 40
        v = int(45 + t * 15)
        pygame.draw.circle(surf, (v, v + 2, v + 5), (c, c), r)

    # Platter rings
    for r in range(210, 100, -20):
        pygame.draw.circle(surf, (55, 58, 65), (c, c), r, 1)

    # Rubber mat
    pygame.draw.circle(surf, (35, 38, 42), (c, c), 200)
    for r in range(180, 30, -15):
        pygame.draw.circle(surf, (40, 43, 48), (c, c), r, 1)

    # Spindle
    pygame.draw.circle(surf, (180, 185, 195), (c, c), 8)
    pygame.draw.circle(surf, (220, 225, 235), (c, c), 5)
    pygame.draw.circle(surf, (140, 145, 155), (c, c), 3)

    pygame.image.save(surf, 'assets/empty_platter.png')


# =============================================
#   VINYL RECORDS (multiple colors)
# =============================================
VINYL_COLORS = {
    'red':    {'label': (225, 65, 85),  'accent': (255, 220, 100)},
    'blue':   {'label': (50, 120, 210), 'accent': (180, 220, 255)},
    'green':  {'label': (55, 170, 80),  'accent': (200, 255, 180)},
    'purple': {'label': (140, 60, 180), 'accent': (220, 180, 255)},
    'orange': {'label': (230, 130, 40), 'accent': (255, 230, 150)},
    'teal':   {'label': (40, 160, 150), 'accent': (180, 255, 240)},
}

def create_vinyl(name, label_col, accent_col):
    size = 460
    surf = pygame.Surface((size, size), pygame.SRCALPHA)
    c = size // 2

    # Outer glow
    for i in range(4):
        glow = pygame.Surface((size, size), pygame.SRCALPHA)
        pygame.draw.circle(glow, (label_col[0], label_col[1], label_col[2], max(0, 20 - i * 5)),
                           (c, c), 228 - i, 3)
        surf.blit(glow, (0, 0))

    # Black vinyl
    pygame.draw.circle(surf, (18, 20, 22), (c, c), 222)

    # Grooves
    for r in range(75, 218, 6):
        col_v = 28 + (r % 12 == 0) * 8
        pygame.draw.circle(surf, (col_v, col_v + 2, col_v + 5), (c, c), r, 1)

    # Reflections
    refl = pygame.Surface((size, size), pygame.SRCALPHA)
    pygame.draw.arc(refl, (60, 62, 72, 100), (c - 210, c - 210, 420, 420),
                    math.radians(20), math.radians(55), 18)
    pygame.draw.arc(refl, (55, 57, 67, 70), (c - 210, c - 210, 420, 420),
                    math.radians(200), math.radians(235), 12)
    surf.blit(refl, (0, 0))

    # Center label (gradient)
    for r in range(70, 0, -1):
        t = r / 70
        lr = int(label_col[0] * t + label_col[0] * 0.8 * (1 - t))
        lg = int(label_col[1] * t + label_col[1] * 0.6 * (1 - t))
        lb = int(label_col[2] * t + label_col[2] * 0.7 * (1 - t))
        pygame.draw.circle(surf, (min(255, lr + 20), min(255, lg + 15), min(255, lb + 10)), (c, c), r)

    # Label ring
    pygame.draw.circle(surf, accent_col, (c, c), 65, 2)
    pygame.draw.circle(surf, accent_col, (c, c), 45, 1)

    # Pixel dots
    for x in range(c - 30, c - 6, 8):
        pygame.draw.rect(surf, accent_col, (x, c - 3, 4, 4))
    for x in range(c + 8, c + 32, 8):
        pygame.draw.rect(surf, accent_col, (x, c - 3, 4, 4))

    # Spindle hole
    pygame.draw.circle(surf, (190, 195, 205), (c, c), 6)
    pygame.draw.circle(surf, (90, 95, 105), (c, c), 3)

    pygame.image.save(surf, f'assets/vinyl_{name}.png')


# =============================================
#   TONE ARM
# =============================================
def create_tone_arm():
    size = 400
    surf = pygame.Surface((size, size), pygame.SRCALPHA)

    pivot = (300, 75)
    end = (90, 345)

    # Base mount
    pygame.draw.circle(surf, (22, 25, 35), (pivot[0] + 3, pivot[1] + 3), 48)
    pygame.draw.circle(surf, (40, 44, 56), pivot, 46)
    pygame.draw.circle(surf, (28, 31, 42), pivot, 46, 4)
    pygame.draw.circle(surf, (58, 62, 76), pivot, 32)
    pygame.draw.circle(surf, (125, 130, 145), pivot, 16)
    pygame.draw.circle(surf, (170, 175, 190), (pivot[0] - 4, pivot[1] - 4), 5)

    # Arm shadow
    pygame.draw.line(surf, (18, 20, 28), (pivot[0] + 3, pivot[1] + 3),
                     (end[0] + 3, end[1] + 3), 12)
    # Arm body
    pygame.draw.line(surf, (170, 175, 190), pivot, end, 8)
    # Highlight
    pygame.draw.line(surf, (215, 220, 235), (pivot[0] - 2, pivot[1] - 2),
                     (end[0] - 2, end[1] - 2), 2)

    # S-curve detail near end
    mid_x = (pivot[0] + end[0]) // 2 + 20
    mid_y = (pivot[1] + end[1]) // 2
    pygame.draw.line(surf, (155, 160, 175), (mid_x, mid_y - 10), (mid_x - 5, mid_y + 10), 6)

    # Cartridge
    pygame.draw.polygon(surf, (85, 90, 105), [
        (end[0] - 10, end[1] - 10), (end[0] + 10, end[1]),
        (end[0], end[1] + 25), (end[0] - 20, end[1] + 12)
    ])
    pygame.draw.rect(surf, (25, 28, 32), (end[0] - 14, end[1] + 6, 18, 15), border_radius=2)
    # Stylus LED
    pygame.draw.circle(surf, (255, 35, 35), (end[0] - 8, end[1] + 25), 3)
    pygame.draw.circle(surf, (255, 100, 100), (end[0] - 8, end[1] + 25), 1)

    # Counterweight
    pygame.draw.ellipse(surf, (80, 85, 100), (332, 48, 36, 50))
    pygame.draw.ellipse(surf, (95, 100, 118), (335, 51, 30, 44))

    pygame.image.save(surf, 'assets/tone_arm.png')


# =============================================
#   BUTTONS - Turntable style (like reference)
# =============================================

# START/STOP button
def create_start_stop_btn():
    w, h = 100, 55
    surf = pygame.Surface((w, h), pygame.SRCALPHA)

    # Outer border
    pygame.draw.rect(surf, (0, 0, 0), (0, 0, w, h), border_radius=6)
    # Dark face
    pygame.draw.rect(surf, (30, 33, 42), (3, 3, w - 6, h - 6), border_radius=4)
    # Bevel
    pygame.draw.rect(surf, (45, 48, 60), (5, 5, w - 10, h - 10), border_radius=3)
    pygame.draw.rect(surf, (35, 38, 50), (7, 7, w - 14, h - 14), border_radius=2)

    # Red LED
    pygame.draw.circle(surf, (200, 45, 45), (18, 15), 5)
    pygame.draw.circle(surf, (255, 80, 80), (18, 15), 2)

    # Text
    font = pygame.font.SysFont("Courier New", 13, bold=True)
    t1 = font.render("START", True, (200, 200, 210))
    t2 = font.render("STOP", True, (200, 200, 210))
    surf.blit(t1, (28, 10))
    surf.blit(t2, (32, 28))

    pygame.image.save(surf, 'assets/btn_start_stop.png')


# START/STOP active (green LED)
def create_start_stop_active():
    w, h = 100, 55
    surf = pygame.Surface((w, h), pygame.SRCALPHA)

    pygame.draw.rect(surf, (0, 0, 0), (0, 0, w, h), border_radius=6)
    pygame.draw.rect(surf, (30, 33, 42), (3, 3, w - 6, h - 6), border_radius=4)
    pygame.draw.rect(surf, (45, 48, 60), (5, 5, w - 10, h - 10), border_radius=3)
    pygame.draw.rect(surf, (35, 38, 50), (7, 7, w - 14, h - 14), border_radius=2)

    # Green LED
    pygame.draw.circle(surf, (50, 220, 80), (18, 15), 5)
    pygame.draw.circle(surf, (120, 255, 140), (18, 15), 2)

    font = pygame.font.SysFont("Courier New", 13, bold=True)
    t1 = font.render("START", True, (200, 200, 210))
    t2 = font.render("STOP", True, (200, 200, 210))
    surf.blit(t1, (28, 10))
    surf.blit(t2, (32, 28))

    pygame.image.save(surf, 'assets/btn_start_stop_active.png')


# Prev/Next mini buttons
def create_mini_btn(filename, draw_func):
    size = 44
    surf = pygame.Surface((size, size), pygame.SRCALPHA)

    # Dark circle button
    pygame.draw.circle(surf, (0, 0, 0), (size // 2, size // 2), size // 2)
    pygame.draw.circle(surf, (50, 54, 68), (size // 2, size // 2), size // 2 - 2)
    pygame.draw.circle(surf, (40, 44, 58), (size // 2, size // 2), size // 2 - 4)

    # Highlight
    pygame.draw.arc(surf, (70, 75, 90), (4, 4, size - 8, size - 8),
                    math.radians(200), math.radians(340), 2)

    draw_func(surf, size)
    pygame.image.save(surf, f'assets/{filename}.png')


def mini_icon_prev(surf, s):
    m = s // 2
    pygame.draw.rect(surf, (200, 200, 210), (m - 12, m - 8, 4, 16))
    pygame.draw.polygon(surf, (200, 200, 210), [(m - 4, m), (m + 10, m - 8), (m + 10, m + 8)])

def mini_icon_next(surf, s):
    m = s // 2
    pygame.draw.polygon(surf, (200, 200, 210), [(m - 10, m - 8), (m - 10, m + 8), (m + 4, m)])
    pygame.draw.rect(surf, (200, 200, 210), (m + 8, m - 8, 4, 16))

def mini_icon_shuffle(surf, s):
    m = s // 2
    pygame.draw.line(surf, (200, 200, 210), (m - 8, m - 5), (m + 8, m + 5), 2)
    pygame.draw.line(surf, (200, 200, 210), (m - 8, m + 5), (m + 8, m - 5), 2)
    pygame.draw.polygon(surf, (200, 200, 210), [(m + 4, m), (m + 10, m + 6), (m + 4, m + 6)])
    pygame.draw.polygon(surf, (200, 200, 210), [(m + 4, m), (m + 10, m - 6), (m + 4, m - 6)])


# Speed buttons (33 / 45)
def create_speed_btns():
    font = pygame.font.SysFont("Courier New", 16, bold=True)

    for label, color, fname in [("33", (255, 60, 80), "btn_33"),
                                 ("45", (60, 140, 255), "btn_45")]:
        size = 36
        surf = pygame.Surface((size, size), pygame.SRCALPHA)
        pygame.draw.circle(surf, (0, 0, 0), (size // 2, size // 2), size // 2)
        pygame.draw.circle(surf, color, (size // 2, size // 2), size // 2 - 3)
        # Inner highlight
        pygame.draw.circle(surf, tuple(min(255, c + 40) for c in color),
                           (size // 2 - 2, size // 2 - 2), 4)
        t = font.render(label, True, (255, 255, 255))
        surf.blit(t, (size // 2 - t.get_width() // 2, size // 2 - t.get_height() // 2))
        pygame.image.save(surf, f'assets/{fname}.png')


# Volume slider knob
def create_vol_knob():
    w, h = 32, 18
    surf = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.rect(surf, (0, 0, 0), (0, 0, w, h), border_radius=4)
    pygame.draw.rect(surf, (120, 125, 140), (2, 2, w - 4, h - 4), border_radius=3)
    # Center line
    pygame.draw.line(surf, (180, 185, 200), (6, h // 2), (w - 6, h // 2), 2)
    # Top highlight
    pygame.draw.line(surf, (160, 165, 180), (4, 4), (w - 4, 4), 1)
    pygame.image.save(surf, 'assets/vol_knob.png')


# ============ GENERATE ALL ============
create_bg_player()
create_empty_platter()
create_tone_arm()

for name, cols in VINYL_COLORS.items():
    create_vinyl(name, cols['label'], cols['accent'])

create_start_stop_btn()
create_start_stop_active()
create_mini_btn('btn_prev', mini_icon_prev)
create_mini_btn('btn_next', mini_icon_next)
create_mini_btn('btn_shuffle', mini_icon_shuffle)
create_speed_btns()
create_vol_knob()

print("All premium assets generated!")

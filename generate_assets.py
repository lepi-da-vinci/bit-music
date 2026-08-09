import pygame
import os
import math

os.makedirs('assets/bg', exist_ok=True)
os.makedirs('assets/vinyl', exist_ok=True)
os.makedirs('assets/buttons', exist_ok=True)
pygame.init()

# ============================================================
#  HELPER FUNCTIONS
# ============================================================

def draw_rounded_rect_gradient(surf, rect, col_top, col_bot, radius=8):
    """Draw a vertical gradient inside a rounded rect."""
    x, y, w, h = rect
    temp = pygame.Surface((w, h), pygame.SRCALPHA)
    for row in range(h):
        t = row / max(h - 1, 1)
        r = int(col_top[0] + (col_bot[0] - col_top[0]) * t)
        g = int(col_top[1] + (col_bot[1] - col_top[1]) * t)
        b = int(col_top[2] + (col_bot[2] - col_top[2]) * t)
        pygame.draw.line(temp, (r, g, b), (0, row), (w - 1, row))
    mask = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.rect(mask, (255, 255, 255, 255), (0, 0, w, h), border_radius=radius)
    temp.blit(mask, (0, 0), special_flags=pygame.BLEND_RGBA_MIN)
    surf.blit(temp, (x, y))


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


# ============================================================
#  BACKGROUND PLAYER
# ============================================================

def create_bg_player():
    W, H = 640, 360
    surf = pygame.Surface((W, H))
    
    for row in range(H):
        t = row / H
        c = lerp_color((35, 38, 48), (25, 28, 35), t)
        pygame.draw.line(surf, c, (0, row), (W, row))

    T_X, T_Y = 15, 10
    T_W, T_H = 370, 340

    for i in range(6, 0, -1):
        alpha = 30 + i * 8
        shadow = pygame.Surface((T_W + i*2, T_H + i*2), pygame.SRCALPHA)
        pygame.draw.rect(shadow, (0, 0, 0, alpha), (0, 0, T_W + i*2, T_H + i*2), border_radius=10)
        surf.blit(shadow, (T_X + 3 - i, T_Y + 3 - i))

    draw_rounded_rect_gradient(surf, (T_X, T_Y, T_W, T_H), (55, 60, 72), (35, 40, 50), radius=8)
    pygame.draw.rect(surf, (75, 80, 95), (T_X, T_Y, T_W, T_H), border_radius=8, width=1)
    pygame.draw.line(surf, (20, 22, 28), (T_X + 8, T_Y + T_H - 1), (T_X + T_W - 8, T_Y + T_H - 1))

    for sx, sy in [(14, 14), (T_W - 14, 14), (14, T_H - 14), (T_W - 14, T_H - 14)]:
        px, py = T_X + sx, T_Y + sy
        pygame.draw.circle(surf, (20, 22, 28), (px, py), 5)
        pygame.draw.circle(surf, (90, 95, 110), (px, py), 4)
        pygame.draw.circle(surf, (120, 125, 140), (px, py), 2)
        pygame.draw.rect(surf, (70, 75, 85), (px - 3, py, 6, 1))
        pygame.draw.rect(surf, (70, 75, 85), (px, py - 3, 1, 6))

    cx, cy = T_X + 160, T_Y + 148
    pygame.draw.circle(surf, (22, 25, 32), (cx, cy), 133)
    pygame.draw.circle(surf, (28, 32, 40), (cx, cy), 131)
    
    for angle_start, angle_end, col in [
        (40, 200, (255, 80, 220)),
        (200, 400, (80, 180, 255)),
    ]:
        pygame.draw.arc(surf, col, (cx - 132, cy - 132, 264, 264),
                        math.radians(angle_start), math.radians(angle_end), 2)

    pygame.draw.circle(surf, (22, 25, 32), (T_X + 38, T_Y + 38), 16)
    pygame.draw.circle(surf, (30, 34, 42), (T_X + 38, T_Y + 38), 14)
    pygame.draw.circle(surf, (220, 50, 65), (T_X + 38, T_Y + 38), 5)
    glow = pygame.Surface((20, 20), pygame.SRCALPHA)
    pygame.draw.circle(glow, (220, 50, 65, 60), (10, 10), 10)
    surf.blit(glow, (T_X + 28, T_Y + 28))

    font_brand = pygame.font.SysFont("Consolas", 7)
    brand = font_brand.render("RETRO GROOVE", False, (90, 95, 110))
    surf.blit(brand, (T_X + T_W - 100, T_Y + 25))
    pygame.draw.line(surf, (70, 75, 88), (T_X + T_W - 100, T_Y + 35), (T_X + T_W - 40, T_Y + 35))

    S_X, S_Y = T_X + 325, T_Y + 135
    S_W, S_H = 26, 120
    pygame.draw.rect(surf, (18, 20, 25), (S_X - 1, S_Y - 1, S_W + 2, S_H + 2), border_radius=4)
    draw_rounded_rect_gradient(surf, (S_X, S_Y, S_W, S_H), (30, 34, 42), (22, 25, 32), radius=3)
    pygame.draw.rect(surf, (12, 14, 18), (S_X + 11, S_Y + 8, 4, S_H - 16), border_radius=1)
    for i in range(11):
        my = S_Y + 12 + i * (S_H - 24) // 10
        w = 5 if i == 5 else 3
        col = (120, 125, 140) if i == 5 else (70, 75, 88)
        pygame.draw.line(surf, col, (S_X - w - 2, my), (S_X - 2, my))
        pygame.draw.line(surf, col, (S_X + S_W + 2, my), (S_X + S_W + w + 2, my))
    pygame.draw.rect(surf, (60, 200, 60), (S_X + 5, S_Y - 12, 16, 3))
    glow_g = pygame.Surface((22, 9), pygame.SRCALPHA)
    pygame.draw.rect(glow_g, (60, 200, 60, 40), (0, 0, 22, 9), border_radius=3)
    surf.blit(glow_g, (S_X + 2, S_Y - 15))

    font_spd = pygame.font.SysFont("Consolas", 9, bold=True)
    surf.blit(font_spd.render("33", False, (140, 145, 160)), (T_X + 275, T_Y + 312))
    surf.blit(font_spd.render("45", False, (140, 145, 160)), (T_X + 305, T_Y + 312))

    P_X, P_Y = 400, 10
    P_W, P_H = 230, 340

    for i in range(6, 0, -1):
        shadow = pygame.Surface((P_W + i*2, P_H + i*2), pygame.SRCALPHA)
        pygame.draw.rect(shadow, (0, 0, 0, 30 + i * 8), (0, 0, P_W + i*2, P_H + i*2), border_radius=10)
        surf.blit(shadow, (P_X + 3 - i, P_Y + 3 - i))

    draw_rounded_rect_gradient(surf, (P_X, P_Y, P_W, P_H), (50, 55, 68), (35, 40, 50), radius=8)
    pygame.draw.rect(surf, (70, 75, 90), (P_X, P_Y, P_W, P_H), border_radius=8, width=1)

    inner_margin = 8
    ix, iy = P_X + inner_margin, P_Y + inner_margin
    iw, ih = P_W - inner_margin * 2, P_H - inner_margin * 2
    pygame.draw.rect(surf, (28, 32, 40), (ix, iy, iw, ih), border_radius=4)
    pygame.draw.rect(surf, (38, 42, 52), (ix, iy, iw, 28), border_radius=4)
    pygame.draw.line(surf, (55, 60, 72), (ix, iy + 28), (ix + iw, iy + 28))

    pygame.image.save(surf, 'assets/bg/bg_player.png')


def create_empty_platter():
    size = 260
    surf = pygame.Surface((size, size), pygame.SRCALPHA)
    c = size // 2

    for r in range(128, 123, -1):
        t = (128 - r) / 5
        col = lerp_color((170, 175, 185), (100, 105, 115), t)
        pygame.draw.circle(surf, col, (c, c), r, 1)

    pygame.draw.circle(surf, (45, 50, 58), (c, c), 123)

    for r in range(115, 20, -10):
        pygame.draw.circle(surf, (52, 57, 65), (c, c), r, 1)
    
    for r in range(110, 25, -14):
        dot_count = max(8, r // 3)
        for a in range(0, 360, 360 // dot_count):
            rad = math.radians(a + (r * 3))
            x = c + math.cos(rad) * r
            y = c + math.sin(rad) * r
            pygame.draw.rect(surf, (55, 60, 70), (int(x), int(y), 2, 2))

    pygame.draw.circle(surf, (160, 165, 175), (c, c), 6)
    pygame.draw.circle(surf, (120, 125, 135), (c, c), 5)
    pygame.draw.circle(surf, (60, 60, 70), (c, c), 3)
    pygame.draw.circle(surf, (200, 205, 215), (c, c), 1)

    pygame.image.save(surf, 'assets/bg/empty_platter.png')


def create_vinyl(name, label_col):
    size = 246
    surf = pygame.Surface((size, size), pygame.SRCALPHA)
    c = size // 2

    pygame.draw.circle(surf, (18, 20, 23), (c, c), 121)

    for r in range(46, 119, 3):
        brightness = 32 + int(6 * math.sin(r * 0.3))
        col = (brightness, brightness + 2, brightness + 5)
        pygame.draw.circle(surf, col, (c, c), r, 1)

    for offset in range(0, 360, 180):
        start = math.radians(offset + 20)
        end = math.radians(offset + 55)
        for dr in range(-2, 3):
            alpha_col = (70 + dr * 3, 75 + dr * 3, 85 + dr * 3)
            pygame.draw.arc(surf, alpha_col,
                           (c - 112 + dr, c - 112 + dr, 224 - dr*2, 224 - dr*2),
                           start, end, 1)

    label_dark = tuple(max(0, x - 40) for x in label_col)
    for r in range(42, 0, -1):
        t = r / 42
        col = lerp_color(label_dark, label_col, t)
        pygame.draw.circle(surf, col, (c, c), r)

    pygame.draw.circle(surf, (255, 220, 100), (c, c), 40, 1)
    pygame.draw.circle(surf, (255, 220, 100), (c, c), 36, 1)
    
    for a in range(0, 360, 30):
        rad = math.radians(a)
        dx = int(math.cos(rad) * 34)
        dy = int(math.sin(rad) * 34)
        pygame.draw.rect(surf, (255, 220, 100), (c + dx, c + dy, 1, 1))

    font_label = pygame.font.SysFont("Consolas", 7, bold=True)
    text = font_label.render("RETRO", False, (255, 220, 100))
    text_rect = text.get_rect(center=(c, c - 8))
    surf.blit(text, text_rect)
    
    text2 = font_label.render("GROOVE", False, (255, 255, 255))
    text2_rect = text2.get_rect(center=(c, c + 4))
    surf.blit(text2, text2_rect)

    pygame.draw.line(surf, (255, 220, 100), (c - 14, c + 14), (c + 14, c + 14))

    pygame.draw.circle(surf, (120, 125, 135), (c, c), 5)
    pygame.draw.circle(surf, (40, 40, 45), (c, c), 3)
    pygame.draw.circle(surf, (180, 185, 195), (c, c), 1)

    pygame.image.save(surf, f'assets/vinyl/vinyl_{name}.png')


def create_tone_arm():
    size = 200
    surf = pygame.Surface((size, size), pygame.SRCALPHA)
    pivot = (150, 40)
    end = (40, 175)

    pygame.draw.circle(surf, (18, 20, 25), pivot, 30)
    pygame.draw.circle(surf, (42, 47, 57), pivot, 28)
    for r in range(28, 24, -1):
        t = (28 - r) / 4
        col = lerp_color((55, 60, 72), (35, 38, 48), t)
        pygame.draw.circle(surf, col, pivot, r)
    pygame.draw.circle(surf, (130, 135, 148), pivot, 9)
    pygame.draw.circle(surf, (90, 95, 108), pivot, 7)
    pygame.draw.rect(surf, (160, 165, 178), (pivot[0] - 3, pivot[1] - 1, 6, 2))
    pygame.draw.rect(surf, (160, 165, 178), (pivot[0] - 1, pivot[1] - 3, 2, 6))

    pygame.draw.line(surf, (15, 17, 22), (pivot[0] + 3, pivot[1] + 3), (end[0] + 3, end[1] + 3), 7)
    pygame.draw.line(surf, (140, 145, 160), pivot, end, 5)
    pygame.draw.line(surf, (180, 185, 200), (pivot[0] - 1, pivot[1]), (end[0] - 1, end[1]), 2)
    pygame.draw.line(surf, (80, 85, 98), (pivot[0] + 2, pivot[1] + 1), (end[0] + 2, end[1] + 1), 1)

    pygame.draw.polygon(surf, (55, 60, 72), [
        (end[0] - 6, end[1] - 6), (end[0] + 8, end[1]),
        (end[0] + 2, end[1] + 18), (end[0] - 12, end[1] + 12)
    ])
    pygame.draw.polygon(surf, (70, 75, 88), [
        (end[0] - 5, end[1] - 5), (end[0] + 7, end[1] + 1),
        (end[0] + 1, end[1] + 17), (end[0] - 11, end[1] + 11)
    ], 1)
    
    pygame.draw.rect(surf, (20, 20, 25), (end[0] - 8, end[1] + 5, 10, 8))
    pygame.draw.rect(surf, (255, 40, 40), (end[0] - 5, end[1] + 13, 2, 3))
    glow = pygame.Surface((8, 8), pygame.SRCALPHA)
    pygame.draw.circle(glow, (255, 40, 40, 50), (4, 4), 4)
    surf.blit(glow, (end[0] - 8, end[1] + 11))

    cw_x = pivot[0] + 18
    cw_y = pivot[1] - 5
    pygame.draw.rect(surf, (60, 65, 78), (cw_x, cw_y, 18, 30), border_radius=3)
    pygame.draw.rect(surf, (80, 85, 98), (cw_x + 1, cw_y + 1, 16, 28), border_radius=2, width=1)

    pygame.image.save(surf, 'assets/bg/tone_arm.png')


def create_start_stop(active=False):
    w, h = 50, 32
    surf = pygame.Surface((w, h), pygame.SRCALPHA)
    
    pygame.draw.rect(surf, (15, 17, 22), (0, 0, w, h), border_radius=4)
    draw_rounded_rect_gradient(surf, (1, 1, w - 2, h - 2), (52, 57, 68), (35, 40, 50), radius=3)
    pygame.draw.rect(surf, (28, 32, 40), (3, 3, w - 6, h - 6), border_radius=2)
    
    led_col = (80, 255, 80) if active else (200, 45, 55)
    pygame.draw.rect(surf, led_col, (6, 5, 7, 4), border_radius=1)
    glow = pygame.Surface((13, 10), pygame.SRCALPHA)
    pygame.draw.rect(glow, (*led_col, 40), (0, 0, 13, 10), border_radius=4)
    surf.blit(glow, (3, 2))
    
    font = pygame.font.SysFont("Consolas", 8, bold=True)
    col_text = (220, 225, 235) if active else (180, 185, 195)
    surf.blit(font.render("START", False, col_text), (15, 4))
    surf.blit(font.render("STOP", False, col_text), (17, 16))
    
    suffix = "_active" if active else ""
    pygame.image.save(surf, f'assets/buttons/btn_start_stop{suffix}.png')


def create_speed_btns():
    for name, col in [("btn_33", (255, 60, 80)), ("btn_45", (60, 180, 255))]:
        surf = pygame.Surface((14, 14), pygame.SRCALPHA)
        pygame.draw.circle(surf, (15, 17, 22), (7, 7), 7)
        pygame.draw.circle(surf, (35, 40, 50), (7, 7), 6)
        pygame.draw.circle(surf, col, (7, 7), 4)
        pygame.draw.rect(surf, (255, 255, 255), (5, 4, 2, 2))
        pygame.image.save(surf, f'assets/buttons/{name}.png')


def create_pitch_knob():
    surf = pygame.Surface((22, 14), pygame.SRCALPHA)
    pygame.draw.rect(surf, (12, 14, 18), (0, 0, 22, 14), border_radius=3)
    draw_rounded_rect_gradient(surf, (1, 1, 20, 12), (110, 115, 128), (70, 75, 88), radius=2)
    for x in range(5, 18, 3):
        pygame.draw.line(surf, (55, 60, 72), (x, 3), (x, 11))
    pygame.draw.line(surf, (220, 225, 235), (5, 7), (17, 7), 1)
    pygame.image.save(surf, 'assets/buttons/vol_knob.png')


def create_mini_icon(name, draw_func):
    surf = pygame.Surface((18, 18), pygame.SRCALPHA)
    pygame.draw.rect(surf, (15, 17, 22), (0, 0, 18, 18), border_radius=3)
    draw_rounded_rect_gradient(surf, (1, 1, 16, 16), (50, 55, 65), (38, 42, 52), radius=2)
    draw_func(surf)
    pygame.image.save(surf, f'assets/buttons/{name}.png')


def draw_prev(surf):
    pygame.draw.rect(surf, (220, 225, 235), (5, 5, 2, 8))
    for i in range(4):
        pygame.draw.rect(surf, (220, 225, 235), (8 + i, 9 - i, 2, 2))
        pygame.draw.rect(surf, (220, 225, 235), (8 + i, 9 + i, 2, 2))

def draw_next(surf):
    pygame.draw.rect(surf, (220, 225, 235), (11, 5, 2, 8))
    for i in range(4):
        pygame.draw.rect(surf, (220, 225, 235), (9 - i, 9 - i, 2, 2))
        pygame.draw.rect(surf, (220, 225, 235), (9 - i, 9 + i, 2, 2))

def draw_shuffle(surf):
    pygame.draw.line(surf, (220, 225, 235), (4, 6), (13, 12), 1)
    pygame.draw.line(surf, (220, 225, 235), (4, 12), (13, 6), 1)
    pygame.draw.rect(surf, (220, 225, 235), (12, 5, 2, 2))
    pygame.draw.rect(surf, (220, 225, 235), (12, 11, 2, 2))

def draw_repeat(surf):
    pygame.draw.rect(surf, (220, 225, 235), (4, 5, 10, 1))
    pygame.draw.rect(surf, (220, 225, 235), (4, 12, 10, 1))
    pygame.draw.rect(surf, (220, 225, 235), (4, 5, 1, 4))
    pygame.draw.rect(surf, (220, 225, 235), (13, 9, 1, 4))
    pygame.draw.rect(surf, (220, 225, 235), (12, 4, 2, 1))
    pygame.draw.rect(surf, (220, 225, 235), (5, 13, 2, 1))


# ============================================================
#  GENERATE ALL ASSETS
# ============================================================

create_bg_player()
create_empty_platter()
create_tone_arm()

VINYL_COLORS = {
    'red': (225, 65, 85),
    'blue': (50, 120, 210),
    'green': (60, 180, 80),
    'purple': (150, 60, 180),
    'orange': (240, 140, 40),
    'teal': (40, 170, 160),
}
for name, col in VINYL_COLORS.items():
    create_vinyl(name, col)

create_start_stop(active=False)
create_start_stop(active=True)
create_speed_btns()
create_pitch_knob()

create_mini_icon('btn_prev', draw_prev)
create_mini_icon('btn_next', draw_next)
create_mini_icon('btn_shuffle', draw_shuffle)
create_mini_icon('btn_repeat', draw_repeat)

print("All assets generated successfully!")

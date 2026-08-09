import pygame
import os
import math

os.makedirs('assets/bg', exist_ok=True)
os.makedirs('assets/vinyl', exist_ok=True)
os.makedirs('assets/buttons', exist_ok=True)
pygame.init()

def create_bg_player():
    W, H = 640, 360
    surf = pygame.Surface((W, H))
    surf.fill((230, 230, 230))

    # ===== LEFT: Turntable Base (370 x 340) =====
    T_X, T_Y = 15, 10
    T_W, T_H = 370, 340
    
    # Drop shadow
    pygame.draw.rect(surf, (150, 150, 150), (T_X+4, T_Y+4, T_W, T_H), border_radius=8)
    
    # Main Body
    pygame.draw.rect(surf, (40, 45, 55), (T_X, T_Y, T_W, T_H), border_radius=8)
    pygame.draw.rect(surf, (70, 75, 90), (T_X+1, T_Y+1, T_W-2, T_H-2), border_radius=7, width=1)
    
    # 4 Corner screws
    for sx, sy in [(12, 12), (T_W-12, 12), (12, T_H-12), (T_W-12, T_H-12)]:
        pygame.draw.circle(surf, (20, 25, 30), (T_X+sx, T_Y+sy), 4)
        pygame.draw.circle(surf, (100, 105, 120), (T_X+sx, T_Y+sy), 2)

    # Turntable Indent (Platter area) - MOVED UP and SLIGHTLY SMALLER
    # Radius = 125, Center = 160, 150
    cx, cy = T_X + 160, T_Y + 150
    pygame.draw.circle(surf, (30, 35, 45), (cx, cy), 130)
    # Highlight rim
    pygame.draw.arc(surf, (255, 100, 255), (cx-130, cy-130, 260, 260), math.radians(60), math.radians(240), 2)
    pygame.draw.arc(surf, (100, 200, 255), (cx-130, cy-130, 260, 260), math.radians(-120), math.radians(60), 2)

    # Top-left mini knob/button
    pygame.draw.circle(surf, (25, 28, 35), (T_X + 35, T_Y + 35), 14)
    pygame.draw.circle(surf, (200, 50, 70), (T_X + 35, T_Y + 35), 4)

    # Pitch Slider Base (Right edge)
    S_X, S_Y = T_X + 325, T_Y + 140
    S_W, S_H = 24, 110
    pygame.draw.rect(surf, (25, 28, 35), (S_X, S_Y, S_W, S_H), border_radius=3)
    # Groove
    pygame.draw.rect(surf, (10, 12, 15), (S_X + 10, S_Y + 5, 4, S_H - 10))
    # Marks
    for i in range(11):
        my = S_Y + 10 + i * 9
        pygame.draw.line(surf, (80, 85, 100), (S_X - 6, my), (S_X - 2, my))
        pygame.draw.line(surf, (80, 85, 100), (S_X + S_W + 2, my), (S_X + S_W + 6, my))
    # Green LED
    pygame.draw.rect(surf, (100, 255, 100), (S_X + 6, S_Y - 15, 12, 4))

    # Speed texts (33 / 45) in bottom right
    font = pygame.font.SysFont("Consolas", 10)
    surf.blit(font.render("33", False, (150, 150, 160)), (T_X + 278, T_Y + 315))
    surf.blit(font.render("45", False, (150, 150, 160)), (T_X + 308, T_Y + 315))

    # ===== RIGHT: Playlist Panel (230 x 340) =====
    P_X, P_Y = 400, 10
    P_W, P_H = 230, 340
    pygame.draw.rect(surf, (150, 150, 150), (P_X+4, P_Y+4, P_W, P_H), border_radius=8)
    pygame.draw.rect(surf, (40, 45, 55), (P_X, P_Y, P_W, P_H), border_radius=8)
    pygame.draw.rect(surf, (70, 75, 90), (P_X+1, P_Y+1, P_W-2, P_H-2), border_radius=7, width=1)
    
    pygame.draw.rect(surf, (30, 34, 42), (P_X + 10, P_Y + 10, P_W - 20, P_H - 20), border_radius=4)
    pygame.draw.rect(surf, (45, 50, 60), (P_X + 10, P_Y + 10, P_W - 20, 25))
    pygame.draw.line(surf, (80, 85, 100), (P_X + 10, P_Y + 35), (P_X + P_W - 10, P_Y + 35))

    pygame.image.save(surf, 'assets/bg/bg_player.png')

def create_empty_platter():
    size = 250
    surf = pygame.Surface((size, size), pygame.SRCALPHA)
    c = size // 2

    # Metal rim
    pygame.draw.circle(surf, (150, 155, 165), (c, c), 125)
    pygame.draw.circle(surf, (80, 85, 95), (c, c), 123)

    # Rubber mat dots
    for r in range(112, 20, -12):
        for a in range(0, 360, 15):
            rad = math.radians(a)
            x = c + math.cos(rad) * r
            y = c + math.sin(rad) * r
            pygame.draw.rect(surf, (50, 55, 65), (x, y, 2, 2))

    # Center
    pygame.draw.circle(surf, (180, 185, 195), (c, c), 4)
    pygame.draw.circle(surf, (50, 50, 50), (c, c), 2)
    pygame.image.save(surf, 'assets/bg/empty_platter.png')

def create_vinyl(name, label_col):
    size = 246
    surf = pygame.Surface((size, size), pygame.SRCALPHA)
    c = size // 2

    # Black vinyl
    pygame.draw.circle(surf, (20, 22, 25), (c, c), 123)

    # Grooves
    for r in range(45, 120, 4):
        col = (40, 43, 50) if r % 8 == 0 else (28, 30, 35)
        pygame.draw.circle(surf, col, (c, c), r, 1)

    # Reflection
    pygame.draw.arc(surf, (65, 70, 80), (c-115, c-115, 230, 230), math.radians(30), math.radians(60), 6)
    pygame.draw.arc(surf, (65, 70, 80), (c-115, c-115, 230, 230), math.radians(210), math.radians(240), 6)

    # Center label
    pygame.draw.circle(surf, label_col, (c, c), 42)
    pygame.draw.circle(surf, (255, 220, 100), (c, c), 38, 1)

    # RETRO text
    for dx, dy in [(-12,-8), (-12,-4), (-12,0), (-12,4), (-8,-8), (-4,-8), (-8,0), (-4,0),
                   (0,-8), (0,-4), (0,0), (0,4), (4,-8), (4,0), (4,4),
                   (12,-8), (12,-4), (12,0), (12,4), (16,-8), (16,4)]:
        pygame.draw.rect(surf, (255, 220, 100), (c + dx, c + dy, 2, 2))

    # Hole
    pygame.draw.circle(surf, (150, 150, 160), (c, c), 4)
    pygame.draw.circle(surf, (0, 0, 0), (c, c), 2)

    pygame.image.save(surf, f'assets/vinyl/vinyl_{name}.png')

def create_tone_arm():
    size = 200
    surf = pygame.Surface((size, size), pygame.SRCALPHA)
    pivot = (150, 40)
    end = (40, 175)

    pygame.draw.circle(surf, (20, 22, 28), pivot, 28)
    pygame.draw.circle(surf, (50, 55, 65), pivot, 26)
    pygame.draw.circle(surf, (30, 33, 42), pivot, 24)
    pygame.draw.circle(surf, (140, 145, 155), pivot, 8)
    pygame.draw.rect(surf, (180, 185, 200), (pivot[0]-2, pivot[1]-2, 4, 4)) 

    pygame.draw.line(surf, (20, 22, 28), (pivot[0]+2, pivot[1]+2), (end[0]+2, end[1]+2), 6)
    pygame.draw.line(surf, (180, 185, 200), pivot, end, 4)
    pygame.draw.line(surf, (120, 125, 140), (pivot[0]+1, pivot[1]+1), (end[0]+1, end[1]+1), 2)

    pygame.draw.polygon(surf, (60, 65, 75), [
        (end[0]-5, end[1]-5), (end[0]+7, end[1]+1),
        (end[0]+1, end[1]+16), (end[0]-11, end[1]+10)
    ])
    pygame.draw.rect(surf, (20, 20, 25), (end[0]-8, end[1]+4, 10, 8))
    pygame.draw.rect(surf, (255, 40, 40), (end[0]-6, end[1]+12, 2, 2))

    pygame.draw.rect(surf, (90, 95, 110), (168, 25, 16, 28), border_radius=2)
    pygame.image.save(surf, 'assets/bg/tone_arm.png')

def create_start_stop():
    w, h = 46, 30
    surf = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.rect(surf, (20, 22, 25), (0, 0, w, h), border_radius=3)
    pygame.draw.rect(surf, (40, 45, 55), (1, 1, w-2, h-2), border_radius=2)
    pygame.draw.rect(surf, (30, 33, 40), (3, 3, w-6, h-6))
    pygame.draw.rect(surf, (200, 40, 40), (6, 5, 6, 4))
    font = pygame.font.SysFont("Consolas", 8)
    surf.blit(font.render("START", False, (200, 200, 210)), (14, 4))
    surf.blit(font.render("STOP", False, (200, 200, 210)), (16, 16))
    pygame.image.save(surf, 'assets/buttons/btn_start_stop.png')

def create_start_stop_active():
    w, h = 46, 30
    surf = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.rect(surf, (20, 22, 25), (0, 0, w, h), border_radius=3)
    pygame.draw.rect(surf, (40, 45, 55), (1, 1, w-2, h-2), border_radius=2)
    pygame.draw.rect(surf, (30, 33, 40), (3, 3, w-6, h-6))
    pygame.draw.rect(surf, (80, 255, 80), (6, 5, 6, 4))
    font = pygame.font.SysFont("Consolas", 8)
    surf.blit(font.render("START", False, (200, 200, 210)), (14, 4))
    surf.blit(font.render("STOP", False, (200, 200, 210)), (16, 16))
    pygame.image.save(surf, 'assets/buttons/btn_start_stop_active.png')

def create_speed_btns():
    for name, col in [("btn_33", (255, 60, 80)), ("btn_45", (60, 180, 255))]:
        surf = pygame.Surface((12, 12), pygame.SRCALPHA)
        pygame.draw.circle(surf, (15, 15, 20), (6, 6), 6)
        pygame.draw.circle(surf, col, (6, 6), 4)
        pygame.draw.rect(surf, (255, 255, 255), (4, 4, 2, 2))
        pygame.image.save(surf, f'assets/buttons/{name}.png')

def create_pitch_knob():
    surf = pygame.Surface((20, 12), pygame.SRCALPHA)
    pygame.draw.rect(surf, (10, 10, 15), (0, 0, 20, 12), border_radius=2)
    pygame.draw.rect(surf, (100, 105, 120), (1, 1, 18, 10), border_radius=1)
    pygame.draw.line(surf, (200, 205, 220), (4, 6), (16, 6), 2)
    pygame.image.save(surf, 'assets/buttons/vol_knob.png')

def create_mini_icon(name, dots):
    surf = pygame.Surface((16, 16), pygame.SRCALPHA)
    pygame.draw.rect(surf, (40, 45, 55), (0, 0, 16, 16), border_radius=2)
    for x, y in dots:
        pygame.draw.rect(surf, (220, 220, 230), (x, y, 2, 2))
    pygame.image.save(surf, f'assets/buttons/{name}.png')

# ============ GENERATE ALL ============
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

create_start_stop()
create_start_stop_active()
create_speed_btns()
create_pitch_knob()

create_mini_icon('btn_prev', [(4,4), (4,6), (4,8), (4,10), (10,4), (8,6), (6,8), (8,10), (10,12)])
create_mini_icon('btn_next', [(10,4), (10,6), (10,8), (10,10), (4,4), (6,6), (8,8), (6,10), (4,12)])
create_mini_icon('btn_shuffle', [(3,4),(11,4), (5,6),(9,6), (7,8), (5,10),(9,10), (3,12),(11,12)])

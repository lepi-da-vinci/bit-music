import pygame
pygame.init()

# =============================================
#              CONFIGURATION
# =============================================
WINDOW_WIDTH = 1280
WINDOW_HEIGHT = 720
BASE_W = 800
BASE_H = 450
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
COL_GOLD = (255, 215, 80)

COL_LCD_BG = (12, 16, 14)
COL_LCD_TEXT = (100, 255, 150)
COL_LCD_DIM = (30, 80, 45)

# --- Fonts ---
font_title = pygame.font.SysFont("Consolas", 14, bold=True)
font_artist = pygame.font.SysFont("Consolas", 10)
font_item = pygame.font.SysFont("Consolas", 11)
font_item_sm = pygame.font.SysFont("Consolas", 9)
font_time = pygame.font.SysFont("Consolas", 10)
font_vol = pygame.font.SysFont("Consolas", 9)
font_lcd_large = pygame.font.SysFont("Consolas", 14, bold=True)
font_lcd_small = pygame.font.SysFont("Consolas", 10)

# --- Coordinates (Dynamic based on states, these are base sizes) ---
ALBUM_W = 200
TRACK_W = 200
PLAYER_W = 370
MARGIN = 10

# Original turntable sizes
T_W, T_H = 370, 340
TURNTABLE_CX = 160
TURNTABLE_CY = 148

PL_ITEM_H = 45

# --- Events ---
TRACK_END_EVENT = pygame.USEREVENT + 1

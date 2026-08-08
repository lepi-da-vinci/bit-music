import pygame
import os
from mutagen.mp3 import MP3
from mutagen.easyid3 import EasyID3

# --- Configuration ---
WINDOW_WIDTH = 700
WINDOW_HEIGHT = 700
FPS = 60

# --- Colors ---
TEXT_COLOR = (255, 220, 100) # Matching the vinyl yellow text
BG_COLOR = (255, 255, 255)

# --- Init Pygame ---
pygame.init()
pygame.mixer.init()
screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
pygame.display.set_caption("Retro Groove Music Player")
clock = pygame.time.Clock()

# --- Load Assets ---
try:
    bg_player = pygame.image.load(os.path.join("assets", "bg_player.png")).convert_alpha()
    img_vinyl = pygame.image.load(os.path.join("assets", "bg_vinyl.png")).convert_alpha()
    img_tone_arm = pygame.image.load(os.path.join("assets", "tone_arm.png")).convert_alpha()
except Exception as e:
    print(f"Error loading assets: {e}")
    pygame.quit()
    exit()

# Set up font
try:
    font_large = pygame.font.SysFont("Courier New", 24, bold=True)
    font_small = pygame.font.SysFont("Courier New", 16)
except:
    font_large = pygame.font.Font(None, 36)
    font_small = pygame.font.Font(None, 24)

# --- Audio Engine & State ---
playlist = []
current_track_index = 0
is_playing = False

# Pygame end event for auto-play next
TRACK_END_EVENT = pygame.USEREVENT + 1
pygame.mixer.music.set_endevent(TRACK_END_EVENT)

def scan_music_folder():
    global playlist
    playlist = []
    music_dir = "music"
    if not os.path.exists(music_dir):
        os.makedirs(music_dir)
    
    for f in os.listdir(music_dir):
        if f.lower().endswith(('.mp3', '.wav')):
            playlist.append(os.path.join(music_dir, f))
    
    playlist.sort()

def get_track_info(filepath):
    filename = os.path.basename(filepath)
    title = filename
    artist = "Unknown Artist"
    
    if filepath.lower().endswith('.mp3'):
        try:
            audio = EasyID3(filepath)
            if 'title' in audio:
                title = audio['title'][0]
            if 'artist' in audio:
                artist = audio['artist'][0]
        except:
            pass
            
    return title, artist

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
    if not playlist: return
    current_track_index = (current_track_index + 1) % len(playlist)
    load_and_play()

def play_prev():
    global current_track_index
    if not playlist: return
    current_track_index = (current_track_index - 1) % len(playlist)
    load_and_play()

def toggle_play_pause():
    global is_playing
    if not playlist: return
    
    if is_playing:
        pygame.mixer.music.pause()
        is_playing = False
    else:
        if not pygame.mixer.music.get_busy() and pygame.mixer.music.get_pos() == -1:
             load_and_play()
        else:
             pygame.mixer.music.unpause()
             is_playing = True

# --- Setup UI Elements ---
# Hitboxes based on our new generated layout
rect_play_pause = pygame.Rect(50, 550, 100, 80) # Start/Stop button
rect_prev = pygame.Rect(550 - 15, 600 - 15, 30, 30) # 33 button
rect_next = pygame.Rect(610 - 15, 600 - 15, 30, 30) # 45 button

# Vinyl Rotation Center
vinyl_center = (350, 350)
vinyl_angle = 0

# --- Main Game Loop ---
scan_music_folder()
if playlist:
    current_title, current_artist = get_track_info(playlist[current_track_index])
else:
    current_title = "NO MUSIC"
    current_artist = "Put .mp3/.wav in 'music' folder"

running = True
while running:
    # 1. Handle Events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
            
        elif event.type == TRACK_END_EVENT:
            if is_playing:
                play_next()
                if playlist:
                    current_title, current_artist = get_track_info(playlist[current_track_index])
            
        elif event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:
                pos = pygame.mouse.get_pos()
                
                if rect_prev.collidepoint(pos):
                    play_prev()
                    if playlist:
                        current_title, current_artist = get_track_info(playlist[current_track_index])
                        
                elif rect_play_pause.collidepoint(pos):
                    toggle_play_pause()
                    if playlist:
                        current_title, current_artist = get_track_info(playlist[current_track_index])
                        
                elif rect_next.collidepoint(pos):
                    play_next()
                    if playlist:
                        current_title, current_artist = get_track_info(playlist[current_track_index])

    # 2. Update Logic
    if is_playing:
        vinyl_angle -= 1 # Rotate clockwise
        if vinyl_angle <= -360:
            vinyl_angle = 0
            
    # 3. Render
    screen.fill(BG_COLOR)
    
    # Draw Player Background (Base)
    screen.blit(bg_player, (0, 0))
    
    # Draw Rotating Vinyl
    rotated_vinyl = pygame.transform.rotate(img_vinyl, vinyl_angle)
    rect_vinyl = rotated_vinyl.get_rect(center=vinyl_center)
    screen.blit(rotated_vinyl, rect_vinyl.topleft)
    
    # Draw Tone Arm ON TOP of vinyl
    screen.blit(img_tone_arm, (0, 0))
    
    # Draw Visual Indicator for Play/Pause
    if is_playing:
        pygame.draw.rect(screen, (80, 255, 80), (65, 565, 30, 10), border_radius=5)
    
    # Draw Text (Title and Artist)
    # Drawing on the vinyl center label
    title_surf = font_large.render(current_title[:15], True, TEXT_COLOR)
    artist_surf = font_small.render(current_artist[:20], True, TEXT_COLOR)
    
    title_rect = title_surf.get_rect(center=(vinyl_center[0], vinyl_center[1] - 25))
    artist_rect = artist_surf.get_rect(center=(vinyl_center[0], vinyl_center[1] + 25))
    
    screen.blit(title_surf, title_rect)
    screen.blit(artist_surf, artist_rect)
    
    pygame.display.flip()
    clock.tick(FPS)

pygame.quit()

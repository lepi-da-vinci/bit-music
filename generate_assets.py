import pygame
import os
import math

os.makedirs('assets', exist_ok=True)
pygame.init()

W, H = 700, 700
CENTER = (W//2, H//2)

def create_bg_player():
    surf = pygame.Surface((W, H))
    surf.fill((255, 255, 255)) # will be overwritten
    
    # Outer dark border
    pygame.draw.rect(surf, (30, 35, 45), (20, 20, 660, 660), border_radius=30)
    # Inner base
    pygame.draw.rect(surf, (55, 60, 75), (30, 30, 640, 640), border_radius=20)
    
    # Neon rim (drawn under the vinyl)
    # Pink arc on the left
    pygame.draw.arc(surf, (255, 80, 200), (CENTER[0]-265, CENTER[1]-265, 530, 530), math.radians(90), math.radians(270), 8)
    # Blue arc on the right
    pygame.draw.arc(surf, (80, 200, 255), (CENTER[0]-265, CENTER[1]-265, 530, 530), math.radians(-90), math.radians(90), 8)
    
    # Start/Stop Button (Bottom Left)
    pygame.draw.rect(surf, (30, 35, 45), (50, 550, 100, 80), border_radius=10)
    pygame.draw.rect(surf, (40, 45, 55), (55, 555, 90, 70), border_radius=8)
    # Red light
    pygame.draw.rect(surf, (255, 80, 80), (65, 565, 30, 10), border_radius=5)
    
    # 33 / 45 Buttons (Bottom Right)
    pygame.draw.circle(surf, (255, 80, 100), (550, 600), 12) # 33
    pygame.draw.circle(surf, (80, 150, 255), (610, 600), 12) # 45
    
    # Top left small button
    pygame.draw.circle(surf, (30, 35, 45), (90, 90), 25)
    pygame.draw.circle(surf, (200, 50, 50), (90, 90), 10)
    
    pygame.image.save(surf, 'assets/bg_player.png')

def create_vinyl():
    size = 520
    surf = pygame.Surface((size, size), pygame.SRCALPHA)
    surf.fill((0, 0, 0, 0))
    c = size // 2
    
    # Black Vinyl Base
    pygame.draw.circle(surf, (20, 22, 25), (c, c), 250)
    
    # Grooves
    for r in range(100, 245, 12):
        pygame.draw.circle(surf, (35, 38, 45), (c, c), r, 2)
        
    # Highlight reflection (subtle curve)
    arc_rect = (c-230, c-230, 460, 460)
    pygame.draw.arc(surf, (60, 65, 75), arc_rect, math.radians(30), math.radians(70), 15)
    pygame.draw.arc(surf, (60, 65, 75), arc_rect, math.radians(210), math.radians(250), 15)
    
    # Center Label (Red/Pinkish)
    pygame.draw.circle(surf, (235, 70, 90), (c, c), 85)
    
    # Yellow accents on label
    pygame.draw.circle(surf, (255, 220, 100), (c, c), 80, 2)
    
    # Pixel art style text placeholder (dots)
    for x in range(c - 40, c - 10, 8):
        pygame.draw.rect(surf, (255, 220, 100), (x, c - 5, 5, 5))
    for x in range(c + 15, c + 45, 8):
        pygame.draw.rect(surf, (255, 220, 100), (x, c - 5, 5, 5))
        
    # Spindle hole
    pygame.draw.circle(surf, (200, 205, 210), (c, c), 8)
    pygame.draw.circle(surf, (30, 30, 30), (c, c), 4)
    
    pygame.image.save(surf, 'assets/bg_vinyl.png')

def create_tone_arm():
    surf = pygame.Surface((W, H), pygame.SRCALPHA)
    surf.fill((0, 0, 0, 0))
    
    base_c = (580, 150)
    
    # Base shadow
    pygame.draw.circle(surf, (30, 35, 45), (base_c[0]+5, base_c[1]+5), 85)
    
    # Base outer
    pygame.draw.circle(surf, (45, 50, 60), base_c, 80)
    pygame.draw.circle(surf, (30, 35, 45), base_c, 80, 5)
    
    # Base inner
    pygame.draw.circle(surf, (70, 75, 85), base_c, 50)
    pygame.draw.circle(surf, (150, 155, 165), base_c, 30)
    
    # Arm shadow
    pygame.draw.line(surf, (30, 35, 45), base_c, (445, 475), 15)
    # Arm metal
    pygame.draw.line(surf, (190, 195, 205), base_c, (440, 470), 12)
    pygame.draw.line(surf, (240, 245, 255), (base_c[0]-3, base_c[1]-3), (437, 467), 4) # highlight
    
    # Cartridge holder
    pygame.draw.polygon(surf, (100, 105, 115), [(430, 460), (450, 480), (410, 510), (390, 490)])
    
    # Cartridge
    pygame.draw.rect(surf, (30, 30, 35), (395, 475, 30, 25), border_radius=3)
    
    # Stylus tip (red)
    pygame.draw.rect(surf, (255, 50, 50), (392, 495, 8, 8), border_radius=2)
    
    # Counterweight (top right)
    pygame.draw.rect(surf, (100, 105, 115), (610, 60, 40, 60), border_radius=10)
    
    pygame.image.save(surf, 'assets/tone_arm.png')

create_bg_player()
create_vinyl()
create_tone_arm()

print("Assets matched to requested style successfully!")

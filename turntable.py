import pygame
import math
import config

class Turntable:
    def __init__(self, vinyl_images):
        self.vinyl_images = vinyl_images
        
        self.vinyl_center = (config.TURNTABLE_CX, config.TURNTABLE_CY)
        self.vinyl_angle = 0.0
        self.vinyl_glow_angle = 0.0
        
        self.arm_pivot_screen = (310, 55)
        # Angles for a programmatically drawn tone arm (0 = straight down, positive = rotate right/counter-clockwise in pygame)
        # Wait, in pygame, y increases downwards. So if 0 is straight down (0, 1)
        # Positive angle rotates counter-clockwise (towards right).
        # We want the arm to point LEFT towards the vinyl.
        # So we use negative angles or we define 0 as pointing left.
        # Let's define angle such that: 
        # nx = pivot_x - L * sin(radians(angle))
        # ny = pivot_y + L * cos(radians(angle))
        # If angle is 0, nx = pivot_x, ny = pivot_y + L (straight down).
        # If angle is 30, sin(30)=0.5 -> nx = pivot_x - 0.5L (pointing left-down).
        self.ARM_ANGLE_REST = 0.0
        self.ARM_ANGLE_OUTER = 10.4
        self.ARM_ANGLE_INNER = 44.0
        
        self.arm_angle_current = self.ARM_ANGLE_REST
        
        self.vinyl_swap_active = False
        self.vinyl_swap_timer = 0.0
        self.VINYL_SWAP_DURATION = 0.6  # Faster swap!
        self.swap_old_color = 'red'
        self.swap_new_color = 'red'
        self.swap_old_art = None
        self.swap_new_art = None
        
        # Album art cache: filepath -> circular pygame.Surface
        self.album_art_cache = {}
        
    def set_album_art(self, filepath, raw_surface):
        if filepath in self.album_art_cache or raw_surface is None:
            return
        try:
            size = 90  # Larger center label
            scaled = pygame.transform.smoothscale(raw_surface, (size, size))
            
            circular = pygame.Surface((size, size), pygame.SRCALPHA)
            pygame.draw.circle(circular, (255, 255, 255, 255), (size // 2, size // 2), size // 2)
            
            result = pygame.Surface((size, size), pygame.SRCALPHA)
            result.blit(scaled, (0, 0))
            
            mask_arr = pygame.surfarray.pixels_alpha(circular)
            result_alpha = pygame.surfarray.pixels_alpha(result)
            for x in range(size):
                for y in range(size):
                    result_alpha[x][y] = min(result_alpha[x][y], mask_arr[x][y])
            del mask_arr, result_alpha
            
            self.album_art_cache[filepath] = result
        except Exception:
            pass
            
    def trigger_swap(self, old_color, new_color, old_art=None, new_art=None):
        if old_color == new_color and old_art == new_art:
            return
        self.vinyl_swap_active = True
        self.vinyl_swap_timer = 0.0
        self.swap_old_color = old_color
        self.swap_new_color = new_color
        self.swap_old_art = old_art
        self.swap_new_art = new_art
        
    def update(self, dt, is_playing, progress):
        if is_playing:
            self.vinyl_angle -= 45.0 * dt  # Slower, relaxing spin
            if self.vinyl_angle <= -360:
                self.vinyl_angle += 360
                
        self.vinyl_glow_angle += 2.0 * dt
        if self.vinyl_glow_angle >= 360:
            self.vinyl_glow_angle -= 360
            
        if self.vinyl_swap_active:
            self.vinyl_swap_timer += dt
            if self.vinyl_swap_timer >= self.VINYL_SWAP_DURATION:
                self.vinyl_swap_active = False
                self.vinyl_swap_timer = 0.0
                
        if is_playing and not self.vinyl_swap_active:
            target_arm = self.ARM_ANGLE_OUTER + (self.ARM_ANGLE_INNER - self.ARM_ANGLE_OUTER) * progress
        else:
            target_arm = self.ARM_ANGLE_REST
            
        diff = target_arm - self.arm_angle_current
        if abs(diff) > 0.05:
            self.arm_angle_current += diff * 10.0 * dt
        else:
            self.arm_angle_current = target_arm

    def _draw_vinyl_with_art(self, surface, vinyl_img, art_surf, angle, cx, cy, alpha=255):
        rot = pygame.transform.rotate(vinyl_img, angle)
        if alpha < 255:
            rot.set_alpha(alpha)
        r = rot.get_rect(center=(cx, cy))
        surface.blit(rot, r.topleft)
        
        if art_surf:
            rot_art = pygame.transform.rotate(art_surf, angle)
            ar = rot_art.get_rect(center=(cx, cy))
            if alpha < 255:
                rot_art.set_alpha(alpha)
            surface.blit(rot_art, ar.topleft)

    def draw(self, surface, current_color, is_playing, is_busy, bass_pulse=0.0, offset_x=0, offset_y=0):
        cx = self.vinyl_center[0] + offset_x
        cy = self.vinyl_center[1] + offset_y
        
        # 1. Draw Programmatic Platter (Metallic concentric circles)
        platter_radius = 140
        pygame.draw.circle(surface, (20, 20, 22), (cx, cy), platter_radius) # Platter Base
        pygame.draw.circle(surface, (60, 62, 65), (cx, cy), platter_radius - 2, 2) # Bezel
        pygame.draw.circle(surface, (40, 42, 45), (cx, cy), platter_radius - 8, 1) # Inner ring
        pygame.draw.circle(surface, (50, 52, 55), (cx, cy), platter_radius - 20, 1) # Inner ring
        pygame.draw.circle(surface, (30, 32, 35), (cx, cy), platter_radius - 35, 1) # Inner ring
        pygame.draw.circle(surface, (80, 82, 85), (cx, cy), platter_radius - 50, 1) # Inner ring
        pygame.draw.circle(surface, (20, 22, 25), (cx, cy), platter_radius - 70, 1) # Inner ring
        
        # Draw central spindle shadow
        pygame.draw.circle(surface, (10, 10, 10), (cx + 2, cy + 2), 6)
        
        # 2. Draw Vinyl
        if is_playing or is_busy:
            current_img = self.vinyl_images.get(current_color, list(self.vinyl_images.values())[0])
            
            if self.vinyl_swap_active:
                half = self.VINYL_SWAP_DURATION / 2
                if self.vinyl_swap_timer < half:
                    t = self.vinyl_swap_timer / half
                    old_img = self.vinyl_images.get(self.swap_old_color, current_img)
                    self._draw_vinyl_with_art(surface, old_img, self.swap_old_art, self.vinyl_angle, cx, cy, alpha=int(255 * (1.0 - t)))
                else:
                    t = (self.vinyl_swap_timer - half) / half
                    self._draw_vinyl_with_art(surface, current_img, self.swap_new_art, self.vinyl_angle, cx, cy, alpha=int(255 * t))
            else:
                self._draw_vinyl_with_art(surface, current_img, self.swap_new_art, self.vinyl_angle, cx, cy)
                
            # Glow ring REACTIVE TO BASS
            if is_playing and not self.vinyl_swap_active:
                glow_surf = pygame.Surface((300, 300), pygame.SRCALPHA)
                v_col_rgb = {'red': (255, 80, 100), 'blue': (80, 150, 255), 'green': (80, 220, 100),
                             'purple': (180, 80, 220), 'orange': (255, 170, 60), 'teal': (60, 200, 180)}
                gc = v_col_rgb.get(current_color, (255, 255, 255))
                
                alpha = int(40 + 80 * bass_pulse + 20 * math.sin(self.vinyl_glow_angle * 5))
                alpha = min(255, max(10, alpha))
                radius = int(145 + 15 * bass_pulse)
                thickness = int(2 + 4 * bass_pulse)
                
                pygame.draw.circle(glow_surf, (*gc, alpha), (150, 150), radius, thickness)
                gr = glow_surf.get_rect(center=(cx, cy))
                surface.blit(glow_surf, gr.topleft)
                
        # Draw central spindle (metallic)
        pygame.draw.circle(surface, (150, 150, 155), (cx, cy), 4)
        pygame.draw.circle(surface, (200, 200, 210), (cx - 1, cy - 1), 2)
        
        # 3. Draw Programmatic Tone Arm
        px = self.arm_pivot_screen[0] + offset_x
        py = self.arm_pivot_screen[1] + offset_y
        
        # Calculate arm endpoint (needle)
        arm_length = 155
        rad = math.radians(self.arm_angle_current)
        # Pointing left-down
        nx = px - arm_length * math.sin(rad)
        ny = py + arm_length * math.cos(rad)
        
        # Draw arm shadow
        pygame.draw.line(surface, (20, 20, 20, 100), (px + 5, py + 5), (nx + 5, ny + 5), 8)
        
        # Draw main arm rod (silver metallic)
        pygame.draw.line(surface, (180, 185, 190), (px, py), (nx, ny), 6)
        pygame.draw.line(surface, (220, 225, 230), (px - 1, py - 1), (nx - 1, ny - 1), 2)
        
        # Draw counterweight (back of pivot)
        cw_length = 35
        cwx = px + cw_length * math.sin(rad)
        cwy = py - cw_length * math.cos(rad)
        pygame.draw.line(surface, (100, 100, 100), (px, py), (cwx, cwy), 14)
        pygame.draw.line(surface, (140, 140, 140), (px, py), (cwx, cwy), 6)
        
        # Draw stylus headshell
        head_angle = rad + math.radians(25) # Headshell is angled inward
        head_len = 20
        hx = nx - head_len * math.sin(head_angle)
        hy = ny + head_len * math.cos(head_angle)
        
        # Headshell shadow
        pygame.draw.polygon(surface, (20, 20, 20, 100), [(nx + 5, ny + 5), (hx + 5, hy + 5), (hx - 8 + 5, hy + 2 + 5), (nx - 5 + 5, ny - 3 + 5)])
        
        # Headshell body (dark grey)
        pygame.draw.polygon(surface, (40, 42, 45), [(nx, ny), (hx, hy), (hx - 8, hy + 2), (nx - 5, ny - 3)])
        # Stylus pin (tiny silver dot)
        pygame.draw.circle(surface, (200, 200, 200), (int(hx), int(hy)), 2)
        
        # Draw Pivot base (large metallic circle)
        pygame.draw.circle(surface, (30, 30, 32), (px, py), 26)
        pygame.draw.circle(surface, (60, 62, 65), (px, py), 24, 2)
        pygame.draw.circle(surface, (150, 155, 160), (px, py), 16)
        pygame.draw.circle(surface, (200, 205, 210), (px, py), 12)
        pygame.draw.circle(surface, (80, 80, 80), (px, py), 6)

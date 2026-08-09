import pygame
import math
import config

class Turntable:
    def __init__(self, vinyl_images, tone_arm_img):
        self.vinyl_images = vinyl_images
        self.tone_arm_img = tone_arm_img
        
        self.vinyl_center = (config.TURNTABLE_CX, config.TURNTABLE_CY)
        self.vinyl_angle = 0.0
        self.vinyl_glow_angle = 0.0
        
        self.arm_pivot_img = (150, 40)
        self.arm_pivot_screen = (config.T_X + 295, config.T_Y + 45)
        self.ARM_ANGLE_REST = 45.0
        self.ARM_ANGLE_OUTER = 23.0
        self.ARM_ANGLE_INNER = 5.0
        self.arm_angle_current = self.ARM_ANGLE_REST
        
        self.vinyl_swap_active = False
        self.vinyl_swap_timer = 0.0
        self.VINYL_SWAP_DURATION = 30.0
        self.swap_old_color = 'red'
        self.swap_new_color = 'red'
        self.swap_old_art = None
        self.swap_new_art = None
        
        # Album art cache: filepath -> circular pygame.Surface
        self.album_art_cache = {}
        
    def set_album_art(self, filepath, raw_surface):
        """Create circular album art from raw surface and cache it."""
        if filepath in self.album_art_cache or raw_surface is None:
            return
        try:
            size = 55  # Small circle in center of vinyl
            scaled = pygame.transform.smoothscale(raw_surface, (size, size))
            
            # Proper circular crop: draw image onto a circle-masked surface
            circular = pygame.Surface((size, size), pygame.SRCALPHA)
            # Draw filled white circle as alpha mask
            pygame.draw.circle(circular, (255, 255, 255, 255), (size // 2, size // 2), size // 2)
            # Blit scaled image, then use the circle as an alpha mask
            result = pygame.Surface((size, size), pygame.SRCALPHA)
            result.blit(scaled, (0, 0))
            # Apply circular mask by keeping only pixels where circle is opaque
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
            self.vinyl_angle -= 1.5 * dt
            if self.vinyl_angle <= -360:
                self.vinyl_angle += 360
                
        self.vinyl_glow_angle += 0.5 * dt
        if self.vinyl_glow_angle >= 360:
            self.vinyl_glow_angle -= 360
            
        if self.vinyl_swap_active:
            self.vinyl_swap_timer += 1.0 * dt
            if self.vinyl_swap_timer >= self.VINYL_SWAP_DURATION:
                self.vinyl_swap_active = False
                self.vinyl_swap_timer = 0.0
                
        if is_playing and not self.vinyl_swap_active:
            target_arm = self.ARM_ANGLE_OUTER + (self.ARM_ANGLE_INNER - self.ARM_ANGLE_OUTER) * progress
        else:
            target_arm = self.ARM_ANGLE_REST
            
        diff = target_arm - self.arm_angle_current
        if abs(diff) > 0.05:
            self.arm_angle_current += diff * 0.1 * dt
        else:
            self.arm_angle_current = target_arm

    def _draw_vinyl_with_art(self, surface, vinyl_img, art_surf, angle, alpha=255, scale=1.0, offset_y=0):
        """Draw a vinyl record with optional album art in center."""
        rot = pygame.transform.rotate(vinyl_img, angle)
        if scale != 1.0:
            rot = pygame.transform.scale(rot, (int(rot.get_width() * scale), int(rot.get_height() * scale)))
        if alpha < 255:
            rot.set_alpha(alpha)
        r = rot.get_rect(center=(self.vinyl_center[0], self.vinyl_center[1] + offset_y))
        surface.blit(rot, r.topleft)
        
        # Draw album art in center (rotates with vinyl)
        if art_surf:
            rot_art = pygame.transform.rotate(art_surf, angle)
            ar = rot_art.get_rect(center=(self.vinyl_center[0], self.vinyl_center[1] + offset_y))
            if alpha < 255:
                rot_art.set_alpha(alpha)
            surface.blit(rot_art, ar.topleft)

    def draw(self, surface, current_color, is_playing, is_busy, bass_pulse=0.0):
        if is_playing or is_busy:
            current_img = self.vinyl_images.get(current_color, list(self.vinyl_images.values())[0])
            
            if self.vinyl_swap_active:
                half = self.VINYL_SWAP_DURATION / 2
                if self.vinyl_swap_timer < half:
                    t = self.vinyl_swap_timer / half
                    old_img = self.vinyl_images.get(self.swap_old_color, current_img)
                    self._draw_vinyl_with_art(surface, old_img, self.swap_old_art, self.vinyl_angle,
                                             alpha=int(255 * (1.0 - t)), scale=1.0 - t * 0.2, offset_y=-t * 30)
                else:
                    t = (self.vinyl_swap_timer - half) / half
                    self._draw_vinyl_with_art(surface, current_img, self.swap_new_art, self.vinyl_angle,
                                             alpha=int(255 * t), scale=0.8 + t * 0.2, offset_y=-(1 - t) * 30)
            else:
                # Get current art
                current_art = self.swap_new_art
                rot = pygame.transform.rotate(current_img, self.vinyl_angle)
                r = rot.get_rect(center=self.vinyl_center)
                surface.blit(rot, r.topleft)
                
                if current_art:
                    rot_art = pygame.transform.rotate(current_art, self.vinyl_angle)
                    ar = rot_art.get_rect(center=self.vinyl_center)
                    surface.blit(rot_art, ar.topleft)
                
            # Glow ring — NOW REACTIVE TO BASS
            if is_playing and not self.vinyl_swap_active:
                glow_surf = pygame.Surface((280, 280), pygame.SRCALPHA)
                v_col_rgb = {'red': (255, 80, 100), 'blue': (80, 150, 255), 'green': (80, 220, 100),
                             'purple': (180, 80, 220), 'orange': (255, 170, 60), 'teal': (60, 200, 180)}
                gc = v_col_rgb.get(current_color, (255, 255, 255))
                
                # Bass-reactive alpha and radius
                alpha = int(30 + 60 * bass_pulse + 15 * math.sin(self.vinyl_glow_angle * 0.05))
                alpha = min(200, max(10, alpha))
                radius = int(125 + 20 * bass_pulse)
                thickness = int(3 + 4 * bass_pulse)
                
                pygame.draw.circle(glow_surf, (*gc, alpha), (140, 140), radius, thickness)
                gr = glow_surf.get_rect(center=self.vinyl_center)
                surface.blit(glow_surf, gr.topleft)
                
        rot_arm = pygame.transform.rotate(self.tone_arm_img, self.arm_angle_current)
        orig_w, orig_h = self.tone_arm_img.get_size()
        dx = self.arm_pivot_img[0] - orig_w / 2
        dy = self.arm_pivot_img[1] - orig_h / 2
        rad = math.radians(-self.arm_angle_current)
        rdx = dx * math.cos(rad) - dy * math.sin(rad)
        rdy = dx * math.sin(rad) + dy * math.cos(rad)
        rw, rh = rot_arm.get_size()
        arm_x = self.arm_pivot_screen[0] - rw / 2 - rdx
        arm_y = self.arm_pivot_screen[1] - rh / 2 - rdy
        surface.blit(rot_arm, (arm_x, arm_y))

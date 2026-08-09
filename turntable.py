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
        
    def trigger_swap(self, old_color, new_color):
        if old_color == new_color: return
        self.vinyl_swap_active = True
        self.vinyl_swap_timer = 0.0
        self.swap_old_color = old_color
        self.swap_new_color = new_color
        
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

    def draw(self, surface, current_color, is_playing, is_busy):
        if is_playing or is_busy:
            current_img = self.vinyl_images.get(current_color, list(self.vinyl_images.values())[0])
            
            if self.vinyl_swap_active:
                half = self.VINYL_SWAP_DURATION / 2
                if self.vinyl_swap_timer < half:
                    t = self.vinyl_swap_timer / half
                    old_img = self.vinyl_images.get(self.swap_old_color, current_img)
                    rot = pygame.transform.rotate(old_img, self.vinyl_angle)
                    scale = 1.0 - t * 0.2
                    scaled = pygame.transform.scale(rot, (int(rot.get_width() * scale), int(rot.get_height() * scale)))
                    scaled.set_alpha(int(255 * (1.0 - t)))
                    r = scaled.get_rect(center=(self.vinyl_center[0], self.vinyl_center[1] - t * 30))
                    surface.blit(scaled, r.topleft)
                else:
                    t = (self.vinyl_swap_timer - half) / half
                    rot = pygame.transform.rotate(current_img, self.vinyl_angle)
                    scale = 0.8 + t * 0.2
                    scaled = pygame.transform.scale(rot, (int(rot.get_width() * scale), int(rot.get_height() * scale)))
                    scaled.set_alpha(int(255 * t))
                    r = scaled.get_rect(center=(self.vinyl_center[0], self.vinyl_center[1] - (1 - t) * 30))
                    surface.blit(scaled, r.topleft)
            else:
                rot = pygame.transform.rotate(current_img, self.vinyl_angle)
                r = rot.get_rect(center=self.vinyl_center)
                surface.blit(rot, r.topleft)
                
            if is_playing and not self.vinyl_swap_active:
                glow_surf = pygame.Surface((280, 280), pygame.SRCALPHA)
                v_col_rgb = {'red': (255, 80, 100), 'blue': (80, 150, 255), 'green': (80, 220, 100),
                             'purple': (180, 80, 220), 'orange': (255, 170, 60), 'teal': (60, 200, 180)}
                gc = v_col_rgb.get(current_color, (255, 255, 255))
                alpha = int(30 + 15 * math.sin(self.vinyl_glow_angle * 0.05))
                pygame.draw.circle(glow_surf, (*gc, alpha), (140, 140), 125, 3)
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

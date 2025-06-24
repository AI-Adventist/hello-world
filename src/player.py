import pygame
from src.config import (PLAYER_COLOR, PLAYER_JUMP_STRENGTH, PLAYER_GRAVITY,
                        PLAYER_TERMINAL_VELOCITY, PLAYER_WIDTH, PLAYER_HEIGHT,
                        PLAYER_MOVE_SPEED)

class Player:
    def __init__(self, x, y):
        self.rect = pygame.Rect(x, y, PLAYER_WIDTH, PLAYER_HEIGHT)
        self.color = PLAYER_COLOR
        self.vel_y = 0
        self.is_jumping = False
        self.jump_strength = PLAYER_JUMP_STRENGTH
        self.gravity = PLAYER_GRAVITY
        self.move_speed = PLAYER_MOVE_SPEED # Using from config

    def jump(self):
        if not self.is_jumping:
            self.is_jumping = True
            self.vel_y = -self.jump_strength

    def draw(self, screen):
        pygame.draw.rect(screen, self.color, self.rect)

    def update(self, platforms, dx):
        # Horizontal movement and collision
        self.rect.x += dx
        for platform_rect in platforms:
            if self.rect.colliderect(platform_rect):
                if dx > 0:  # Moved right into platform
                    self.rect.right = platform_rect.left
                elif dx < 0:  # Moved left into platform
                    self.rect.left = platform_rect.right

        # Vertical movement and collision
        # Apply gravity
        self.vel_y += self.gravity
        if self.vel_y > PLAYER_TERMINAL_VELOCITY: # Terminal velocity
            self.vel_y = PLAYER_TERMINAL_VELOCITY
        self.rect.y += self.vel_y

        # Assume on_ground is False until a downward collision occurs
        # self.on_ground = False # If needed for animations or other logic

        for platform_rect in platforms:
            if self.rect.colliderect(platform_rect):
                if self.vel_y > 0:  # Moving down onto a platform
                    self.rect.bottom = platform_rect.top
                    self.is_jumping = False
                    self.vel_y = 0
                    # self.on_ground = True
                elif self.vel_y < 0:  # Moving up into a platform's underside
                    self.rect.top = platform_rect.bottom
                    self.vel_y = 0 # Nullify upward velocity

import pygame
import numpy as np

# Screen dimensions
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60 # Frames Per Second

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
PLAYER_COLOR = (0, 0, 255)  # Blue
PLATFORM_COLOR = (100, 100, 100)  # Grey
COIN_COLOR = (255, 223, 0)  # Gold

# Font settings
DEFAULT_FONT_SIZE = 36
FONT_NAME = None # Use default system font

# Player physics settings
PLAYER_MOVE_SPEED = 5
PLAYER_JUMP_STRENGTH = 20
PLAYER_GRAVITY = 1
PLAYER_TERMINAL_VELOCITY = 10
PLAYER_WIDTH = 50
PLAYER_HEIGHT = 50

# Camera settings - Color Tracking (example: green)
# These values might need tuning.
LOWER_COLOR_TRACK = np.array([35, 50, 50])
UPPER_COLOR_TRACK = np.array([85, 255, 255])

# Camera settings - Jump Detection
CAMERA_JUMP_DETECTION_THRESHOLD_VERTICAL_MOVE = 30  # Pixels, tune as needed
CAMERA_FEED_DISPLAY_WIDTH = SCREEN_WIDTH // 4
CAMERA_FEED_DISPLAY_HEIGHT = SCREEN_HEIGHT // 4


# Coin properties
COIN_SIZE = 20
COIN_SCORE_VALUE = 10

# Initial player start position (relative to main floor for now)
# Will be used if not overridden by level data
PLAYER_START_X_OFFSET = 50
PLAYER_START_Y_OFFSET_FROM_FLOOR = PLAYER_HEIGHT # player height

# File paths (if any, not used yet but good practice)
# SPRITES_DIR = "assets/sprites/"
# SOUNDS_DIR = "assets/sounds/"

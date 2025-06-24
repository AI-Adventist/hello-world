from src.config import SCREEN_WIDTH, SCREEN_HEIGHT, COIN_SIZE

# Platform data: list of (x, y, width, height) tuples
PLATFORMS_DATA = [
    (100, SCREEN_HEIGHT - 100, 200, 20),
    (400, SCREEN_HEIGHT - 200, 150, 20),
    (50, SCREEN_HEIGHT - 350, 100, 20),
    (0, SCREEN_HEIGHT - 20, SCREEN_WIDTH, 20)  # Main floor platform
]

# Coin data: list of (center_x, center_y) tuples for now,
# or (x,y) for top-left. Let's use (x,y) for top-left to be consistent with Rect creation.
# The COIN_SIZE will be used in main.py when creating the Rects.
COINS_DATA = [
    (150, SCREEN_HEIGHT - 150 - COIN_SIZE // 2), # Adjusted to be slightly above platform
    (450, SCREEN_HEIGHT - 250 - COIN_SIZE // 2),
    (100, SCREEN_HEIGHT - 400 - COIN_SIZE // 2)
]

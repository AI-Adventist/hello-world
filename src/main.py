import pygame
import sys # For sys.exit()

# Import from our new modules
from src.config import (SCREEN_WIDTH, SCREEN_HEIGHT, FPS, WHITE, BLACK,
                        PLATFORM_COLOR, COIN_COLOR, COIN_SIZE, COIN_SCORE_VALUE,
                        DEFAULT_FONT_SIZE, FONT_NAME, PLAYER_MOVE_SPEED)
from src.player import Player
from src.level import PLATFORMS_DATA, COINS_DATA
from src.camera_input import Camera

def main():
    # Initialization
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Mario Cam Adventure - Refactored")
    clock = pygame.time.Clock()
    score_font = pygame.font.SysFont(FONT_NAME, DEFAULT_FONT_SIZE)

    # Create game objects
    # Player: Adjust starting position based on the first platform or a defined start
    # For now, using a fixed start based on the main floor from PLATFORMS_DATA
    floor_y = 0
    floor_h = 0
    for p_data in PLATFORMS_DATA:
        if p_data[0] == 0 and p_data[2] == SCREEN_WIDTH : # Assuming this is the main floor
             floor_y = p_data[1]
             floor_h = p_data[3] # not really needed here but good to have
             break
    player_start_x = 50
    # Correctly calculate starting y to be on top of the floor
    player_start_y = floor_y - PLAYER_HEIGHT if floor_y != 0 else SCREEN_HEIGHT - PLAYER_HEIGHT
    if floor_y == 0 : # A bit redundant due to ternary, but explicit for clarity if floor not found.
        print("Warning: Main floor platform not identified. Defaulting player Y position.")
        player_start_y = SCREEN_HEIGHT - PLAYER_HEIGHT - 5 # Place slightly above bottom if no floor


    player = Player(player_start_x, player_start_y)

    # Create pygame.Rect objects for platforms
    platforms = [pygame.Rect(x, y, w, h) for x, y, w, h in PLATFORMS_DATA]

    # Create pygame.Rect objects for coins
    coins = [pygame.Rect(x, y, COIN_SIZE, COIN_SIZE) for x, y in COINS_DATA]

    score = 0

    # Initialize Camera
    camera = Camera()

    # Main game loop
    running = True
    while running:
        # Event handling
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE: # Allow quitting with ESC
                    running = False


        # --- Camera Input Processing ---
        raw_frame = None
        camera_display_surface = None
        move_direction_camera = "STOP"
        camera_jump_triggered = False

        if camera.camera_enabled:
            raw_frame = camera.read_raw_frame()
            if raw_frame is not None:
                move_direction_camera, camera_jump_triggered = camera.process_frame_for_control(raw_frame, player.is_jumping)
                camera_display_surface = camera.get_display_surface(raw_frame)


        # --- Keyboard Input Processing ---
        keys = pygame.key.get_pressed()

        # Determine horizontal movement (dx)
        dx = 0
        if move_direction_camera == "LEFT":
            dx = -player.move_speed
        elif move_direction_camera == "RIGHT":
            dx = player.move_speed
        else: # Fallback to keyboard if no camera movement
            if keys[pygame.K_LEFT] or keys[pygame.K_a]:
                dx = -player.move_speed
            if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
                dx = player.move_speed

        # Handle jump input (prioritize camera jump if triggered)
        if camera_jump_triggered:
            player.jump()
        elif keys[pygame.K_UP] or keys[pygame.K_SPACE] or keys[pygame.K_w]:
            player.jump()

        # --- Updates ---
        player.update(platforms, dx) # Player update now takes dx

        # Coin Collection Logic
        collected_this_frame = []
        for coin_rect in coins:
            if player.rect.colliderect(coin_rect):
                score += COIN_SCORE_VALUE
                collected_this_frame.append(coin_rect)

        for coin_rect in collected_this_frame:
            if coin_rect in coins: # Ensure it hasn't been already removed if multiple collisions in one frame (rare)
                 coins.remove(coin_rect)

        # --- Rendering ---
        screen.fill(WHITE) # Use WHITE from config

        # Draw platforms
        for platform_rect in platforms:
            pygame.draw.rect(screen, PLATFORM_COLOR, platform_rect)

        # Draw active coins
        for coin_rect in coins:
            pygame.draw.ellipse(screen, COIN_COLOR, coin_rect)

        # Draw player
        player.draw(screen)

        # Draw score
        score_text_surface = score_font.render(f"Score: {score}", True, BLACK) # Use BLACK from config
        screen.blit(score_text_surface, (10, 10))

        # Draw camera feed if available
        if camera_display_surface:
            screen.blit(camera_display_surface, (SCREEN_WIDTH - camera_display_surface.get_width() - 5, 5)) # Top-right corner

        pygame.display.flip()
        clock.tick(FPS) # Use FPS from config

    # Cleanup
    camera.release()
    pygame.quit()
    sys.exit()

if __name__ == '__main__':
    main()

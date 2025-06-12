import pygame

# Initialize Pygame
pygame.init()

# Screen dimensions
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600

# Create the game screen
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))

# Set window caption
pygame.display.set_caption("Mario Cam Adventure")

# Player class
class Player:
    def __init__(self, x, y):
        self.rect = pygame.Rect(x, y, 50, 50)  # Position and size (50x50 pixels)
        self.color = (0, 0, 255)  # Blue color
        self.vel_y = 0  # Vertical velocity for jumping
        self.is_jumping = False  # Jumping state
        self.jump_strength = 20  # Jump height
        self.gravity = 1  # Gravity value
        self.move_speed = 5  # Horizontal movement speed

    def draw(self, screen):
        pygame.draw.rect(screen, self.color, self.rect)

    def update(self, screen_height):
        # Apply gravity
        self.vel_y += self.gravity
        self.rect.y += self.vel_y

        # Basic floor collision
        if self.rect.bottom > screen_height:
            self.rect.bottom = screen_height
            self.is_jumping = False
            self.vel_y = 0

# Instantiate the player
player = Player(50, SCREEN_HEIGHT - 50) # Initial position at bottom-left

# Main game loop
running = True
while running:
    # Process events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # Handle keyboard input
    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT]:
        player.rect.x -= player.move_speed
    if keys[pygame.K_RIGHT]:
        player.rect.x += player.move_speed
    if keys[pygame.K_UP] and not player.is_jumping:
        player.is_jumping = True
        player.vel_y = -player.jump_strength

    # Update player
    player.update(SCREEN_HEIGHT)

    # Screen boundary checks for horizontal movement
    if player.rect.left < 0:
        player.rect.left = 0
    if player.rect.right > SCREEN_WIDTH:
        player.rect.right = SCREEN_WIDTH

    # Fill the screen with white
    screen.fill((255, 255, 255))

    # Draw the player
    player.draw(screen)

    # Update the display
    pygame.display.flip()

# Uninitialize Pygame
pygame.quit()

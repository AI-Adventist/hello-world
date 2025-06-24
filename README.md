# Mario Cam Adventure

## Project Description
This project is a 2D platformer game, inspired by classics like Super Mario, with the unique feature of being controlled by camera input. The player will navigate levels and interact with the game world using gestures or movements detected by a webcam.

Developed primarily in Python, utilizing the Pygame library for game mechanics and graphics, and OpenCV for camera input processing. C/C++ libraries may be integrated for performance-critical components in the future.

## Current Features
*   Basic game window setup using Pygame.
*   Player character with keyboard-controlled movement (left, right, jump) and basic gravity.
*   Simple level structure with platforms and collision physics.
*   Collectible items (coins) and a scoring system.
*   **Experimental camera-controlled movement:** Uses OpenCV for color tracking (default: green) to move the player left/right **and to jump**. The camera feed is shown in the top-right corner.
*   Test script (`src/camera_test.py`) for basic OpenCV camera access (requires local testing).

## Setup Instructions
To set up the project environment, you'll need Python 3.x and the following libraries. You can install them using pip:
```bash
pip install pygame opencv-python numpy
```

## How to Run
To run the main game (now with keyboard and experimental camera controls):
```bash
python src/main.py
```

To test camera functionality independently (requires a connected webcam and local environment):
```bash
python src/camera_test.py
```

### Camera Controls (Experimental)
The game now supports basic horizontal movement control via camera input using color tracking.

*   **Concept:** Present an object of a specific color to your webcam. The game will try to detect this color and move the player character based on the object's position in the camera view.
*   **Tracked Color:** By default, the game tracks a shade of **GREEN**.
    *   The specific HSV color range defined in `src/main.py` is:
        *   `LOWER_COLOR = np.array([35, 50, 50])`
        *   `UPPER_COLOR = np.array([85, 255, 255])`
    *   These values might need tuning based on your lighting conditions and the specific green object you are using. You can edit them directly in `src/main.py`.
*   **How to Control:**
    *   **Horizontal Movement:**
        *   Move the green object to the **camera's left** (your right, as the image is mirrored) to move the player **left**.
        *   Move the green object to the **camera's right** (your left) to move the player **right**.
        *   Keeping the object in the center of the view, or removing it, will stop camera-controlled horizontal movement. Keyboard controls can then be used for horizontal movement.
    *   **Jump (Vertical Movement):**
        *   To make the player jump using the camera, quickly move the tracked green object **upwards**.
        *   This detection is based on a sensitivity threshold (`JUMP_DETECTION_THRESHOLD_VERTICAL_MOVE` in `src/main.py`). You might need to adjust this value in the script for optimal performance based on your camera setup and movement style.
        *   A camera-triggered jump will only occur if the player is not already in a jumping state (`is_jumping = False`).
        *   The traditional keyboard jump (Up Arrow key) also remains functional.
*   **Feedback:** A small view of your camera feed is displayed in the top-right corner of the game window. This helps you see what the game sees and position your colored object.

**Note:** This feature requires a working webcam and the necessary libraries (`opencv-python`, `numpy`) to be correctly installed and accessible by the script.

## Development Goals
The primary goal is to implement robust camera-based controls for player actions.
Further development will include level design, enemies, power-ups, and refined gesture/motion recognition.

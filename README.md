# Mario Cam Adventure

## Project Description
This project is a 2D platformer game, inspired by classics like Super Mario, with the unique feature of being controlled by camera input. The player will navigate levels and interact with the game world using gestures or movements detected by a webcam.

Developed primarily in Python, utilizing the Pygame library for game mechanics and graphics, and OpenCV for camera input processing. C/C++ libraries may be integrated for performance-critical components in the future.

## Current Features
*   Basic game window setup using Pygame.
*   Player character with keyboard-controlled movement (left, right, jump) and basic gravity.
*   Initial script (`src/camera_test.py`) for accessing and displaying the camera feed using OpenCV (requires local testing).

## Setup Instructions
To set up the project environment, you'll need Python 3.x and the following libraries. You can install them using pip:
```bash
pip install pygame opencv-python
```

## How to Run
To run the main game (currently with keyboard controls):
```bash
python src/main.py
```

To test camera functionality independently (requires a connected webcam and local environment):
```bash
python src/camera_test.py
```

## Development Goals
The primary goal is to implement robust camera-based controls for player actions.
Further development will include level design, enemies, power-ups, and refined gesture/motion recognition.

import cv2
import numpy as np
import pygame
from src.config import (LOWER_COLOR_TRACK, UPPER_COLOR_TRACK,
                        CAMERA_JUMP_DETECTION_THRESHOLD_VERTICAL_MOVE,
                        CAMERA_FEED_DISPLAY_WIDTH, CAMERA_FEED_DISPLAY_HEIGHT)

class Camera:
    def __init__(self):
        self.cap = cv2.VideoCapture(0)
        self.camera_enabled = self.cap.isOpened()
        if not self.camera_enabled:
            print("Error: Could not open camera.")

        self.prev_y = None
        self.object_tracked_prev_frame = False

    def read_raw_frame(self):
        if not self.camera_enabled:
            return None
        ret, frame = self.cap.read()
        if not ret:
            return None
        return frame

    def process_frame_for_control(self, raw_frame, player_is_jumping):
        if raw_frame is None:
            return "STOP", False

        move_direction = "STOP"
        jump_triggered = False

        frame = cv2.flip(raw_frame, 1)  # Mirror image
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, LOWER_COLOR_TRACK, UPPER_COLOR_TRACK)

        # Morphological operations
        mask = cv2.erode(mask, None, iterations=2)
        mask = cv2.dilate(mask, None, iterations=2)

        contours, _ = cv2.findContours(mask.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if contours:
            c = max(contours, key=cv2.contourArea)
            M = cv2.moments(c)
            if M["m00"] > 0:  # Check for division by zero
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
                current_y = cy
                frame_width = frame.shape[1]

                # Horizontal movement logic
                if cx < frame_width / 3:
                    move_direction = "LEFT"
                elif cx > frame_width * 2 / 3:
                    move_direction = "RIGHT"
                else:
                    move_direction = "STOP"

                # Jump Logic
                if self.object_tracked_prev_frame and self.prev_y is not None:
                    delta_y = self.prev_y - current_y  # Positive if moving up
                    if delta_y > CAMERA_JUMP_DETECTION_THRESHOLD_VERTICAL_MOVE and not player_is_jumping:
                        jump_triggered = True

                self.prev_y = current_y
                self.object_tracked_prev_frame = True
            else: # M["m00"] == 0, invalid contour moment
                self.object_tracked_prev_frame = False
                self.prev_y = None
        else:  # No contours found
            self.object_tracked_prev_frame = False
            self.prev_y = None

        return move_direction, jump_triggered

    def get_display_surface(self, raw_frame):
        if raw_frame is None or not self.camera_enabled :
            return None

        # For display, we can use the non-flipped (original) or flipped frame.
        # Let's use the flipped one as it's more intuitive for control debugging.
        frame_to_display = cv2.flip(raw_frame, 1)

        small_frame = cv2.resize(frame_to_display, (CAMERA_FEED_DISPLAY_WIDTH, CAMERA_FEED_DISPLAY_HEIGHT))
        small_frame_rgb = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        pygame_frame = pygame.image.frombuffer(small_frame_rgb.tobytes(), small_frame.shape[1::-1], 'RGB')
        return pygame_frame

    def release(self):
        if self.camera_enabled and self.cap:
            self.cap.release()
        print("Camera released.")

import cv2

# Initialize video capture from the default camera
cap = cv2.VideoCapture(0)

# Check if the camera was opened successfully
if not cap.isOpened():
    print("Error: Could not open video device.")
    exit()

# Loop as long as the camera is opened
while cap.isOpened():
    # Read a frame from the camera
    ret, frame = cap.read()

    # If a frame was read successfully
    if ret:
        # Display the frame in an OpenCV window
        cv2.imshow('Camera Feed', frame)

        # Check for 'q' key press to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    else:
        print("Error: Could not read frame.")
        break

# Release the camera capture object
cap.release()

# Destroy all OpenCV windows
cv2.destroyAllWindows()

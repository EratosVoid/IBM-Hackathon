import cv2
import numpy as np

# Create a blank white image
img = np.ones((400, 600, 3), dtype=np.uint8) * 255

# Draw a rectangle (building)
cv2.rectangle(img, (50, 50), (200, 200), (0, 0, 0), 2)
cv2.putText(img, 'Building', (60, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,0), 2)

# Draw a line (road)
cv2.line(img, (300, 100), (550, 100), (128, 128, 128), 5)
cv2.putText(img, 'Road', (400, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (128,128,128), 2)

# Draw a circle (park)
cv2.circle(img, (400, 300), 50, (0, 255, 0), 2)
cv2.putText(img, 'Park', (370, 295), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,128,0), 2)

# Save the image
cv2.imwrite('tests/sample_blueprint.png', img)
print('Sample blueprint image created at tests/sample_blueprint.png')

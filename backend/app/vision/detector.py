from pathlib import Path

import cv2
import numpy as np


# D:\smart-attendance\data\cascades
PROJECT_ROOT = Path(__file__).resolve().parents[3]

CASCADE_PATH = (
    PROJECT_ROOT
    / "data"
    / "cascades"
    / "haarcascade_frontalface_default.xml"
)


class FaceDetector:

    def __init__(self):

        if not CASCADE_PATH.exists():
            raise FileNotFoundError(
                f"Haar Cascade not found: {CASCADE_PATH}"
            )

        self.cascade = cv2.CascadeClassifier(
            str(CASCADE_PATH)
        )

        if self.cascade.empty():
            raise RuntimeError(
                f"Failed to load Haar Cascade: {CASCADE_PATH}"
            )

    def detect(
        self,
        image: np.ndarray,
    ):

        if image is None or image.size == 0:
            return []

        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY,
        )

        gray = cv2.equalizeHist(gray)

        faces = self.cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(80, 80),
        )

        return faces

    def extract_largest_face(
        self,
        image: np.ndarray,
    ):

        faces = self.detect(image)

        if len(faces) == 0:
            return None, None

        largest = max(
            faces,
            key=lambda rect: rect[2] * rect[3],
        )

        x, y, w, h = largest

        face = image[
            y:y + h,
            x:x + w,
        ]

        return face, largest
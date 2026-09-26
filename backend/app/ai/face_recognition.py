from pathlib import Path
from uuid import UUID

import cv2
import numpy as np


class LBPHFaceRecognitionEngine:

    def __init__(
        self,
        model_path: str | Path,
    ):
        self.model_path = Path(
            model_path
        )

        self.model_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.recognizer = cv2.face.LBPHFaceRecognizer_create(
            radius=1,
            neighbors=8,
            grid_x=8,
            grid_y=8,
        )

    def train(
        self,
        faces: list[np.ndarray],
        labels: list[int],
    ):

        if not faces:
            raise ValueError(
                "No training faces provided"
            )

        if not labels:
            raise ValueError(
                "No training labels provided"
            )

        if len(faces) != len(labels):
            raise ValueError(
                "Faces and labels count mismatch"
            )

        gray_faces = []

        for face in faces:

            if len(face.shape) == 3:
                gray = cv2.cvtColor(
                    face,
                    cv2.COLOR_BGR2GRAY,
                )
            else:
                gray = face

            gray = cv2.resize(
                gray,
                (200, 200),
            )

            gray_faces.append(gray)

        labels_array = np.array(
            labels,
            dtype=np.int32,
        )

        self.recognizer.train(
            gray_faces,
            labels_array,
        )

        self.recognizer.write(
            str(self.model_path)
        )

    def load(self):

        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model not found: {self.model_path}"
            )

        self.recognizer.read(
            str(self.model_path)
        )

    def predict(
        self,
        face: np.ndarray,
    ):

        if len(face.shape) == 3:
            gray = cv2.cvtColor(
                face,
                cv2.COLOR_BGR2GRAY,
            )
        else:
            gray = face

        gray = cv2.resize(
            gray,
            (200, 200),
        )

        label, distance = (
            self.recognizer.predict(gray)
        )

        return int(label), float(distance)
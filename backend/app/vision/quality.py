import cv2
import numpy as np


class FaceQualityValidator:

    MIN_WIDTH = 100
    MIN_HEIGHT = 100
    MIN_BRIGHTNESS = 40
    MAX_BRIGHTNESS = 220
    MIN_BLUR_SCORE = 40.0

    @classmethod
    def validate(
        cls,
        face: np.ndarray,
    ) -> tuple[bool, dict]:

        if face is None or face.size == 0:
            return False, {
                "valid": False,
                "reason": "No face image",
            }

        height, width = face.shape[:2]

        if width < cls.MIN_WIDTH or height < cls.MIN_HEIGHT:
            return False, {
                "valid": False,
                "reason": "Face is too small",
                "width": width,
                "height": height,
            }

        gray = cv2.cvtColor(
            face,
            cv2.COLOR_BGR2GRAY,
        )

        brightness = float(gray.mean())

        blur_score = float(
            cv2.Laplacian(
                gray,
                cv2.CV_64F,
            ).var()
        )

        if brightness < cls.MIN_BRIGHTNESS:
            return False, {
                "valid": False,
                "reason": "Image is too dark",
                "brightness": brightness,
                "blur_score": blur_score,
            }

        if brightness > cls.MAX_BRIGHTNESS:
            return False, {
                "valid": False,
                "reason": "Image is too bright",
                "brightness": brightness,
                "blur_score": blur_score,
            }

        if blur_score < cls.MIN_BLUR_SCORE:
            return False, {
                "valid": False,
                "reason": "Image is blurry",
                "brightness": brightness,
                "blur_score": blur_score,
            }

        return True, {
            "valid": True,
            "width": width,
            "height": height,
            "brightness": round(brightness, 2),
            "blur_score": round(blur_score, 2),
        }
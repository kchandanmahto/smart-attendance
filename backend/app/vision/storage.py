from pathlib import Path
from uuid import UUID

import cv2
import numpy as np


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_ROOT = PROJECT_ROOT / "data" / "faces"

DATA_ROOT.mkdir(
    parents=True,
    exist_ok=True,
)


class FaceStorage:

    @staticmethod
    def student_directory(
        student_id: UUID,
    ) -> Path:

        directory = DATA_ROOT / str(student_id)

        directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        return directory

    @staticmethod
    def save_face(
        student_id: UUID,
        image: np.ndarray,
        image_number: int,
    ) -> Path:

        directory = FaceStorage.student_directory(
            student_id
        )

        file_path = (
            directory
            / f"{image_number:04d}.jpg"
        )

        success = cv2.imwrite(
            str(file_path),
            image,
            [
                cv2.IMWRITE_JPEG_QUALITY,
                95,
            ],
        )

        if not success:
            raise RuntimeError(
                "Failed to save face image"
            )

        return file_path

    @staticmethod
    def get_student_images(
        student_id: UUID,
    ):

        directory = FaceStorage.student_directory(
            student_id
        )

        return sorted(
            directory.glob("*.jpg")
        )

    @staticmethod
    def delete_student_images(
        student_id: UUID,
    ):

        directory = (
            DATA_ROOT / str(student_id)
        )

        if not directory.exists():
            return

        for file in directory.glob("*.jpg"):
            file.unlink()

    @staticmethod
    def read_image(
        path: Path,
    ):

        image = cv2.imread(
            str(path)
        )

        if image is None:
            return None

        return image
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

import cv2
import numpy as np
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.face_recognition import (
    LBPHFaceRecognitionEngine,
)
from app.models.face_enrollment import FaceEnrollment
from app.models.face_model import FaceModel
from app.models.student import Student
from app.vision.detector import FaceDetector
from app.vision.quality import FaceQualityValidator
from app.vision.storage import FaceStorage


PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_ROOT = (
    PROJECT_ROOT
    / "data"
    / "models"
)

MODEL_ROOT.mkdir(
    parents=True,
    exist_ok=True,
)


class FaceService:

    REQUIRED_CAPTURE_COUNT = 20

    UNKNOWN_DISTANCE_THRESHOLD = 80.0

    detector = FaceDetector()

    @staticmethod
    def get_student(
        db: Session,
        organization_id: UUID,
        student_id: UUID,
    ):

        student = db.scalar(
            select(Student).where(
                Student.id == student_id,
                Student.organization_id == organization_id,
                Student.is_active.is_(True),
            )
        )

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found",
            )

        return student

    @staticmethod
    def start_enrollment(
        db: Session,
        organization_id: UUID,
        student_id: UUID,
    ):

        student = FaceService.get_student(
            db,
            organization_id,
            student_id,
        )

        enrollment = db.scalar(
            select(FaceEnrollment).where(
                FaceEnrollment.student_id == student_id
            )
        )

        if not enrollment:

            enrollment = FaceEnrollment(
                student_id=student_id,
                status="CAPTURING",
                capture_count=0,
                started_at=datetime.now(
                    timezone.utc
                ),
            )

            db.add(enrollment)

        else:

            enrollment.status = "CAPTURING"
            enrollment.started_at = datetime.now(
                timezone.utc
            )

        student.face_enrollment_status = "CAPTURING"

        db.commit()
        db.refresh(enrollment)

        return enrollment

    @staticmethod
    def capture(
        db: Session,
        organization_id: UUID,
        student_id: UUID,
        image_bytes: bytes,
    ):

        student = FaceService.get_student(
            db,
            organization_id,
            student_id,
        )

        enrollment = db.scalar(
            select(FaceEnrollment).where(
                FaceEnrollment.student_id == student_id
            )
        )

        if not enrollment:
            raise HTTPException(
                status_code=400,
                detail="Enrollment not started",
            )

        if enrollment.status != "CAPTURING":
            raise HTTPException(
                status_code=400,
                detail="Enrollment is not in capturing state",
            )

        image_array = np.frombuffer(
            image_bytes,
            dtype=np.uint8,
        )

        image = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR,
        )

        if image is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid image",
            )

        face, _ = (
            FaceService.detector.extract_largest_face(
                image
            )
        )

        if face is None:
            raise HTTPException(
                status_code=400,
                detail="No face detected",
            )

        valid, quality = (
            FaceQualityValidator.validate(
                face
            )
        )

        if not valid:
            raise HTTPException(
                status_code=400,
                detail=quality["reason"],
            )

        capture_number = (
            enrollment.capture_count + 1
        )

        FaceStorage.save_face(
            student_id,
            face,
            capture_number,
        )

        enrollment.capture_count = (
            capture_number
        )

        enrollment.quality_score = quality[
            "blur_score"
        ]

        if (
            capture_number
            >= FaceService.REQUIRED_CAPTURE_COUNT
        ):
            enrollment.status = "READY"
            student.face_enrollment_status = "READY"

        db.commit()
        db.refresh(enrollment)

        return {
            "capture_count": capture_number,
            "required_count": (
                FaceService.REQUIRED_CAPTURE_COUNT
            ),
            "quality_score": quality[
                "blur_score"
            ],
        }

    @staticmethod
    def complete_enrollment(
        db: Session,
        organization_id: UUID,
        student_id: UUID,
    ):

        student = FaceService.get_student(
            db,
            organization_id,
            student_id,
        )

        enrollment = db.scalar(
            select(FaceEnrollment).where(
                FaceEnrollment.student_id == student_id
            )
        )

        if not enrollment:
            raise HTTPException(
                status_code=404,
                detail="Enrollment not found",
            )

        if (
            enrollment.capture_count
            < FaceService.REQUIRED_CAPTURE_COUNT
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Need at least "
                    f"{FaceService.REQUIRED_CAPTURE_COUNT} "
                    f"images"
                ),
            )

        enrollment.status = "COMPLETED"

        enrollment.completed_at = (
            datetime.now(timezone.utc)
        )

        student.face_enrollment_status = (
            "ENROLLED"
        )

        db.commit()
        db.refresh(enrollment)

        return enrollment

    @staticmethod
    def train_model(
        db: Session,
        organization_id: UUID,
    ):

        students = db.scalars(
            select(Student).where(
                Student.organization_id == organization_id,
                Student.is_active.is_(True),
                Student.face_enrollment_status
                == "ENROLLED",
            )
        ).all()

        if not students:
            raise HTTPException(
                status_code=400,
                detail="No enrolled students found",
            )

        faces = []
        labels = []

        label_to_student = {}

        numeric_label = 1

        for student in students:

            image_paths = (
                FaceStorage.get_student_images(
                    student.id
                )
            )

            if not image_paths:
                continue

            label_to_student[
                numeric_label
            ] = student.id

            for image_path in image_paths:

                image = (
                    FaceStorage.read_image(
                        image_path
                    )
                )

                if image is None:
                    continue

                face = cv2.resize(
                    image,
                    (200, 200),
                )

                gray = cv2.cvtColor(
                    face,
                    cv2.COLOR_BGR2GRAY,
                )

                faces.append(gray)
                labels.append(numeric_label)

            numeric_label += 1

        if not faces:
            raise HTTPException(
                status_code=400,
                detail="No valid training images found",
            )

        version = datetime.now(
            timezone.utc
        ).strftime("%Y%m%d%H%M%S")

        model_name = (
            f"lbph_{organization_id}_{version}"
        )

        model_path = (
            MODEL_ROOT
            / f"{model_name}.yml"
        )

        engine = LBPHFaceRecognitionEngine(
            model_path
        )

        engine.train(
            faces,
            labels,
        )

        model = FaceModel(
            organization_id=organization_id,
            name=model_name,
            algorithm="LBPH",
            version=version,
            model_path=str(model_path),
            model_metadata={
                "labels": {
                    str(label): str(student_id)
                    for label, student_id
                    in label_to_student.items()
                },
                "threshold": FaceService.UNKNOWN_DISTANCE_THRESHOLD,
                "training_images": len(faces),
            },
            is_active=True,
        )

        db.query(FaceModel).filter(
            FaceModel.organization_id
            == organization_id,
            FaceModel.is_active.is_(True),
        ).update(
            {
                "is_active": False
            }
        )

        db.add(model)
        db.commit()
        db.refresh(model)

        return model

    @staticmethod
    def recognize(
        db: Session,
        organization_id: UUID,
        image_bytes: bytes,
    ):

        model = db.scalar(
            select(FaceModel).where(
                FaceModel.organization_id
                == organization_id,
                FaceModel.is_active.is_(True),
                FaceModel.algorithm == "LBPH",
            )
        )

        if not model:
            raise HTTPException(
                status_code=400,
                detail="No active face model",
            )

        image_array = np.frombuffer(
            image_bytes,
            dtype=np.uint8,
        )

        image = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR,
        )

        if image is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid image",
            )

        face, _ = (
            FaceService.detector.extract_largest_face(
                image
            )
        )

        if face is None:
            return {
                "matched": False,
                "student_id": None,
                "label": None,
                "confidence": None,
                "message": "No face detected",
            }

        engine = LBPHFaceRecognitionEngine(
            model.model_path
        )

        engine.load()

        label, distance = engine.predict(
            face
        )

        threshold = FaceService.UNKNOWN_DISTANCE_THRESHOLD

        if model.model_metadata:
            threshold = float(
                model.model_metadata.get(
                    "threshold",
                    threshold,
                )
            )

        if distance > threshold:
            return {
                "matched": False,
                "student_id": None,
                "label": label,
                "confidence": distance,
                "message": "Unknown face",
            }

        student_id = None

        if model.model_metadata:

            labels = model.model_metadata.get(
                "labels",
                {}
            )

            student_id = labels.get(
                str(label)
            )

        if not student_id:
            return {
                "matched": False,
                "student_id": None,
                "label": label,
                "confidence": distance,
                "message": "Face mapping not found",
            }

        return {
            "matched": True,
            "student_id": student_id,
            "label": label,
            "confidence": distance,
            "message": "Face recognized",
        }
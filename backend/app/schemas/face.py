from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class EnrollmentStartResponse(BaseModel):
    student_id: UUID
    status: str
    message: str


class FaceCaptureResponse(BaseModel):
    student_id: UUID
    capture_count: int
    required_count: int
    quality_score: float | None
    message: str


class EnrollmentCompleteResponse(BaseModel):
    student_id: UUID
    status: str
    capture_count: int
    completed_at: datetime | None
    message: str


class FaceRecognitionResponse(BaseModel):
    matched: bool
    student_id: UUID | None
    label: int | None
    confidence: float | None
    message: str


class FaceModelResponse(BaseModel):
    id: UUID
    name: str
    algorithm: str
    version: str
    model_path: str
    is_active: bool
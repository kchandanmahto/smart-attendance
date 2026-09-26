from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    require_roles,
)
from app.database.session import get_db
from app.schemas.face import (
    EnrollmentCompleteResponse,
    EnrollmentStartResponse,
    FaceCaptureResponse,
    FaceModelResponse,
    FaceRecognitionResponse,
)
from app.services.attendance_service import AttendanceService
from app.services.face_service import FaceService


router = APIRouter(
    prefix="/face",
    tags=["Face Recognition"],
)


# ============================================================
# FACE ENROLLMENT - START
# ============================================================

@router.post(
    "/enrollment/{student_id}/start",
    response_model=EnrollmentStartResponse,
    status_code=status.HTTP_200_OK,
)
def start_enrollment(
    student_id: UUID,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
        )
    ),
    db: Session = Depends(get_db),
):
    enrollment = FaceService.start_enrollment(
        db=db,
        organization_id=current_user.organization_id,
        student_id=student_id,
    )

    return {
        "student_id": student_id,
        "status": enrollment.status,
        "message": "Face enrollment started",
    }


# ============================================================
# FACE ENROLLMENT - CAPTURE
# ============================================================

@router.post(
    "/enrollment/{student_id}/capture",
    response_model=FaceCaptureResponse,
    status_code=status.HTTP_200_OK,
)
async def capture_face(
    student_id: UUID,
    file: UploadFile = File(...),
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
            "TEACHER",
        )
    ),
    db: Session = Depends(get_db),
):
    if not file.content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content type is missing",
        )

    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image is empty",
        )

    result = FaceService.capture(
        db=db,
        organization_id=current_user.organization_id,
        student_id=student_id,
        image_bytes=image_bytes,
    )

    return {
        "student_id": student_id,
        "capture_count": result["capture_count"],
        "required_count": result["required_count"],
        "quality_score": result["quality_score"],
        "message": "Face captured successfully",
    }


# ============================================================
# FACE ENROLLMENT - COMPLETE
# ============================================================

@router.post(
    "/enrollment/{student_id}/complete",
    response_model=EnrollmentCompleteResponse,
    status_code=status.HTTP_200_OK,
)
def complete_enrollment(
    student_id: UUID,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
        )
    ),
    db: Session = Depends(get_db),
):
    enrollment = FaceService.complete_enrollment(
        db=db,
        organization_id=current_user.organization_id,
        student_id=student_id,
    )

    return {
        "student_id": student_id,
        "status": enrollment.status,
        "capture_count": enrollment.capture_count,
        "completed_at": enrollment.completed_at,
        "message": "Face enrollment completed",
    }


# ============================================================
# TRAIN FACE RECOGNITION MODEL
# ============================================================

@router.post(
    "/train",
    response_model=FaceModelResponse,
    status_code=status.HTTP_200_OK,
)
def train_model(
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
        )
    ),
    db: Session = Depends(get_db),
):
    return FaceService.train_model(
        db=db,
        organization_id=current_user.organization_id,
    )


# ============================================================
# RECOGNIZE FACE
# ============================================================

@router.post(
    "/recognize",
    response_model=FaceRecognitionResponse,
    status_code=status.HTTP_200_OK,
)
async def recognize_face(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content type is missing",
        )

    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image is empty",
        )

    return FaceService.recognize(
        db=db,
        organization_id=current_user.organization_id,
        image_bytes=image_bytes,
    )


# ============================================================
# RECOGNIZE + AUTOMATIC ATTENDANCE
# ============================================================

@router.post(
    "/recognize-and-mark-attendance",
    status_code=status.HTTP_200_OK,
)
async def recognize_and_mark_attendance(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Recognize a face and automatically mark attendance.

    Flow:
        Camera/Image
            ↓
        Face Recognition
            ↓
        Student Identification
            ↓
        Attendance Policy
            ↓
        Attendance Marked
    """

    if not file.content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content type is missing",
        )

    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image is empty",
        )

    # --------------------------------------------------------
    # STEP 1: FACE RECOGNITION
    # --------------------------------------------------------

    recognition = FaceService.recognize(
        db=db,
        organization_id=current_user.organization_id,
        image_bytes=image_bytes,
    )

    if not recognition.get("matched"):
        return {
            "success": False,
            "recognized": False,
            "attendance_marked": False,
            "message": recognition.get(
                "message",
                "Face not recognized",
            ),
            "recognition": recognition,
        }

    student_id = recognition.get("student_id")

    if not student_id:
        return {
            "success": False,
            "recognized": False,
            "attendance_marked": False,
            "message": "Recognized student ID is missing",
            "recognition": recognition,
        }

    # --------------------------------------------------------
    # STEP 2: AUTOMATIC ATTENDANCE
    # --------------------------------------------------------

    attendance, created = AttendanceService.mark_automatic(
        db=db,
        organization_id=current_user.organization_id,
        student_id=UUID(str(student_id)),
        confidence_score=recognition.get(
            "confidence_score"
        ),
    )

    # --------------------------------------------------------
    # STEP 3: RESPONSE
    # --------------------------------------------------------

    return {
        "success": True,
        "recognized": True,
        "attendance_marked": created,
        "message": (
            "Attendance marked successfully"
            if created
            else "Attendance already marked for today"
        ),
        "recognition": recognition,
        "attendance": {
            "id": str(attendance.id),
            "student_id": str(attendance.student_id),
            "attendance_date": attendance.attendance_date,
            "status": attendance.status,
            "source": attendance.source,
            "check_in_time": attendance.check_in_time,
            "confidence_score": (
                float(attendance.confidence_score)
                if attendance.confidence_score is not None
                else None
            ),
            "verification_method": (
                attendance.verification_method
            ),
        },
    }
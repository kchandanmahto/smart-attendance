from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    require_roles,
)
from app.database.session import get_db
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceResponse,
    AttendanceUpdate,
    AutoAttendanceRequest,
)
from app.services.attendance_service import (
    AttendanceService,
)


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"],
)


@router.post(
    "",
    response_model=AttendanceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_attendance(
    data: AttendanceCreate,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
            "TEACHER",
        )
    ),
    db: Session = Depends(get_db),
):

    data.marked_by = current_user.id

    return AttendanceService.create(
        db=db,
        organization_id=current_user.organization_id,
        data=data,
    )


@router.post(
    "/automatic",
    response_model=AttendanceResponse,
)
def automatic_attendance(
    data: AutoAttendanceRequest,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
            "TEACHER",
        )
    ),
    db: Session = Depends(get_db),
):

    attendance, _created = (
        AttendanceService.mark_automatic(
            db=db,
            organization_id=current_user.organization_id,
            student_id=data.student_id,
            confidence_score=data.confidence_score,
        )
    )

    return attendance


@router.get(
    "",
    response_model=list[AttendanceResponse],
)
def get_attendance_by_date(
    attendance_date: date = Query(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    return AttendanceService.get_by_date(
        db=db,
        organization_id=current_user.organization_id,
        attendance_date=attendance_date,
    )


@router.get(
    "/student/{student_id}",
    response_model=list[AttendanceResponse],
)
def get_student_attendance(
    student_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    return AttendanceService.get_student_attendance(
        db=db,
        organization_id=current_user.organization_id,
        student_id=student_id,
    )


@router.get(
    "/{attendance_id}",
    response_model=AttendanceResponse,
)
def get_attendance(
    attendance_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    return AttendanceService.get_by_id(
        db=db,
        organization_id=current_user.organization_id,
        attendance_id=attendance_id,
    )


@router.patch(
    "/{attendance_id}",
    response_model=AttendanceResponse,
)
def update_attendance(
    attendance_id: UUID,
    data: AttendanceUpdate,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
            "TEACHER",
        )
    ),
    db: Session = Depends(get_db),
):

    return AttendanceService.update(
        db=db,
        organization_id=current_user.organization_id,
        attendance_id=attendance_id,
        data=data,
    )
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.schemas.report import AttendanceSummary
from app.services.report_service import ReportService


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get(
    "/students/{student_id}/attendance",
    response_model=AttendanceSummary,
)
def student_attendance_summary(
    student_id: UUID,
    from_date: date = Query(...),
    to_date: date = Query(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    return ReportService.student_summary(
        db=db,
        organization_id=current_user.organization_id,
        student_id=student_id,
        from_date=from_date,
        to_date=to_date,
    )
    
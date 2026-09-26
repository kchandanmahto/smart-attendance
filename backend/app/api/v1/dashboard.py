from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.schemas.dashboard import (
    DashboardSummary,
    DepartmentAttendance,
)
from app.services.dashboard_service import (
    DashboardService,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/summary",
    response_model=DashboardSummary,
)
def dashboard_summary(
    attendance_date: date | None = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    target_date = (
        attendance_date
        or date.today()
    )

    return DashboardService.summary(
        db=db,
        organization_id=current_user.organization_id,
        attendance_date=target_date,
    )


@router.get(
    "/departments",
    response_model=list[DepartmentAttendance],
)
def department_dashboard(
    attendance_date: date | None = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    target_date = (
        attendance_date
        or date.today()
    )

    return DashboardService.departments(
        db=db,
        organization_id=current_user.organization_id,
        attendance_date=target_date,
    )
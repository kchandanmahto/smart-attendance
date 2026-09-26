from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.database.session import get_db
from app.schemas.holiday import (
    HolidayCreate,
    HolidayResponse,
    HolidayUpdate,
)
from app.services.audit_service import AuditService
from app.services.holiday_service import HolidayService


router = APIRouter(
    prefix="/holidays",
    tags=["Holidays"],
)


@router.post(
    "",
    response_model=HolidayResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_holiday(
    data: HolidayCreate,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
        )
    ),
    db: Session = Depends(get_db),
):

    holiday = HolidayService.create(
        db=db,
        organization_id=current_user.organization_id,
        data=data,
    )

    AuditService.create(
        db=db,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="HOLIDAY_CREATED",
        entity_type="Holiday",
        entity_id=holiday.id,
        description=(
            f"Holiday '{holiday.name}' created"
        ),
    )

    db.commit()

    return holiday


@router.get(
    "",
    response_model=list[HolidayResponse],
)
def list_holidays(
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
            "TEACHER",
        )
    ),
    db: Session = Depends(get_db),
):

    return HolidayService.list_all(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.patch(
    "/{holiday_id}",
    response_model=HolidayResponse,
)
def update_holiday(
    holiday_id: UUID,
    data: HolidayUpdate,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
        )
    ),
    db: Session = Depends(get_db),
):

    holiday = HolidayService.update(
        db=db,
        organization_id=current_user.organization_id,
        holiday_id=holiday_id,
        data=data,
    )

    AuditService.create(
        db=db,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="HOLIDAY_UPDATED",
        entity_type="Holiday",
        entity_id=holiday.id,
        description=(
            f"Holiday '{holiday.name}' updated"
        ),
    )

    db.commit()

    return holiday


@router.delete(
    "/{holiday_id}",
    response_model=HolidayResponse,
)
def delete_holiday(
    holiday_id: UUID,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
        )
    ),
    db: Session = Depends(get_db),
):

    holiday = HolidayService.deactivate(
        db=db,
        organization_id=current_user.organization_id,
        holiday_id=holiday_id,
    )

    AuditService.create(
        db=db,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="HOLIDAY_DEACTIVATED",
        entity_type="Holiday",
        entity_id=holiday.id,
        description=(
            f"Holiday '{holiday.name}' deactivated"
        ),
    )

    db.commit()

    return holiday
    
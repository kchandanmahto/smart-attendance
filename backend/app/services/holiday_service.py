from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.holiday import Holiday
from app.schemas.holiday import (
    HolidayCreate,
    HolidayUpdate,
)


class HolidayService:

    @staticmethod
    def create(
        db: Session,
        organization_id: UUID,
        data: HolidayCreate,
    ) -> Holiday:

        existing = db.scalar(
            select(Holiday).where(
                Holiday.organization_id
                == organization_id,
                Holiday.holiday_date
                == data.holiday_date,
            )
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A holiday already exists "
                    "for this date"
                ),
            )

        holiday = Holiday(
            organization_id=organization_id,
            name=data.name,
            holiday_date=data.holiday_date,
            description=data.description,
            is_optional=data.is_optional,
            is_active=True,
        )

        db.add(holiday)
        db.commit()
        db.refresh(holiday)

        return holiday

    @staticmethod
    def list_all(
        db: Session,
        organization_id: UUID,
    ):

        return db.scalars(
            select(Holiday)
            .where(
                Holiday.organization_id
                == organization_id
            )
            .order_by(
                Holiday.holiday_date.asc()
            )
        ).all()

    @staticmethod
    def update(
        db: Session,
        organization_id: UUID,
        holiday_id: UUID,
        data: HolidayUpdate,
    ) -> Holiday:

        holiday = db.scalar(
            select(Holiday).where(
                Holiday.id == holiday_id,
                Holiday.organization_id
                == organization_id,
            )
        )

        if not holiday:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Holiday not found",
            )

        update_data = data.model_dump(
            exclude_unset=True
        )

        for field, value in update_data.items():
            setattr(holiday, field, value)

        db.commit()
        db.refresh(holiday)

        return holiday

    @staticmethod
    def deactivate(
        db: Session,
        organization_id: UUID,
        holiday_id: UUID,
    ) -> Holiday:

        holiday = db.scalar(
            select(Holiday).where(
                Holiday.id == holiday_id,
                Holiday.organization_id
                == organization_id,
            )
        )

        if not holiday:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Holiday not found",
            )

        holiday.is_active = False

        db.commit()
        db.refresh(holiday)

        return holiday
        
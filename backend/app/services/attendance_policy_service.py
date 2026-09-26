from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.attendance_policy import AttendancePolicy
from app.schemas.attendance_policy import (
    AttendancePolicyCreate,
    AttendancePolicyUpdate,
)


class AttendancePolicyService:

    @staticmethod
    def create(
        db: Session,
        organization_id: UUID,
        data: AttendancePolicyCreate,
    ) -> AttendancePolicy:

        existing = db.scalar(
            select(AttendancePolicy).where(
                AttendancePolicy.organization_id
                == organization_id,
                AttendancePolicy.is_active.is_(True),
            )
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "An active attendance policy "
                    "already exists"
                ),
            )

        policy = AttendancePolicy(
            organization_id=organization_id,
            name=data.name,
            minimum_attendance_percentage=(
                data.minimum_attendance_percentage
            ),
            late_threshold_minutes=(
                data.late_threshold_minutes
            ),
            absent_after_minutes=(
                data.absent_after_minutes
            ),
            auto_mark_absent=data.auto_mark_absent,
            allow_manual_override=(
                data.allow_manual_override
            ),
            is_active=True,
        )

        db.add(policy)
        db.commit()
        db.refresh(policy)

        return policy

    @staticmethod
    def get_active(
        db: Session,
        organization_id: UUID,
    ) -> AttendancePolicy | None:

        return db.scalar(
            select(AttendancePolicy).where(
                AttendancePolicy.organization_id
                == organization_id,
                AttendancePolicy.is_active.is_(True),
            )
        )

    @staticmethod
    def update(
        db: Session,
        organization_id: UUID,
        policy_id: UUID,
        data: AttendancePolicyUpdate,
    ) -> AttendancePolicy:

        policy = db.scalar(
            select(AttendancePolicy).where(
                AttendancePolicy.id == policy_id,
                AttendancePolicy.organization_id
                == organization_id,
            )
        )

        if not policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance policy not found",
            )

        update_data = data.model_dump(
            exclude_unset=True
        )

        for field, value in update_data.items():
            setattr(policy, field, value)

        db.commit()
        db.refresh(policy)

        return policy

    @staticmethod
    def deactivate(
        db: Session,
        organization_id: UUID,
        policy_id: UUID,
    ) -> AttendancePolicy:

        policy = db.scalar(
            select(AttendancePolicy).where(
                AttendancePolicy.id == policy_id,
                AttendancePolicy.organization_id
                == organization_id,
            )
        )

        if not policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance policy not found",
            )

        policy.is_active = False

        db.commit()
        db.refresh(policy)

        return policy
        
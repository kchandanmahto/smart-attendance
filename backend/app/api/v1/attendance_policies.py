from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.database.session import get_db
from app.schemas.attendance_policy import (
    AttendancePolicyCreate,
    AttendancePolicyResponse,
    AttendancePolicyUpdate,
)
from app.services.attendance_policy_service import (
    AttendancePolicyService,
)
from app.services.audit_service import AuditService


router = APIRouter(
    prefix="/attendance-policies",
    tags=["Attendance Policies"],
)


@router.post(
    "",
    response_model=AttendancePolicyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_policy(
    data: AttendancePolicyCreate,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
        )
    ),
    db: Session = Depends(get_db),
):

    policy = AttendancePolicyService.create(
        db=db,
        organization_id=current_user.organization_id,
        data=data,
    )

    AuditService.create(
        db=db,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="ATTENDANCE_POLICY_CREATED",
        entity_type="AttendancePolicy",
        entity_id=policy.id,
        description=(
            f"Attendance policy '{policy.name}' created"
        ),
    )

    db.commit()

    return policy


@router.get(
    "/active",
    response_model=AttendancePolicyResponse,
)
def get_active_policy(
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
            "TEACHER",
        )
    ),
    db: Session = Depends(get_db),
):

    policy = AttendancePolicyService.get_active(
        db=db,
        organization_id=current_user.organization_id,
    )

    if not policy:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="No active attendance policy found",
        )

    return policy


@router.patch(
    "/{policy_id}",
    response_model=AttendancePolicyResponse,
)
def update_policy(
    policy_id: UUID,
    data: AttendancePolicyUpdate,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
        )
    ),
    db: Session = Depends(get_db),
):

    policy = AttendancePolicyService.update(
        db=db,
        organization_id=current_user.organization_id,
        policy_id=policy_id,
        data=data,
    )

    AuditService.create(
        db=db,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="ATTENDANCE_POLICY_UPDATED",
        entity_type="AttendancePolicy",
        entity_id=policy.id,
        description=(
            f"Attendance policy '{policy.name}' updated"
        ),
    )

    db.commit()

    return policy


@router.delete(
    "/{policy_id}",
    response_model=AttendancePolicyResponse,
)
def deactivate_policy(
    policy_id: UUID,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
        )
    ),
    db: Session = Depends(get_db),
):

    policy = AttendancePolicyService.deactivate(
        db=db,
        organization_id=current_user.organization_id,
        policy_id=policy_id,
    )

    AuditService.create(
        db=db,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        action="ATTENDANCE_POLICY_DEACTIVATED",
        entity_type="AttendancePolicy",
        entity_id=policy.id,
        description=(
            f"Attendance policy '{policy.name}' deactivated"
        ),
    )

    db.commit()

    return policy
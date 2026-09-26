from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.schemas.department import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)
from app.services.department_service import DepartmentService


router = APIRouter(
    prefix="/departments",
    tags=["Departments"],
)


@router.post(
    "",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_department(
    data: DepartmentCreate,
    current_user=Depends(
        require_roles("SUPER_ADMIN", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    return DepartmentService.create(
        db,
        current_user.organization_id,
        data,
    )


@router.get(
    "",
    response_model=list[DepartmentResponse],
)
def get_departments(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return DepartmentService.get_all(
        db,
        current_user.organization_id,
    )


@router.get(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def get_department(
    department_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return DepartmentService.get_by_id(
        db,
        current_user.organization_id,
        department_id,
    )


@router.patch(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def update_department(
    department_id: UUID,
    data: DepartmentUpdate,
    current_user=Depends(
        require_roles("SUPER_ADMIN", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    return DepartmentService.update(
        db,
        current_user.organization_id,
        department_id,
        data,
    )


@router.delete(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def delete_department(
    department_id: UUID,
    current_user=Depends(
        require_roles("SUPER_ADMIN", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    return DepartmentService.delete(
        db,
        current_user.organization_id,
        department_id,
    )
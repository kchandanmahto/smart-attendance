from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.schemas.student import (
    StudentCreate,
    StudentResponse,
    StudentUpdate,
)
from app.services.student_service import StudentService


router = APIRouter(
    prefix="/students",
    tags=["Students"],
)


@router.post(
    "",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_student(
    data: StudentCreate,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
        )
    ),
    db: Session = Depends(get_db),
):

    return StudentService.create(
        db=db,
        organization_id=current_user.organization_id,
        data=data,
    )


@router.get(
    "",
    response_model=list[StudentResponse],
)
def get_students(
    include_inactive: bool = Query(False),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    return StudentService.get_all(
        db=db,
        organization_id=current_user.organization_id,
        include_inactive=include_inactive,
    )


@router.get(
    "/{student_id}",
    response_model=StudentResponse,
)
def get_student(
    student_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    return StudentService.get_by_id(
        db=db,
        organization_id=current_user.organization_id,
        student_id=student_id,
    )


@router.patch(
    "/{student_id}",
    response_model=StudentResponse,
)
def update_student(
    student_id: UUID,
    data: StudentUpdate,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
        )
    ),
    db: Session = Depends(get_db),
):

    return StudentService.update(
        db=db,
        organization_id=current_user.organization_id,
        student_id=student_id,
        data=data,
    )


@router.delete(
    "/{student_id}",
    response_model=StudentResponse,
)
def delete_student(
    student_id: UUID,
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
        )
    ),
    db: Session = Depends(get_db),
):

    return StudentService.delete(
        db=db,
        organization_id=current_user.organization_id,
        student_id=student_id,
    )
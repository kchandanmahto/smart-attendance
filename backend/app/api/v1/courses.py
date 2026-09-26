from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.schemas.course import (
    CourseCreate,
    CourseResponse,
    CourseUpdate,
)
from app.services.course_service import CourseService


router = APIRouter(
    prefix="/courses",
    tags=["Courses"],
)


@router.post(
    "",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_course(
    data: CourseCreate,
    current_user=Depends(
        require_roles("SUPER_ADMIN", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    return CourseService.create(
        db,
        current_user.organization_id,
        data,
    )


@router.get(
    "",
    response_model=list[CourseResponse],
)
def get_courses(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CourseService.get_all(
        db,
        current_user.organization_id,
    )


@router.get(
    "/{course_id}",
    response_model=CourseResponse,
)
def get_course(
    course_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CourseService.get_by_id(
        db,
        current_user.organization_id,
        course_id,
    )


@router.patch(
    "/{course_id}",
    response_model=CourseResponse,
)
def update_course(
    course_id: UUID,
    data: CourseUpdate,
    current_user=Depends(
        require_roles("SUPER_ADMIN", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    return CourseService.update(
        db,
        current_user.organization_id,
        course_id,
        data,
    )


@router.delete(
    "/{course_id}",
    response_model=CourseResponse,
)
def delete_course(
    course_id: UUID,
    current_user=Depends(
        require_roles("SUPER_ADMIN", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    return CourseService.delete(
        db,
        current_user.organization_id,
        course_id,
    )
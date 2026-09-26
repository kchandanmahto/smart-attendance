from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.schemas.section import (
    SectionCreate,
    SectionResponse,
    SectionUpdate,
)
from app.services.section_service import SectionService


router = APIRouter(
    prefix="/sections",
    tags=["Sections"],
)


@router.post(
    "",
    response_model=SectionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_section(
    data: SectionCreate,
    current_user=Depends(
        require_roles("SUPER_ADMIN", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    return SectionService.create(
        db,
        current_user.organization_id,
        data,
    )


@router.get(
    "",
    response_model=list[SectionResponse],
)
def get_sections(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return SectionService.get_all(
        db,
        current_user.organization_id,
    )


@router.get(
    "/{section_id}",
    response_model=SectionResponse,
)
def get_section(
    section_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return SectionService.get_by_id(
        db,
        current_user.organization_id,
        section_id,
    )


@router.patch(
    "/{section_id}",
    response_model=SectionResponse,
)
def update_section(
    section_id: UUID,
    data: SectionUpdate,
    current_user=Depends(
        require_roles("SUPER_ADMIN", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    return SectionService.update(
        db,
        current_user.organization_id,
        section_id,
        data,
    )


@router.delete(
    "/{section_id}",
    response_model=SectionResponse,
)
def delete_section(
    section_id: UUID,
    current_user=Depends(
        require_roles("SUPER_ADMIN", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    return SectionService.delete(
        db,
        current_user.organization_id,
        section_id,
    )
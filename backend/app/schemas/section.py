from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SectionCreate(BaseModel):
    course_id: UUID
    name: str
    academic_year: str
    semester: int


class SectionUpdate(BaseModel):
    course_id: UUID | None = None
    name: str | None = None
    academic_year: str | None = None
    semester: int | None = None
    is_active: bool | None = None


class SectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    name: str
    academic_year: str
    semester: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
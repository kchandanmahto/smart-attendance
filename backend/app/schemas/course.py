from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CourseCreate(BaseModel):
    department_id: UUID
    name: str
    code: str
    duration_years: int | None = None


class CourseUpdate(BaseModel):
    department_id: UUID | None = None
    name: str | None = None
    code: str | None = None
    duration_years: int | None = None
    is_active: bool | None = None


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    department_id: UUID
    name: str
    code: str
    duration_years: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
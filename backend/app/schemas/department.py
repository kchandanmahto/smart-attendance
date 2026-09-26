from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: str | None = None


class DepartmentUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None
    is_active: bool | None = None


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    name: str
    code: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class HolidayCreate(BaseModel):
    name: str
    holiday_date: date
    description: str | None = None
    is_optional: bool = False


class HolidayUpdate(BaseModel):
    name: str | None = None
    holiday_date: date | None = None
    description: str | None = None
    is_optional: bool | None = None
    is_active: bool | None = None


class HolidayResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    organization_id: UUID
    name: str
    holiday_date: date
    description: str | None
    is_optional: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AttendancePolicyCreate(BaseModel):
    name: str
    minimum_attendance_percentage: Decimal = Decimal(
        "75.00"
    )
    late_threshold_minutes: int = 15
    absent_after_minutes: int = 30
    auto_mark_absent: bool = True
    allow_manual_override: bool = True


class AttendancePolicyUpdate(BaseModel):
    name: str | None = None
    minimum_attendance_percentage: Decimal | None = None
    late_threshold_minutes: int | None = None
    absent_after_minutes: int | None = None
    auto_mark_absent: bool | None = None
    allow_manual_override: bool | None = None
    is_active: bool | None = None


class AttendancePolicyResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    organization_id: UUID
    name: str
    minimum_attendance_percentage: Decimal
    late_threshold_minutes: int
    absent_after_minutes: int
    auto_mark_absent: bool
    allow_manual_override: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
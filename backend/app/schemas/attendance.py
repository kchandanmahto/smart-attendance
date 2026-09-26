from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# CREATE ATTENDANCE
# ============================================================

class AttendanceCreate(BaseModel):
    student_id: UUID

    attendance_date: date | None = None

    status: str = Field(
        default="PRESENT",
        max_length=30,
    )

    source: str = Field(
        default="MANUAL",
        max_length=30,
    )

    check_in_time: datetime | None = None

    check_out_time: datetime | None = None

    confidence_score: Decimal | None = None

    verification_method: str | None = None

    remarks: str | None = None

    marked_by: UUID | None = None


# ============================================================
# AUTOMATIC ATTENDANCE
# ============================================================

class AutoAttendanceRequest(BaseModel):
    student_id: UUID

    confidence_score: Decimal | None = None


# ============================================================
# UPDATE ATTENDANCE
# ============================================================

class AttendanceUpdate(BaseModel):
    status: str | None = Field(
        default=None,
        max_length=30,
    )

    check_in_time: datetime | None = None

    check_out_time: datetime | None = None

    remarks: str | None = None


# ============================================================
# ATTENDANCE RESPONSE
# ============================================================

class AttendanceResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID

    organization_id: UUID

    student_id: UUID

    section_id: UUID | None

    attendance_date: date

    check_in_time: datetime | None

    check_out_time: datetime | None

    status: str

    source: str

    confidence_score: Decimal | None

    verification_method: str | None

    remarks: str | None

    marked_by: UUID | None

    created_at: datetime

    updated_at: datetime
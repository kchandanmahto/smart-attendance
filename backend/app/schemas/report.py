from datetime import date
from uuid import UUID

from pydantic import BaseModel


class AttendanceSummary(BaseModel):
    student_id: UUID
    from_date: date
    to_date: date
    total_days: int
    present_days: int
    late_days: int
    absent_days: int
    attendance_percentage: float
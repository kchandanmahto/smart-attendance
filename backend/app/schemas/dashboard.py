from datetime import date

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    attendance_date: date
    total_students: int
    present: int
    late: int
    absent: int
    attendance_percentage: float
    face_recognition_count: int
    manual_count: int
    unknown_count: int


class StatusCount(BaseModel):
    status: str
    count: int


class DepartmentAttendance(BaseModel):
    department_id: str
    department_name: str
    total_students: int
    present: int
    late: int
    absent: int
    attendance_percentage: float
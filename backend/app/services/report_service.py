from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.attendance import Attendance


class ReportService:

    @staticmethod
    def student_summary(
        db: Session,
        organization_id: UUID,
        student_id: UUID,
        from_date: date,
        to_date: date,
    ):

        records = db.scalars(
            select(Attendance).where(
                Attendance.organization_id
                == organization_id,
                Attendance.student_id
                == student_id,
                Attendance.attendance_date
                >= from_date,
                Attendance.attendance_date
                <= to_date,
            )
        ).all()

        total_days = len(records)

        present_days = sum(
            1
            for record in records
            if record.status == "PRESENT"
        )

        late_days = sum(
            1
            for record in records
            if record.status == "LATE"
        )

        absent_days = sum(
            1
            for record in records
            if record.status == "ABSENT"
        )

        attended_days = (
            present_days + late_days
        )

        percentage = (
            (attended_days / total_days) * 100
            if total_days
            else 0.0
        )

        return {
            "student_id": student_id,
            "from_date": from_date,
            "to_date": to_date,
            "total_days": total_days,
            "present_days": present_days,
            "late_days": late_days,
            "absent_days": absent_days,
            "attendance_percentage": round(
                percentage,
                2,
            ),
        }
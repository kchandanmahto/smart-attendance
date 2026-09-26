from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.department import Department
from app.models.student import Student


class DashboardService:

    @staticmethod
    def summary(
        db: Session,
        organization_id: UUID,
        attendance_date: date,
    ):
        total_students = db.scalar(
            select(func.count(Student.id)).where(
                Student.organization_id == organization_id,
                Student.is_active.is_(True),
            )
        ) or 0

        rows = db.execute(
            select(
                Attendance.status,
                func.count(Attendance.id),
            )
            .where(
                Attendance.organization_id == organization_id,
                Attendance.attendance_date == attendance_date,
            )
            .group_by(Attendance.status)
        ).all()

        status_counts = {
            status: count
            for status, count in rows
        }

        present = status_counts.get("PRESENT", 0)
        late = status_counts.get("LATE", 0)
        absent = status_counts.get("ABSENT", 0)

        marked_total = present + late + absent

        attendance_percentage = (
            ((present + late) / marked_total) * 100
            if marked_total
            else 0.0
        )

        face_recognition_count = db.scalar(
            select(func.count(Attendance.id)).where(
                Attendance.organization_id == organization_id,
                Attendance.attendance_date == attendance_date,
                Attendance.source == "FACE_RECOGNITION",
            )
        ) or 0

        manual_count = db.scalar(
            select(func.count(Attendance.id)).where(
                Attendance.organization_id == organization_id,
                Attendance.attendance_date == attendance_date,
                Attendance.source == "MANUAL",
            )
        ) or 0

        return {
            "attendance_date": attendance_date,
            "total_students": total_students,
            "present": present,
            "late": late,
            "absent": absent,
            "attendance_percentage": round(
                attendance_percentage,
                2,
            ),
            "face_recognition_count": face_recognition_count,
            "manual_count": manual_count,
            "unknown_count": 0,
        }

    @staticmethod
    def departments(
        db: Session,
        organization_id: UUID,
        attendance_date: date,
    ):
        departments = db.scalars(
            select(Department)
            .where(
                Department.organization_id == organization_id,
                Department.is_active.is_(True),
            )
            .order_by(Department.name.asc())
        ).all()

        result = []

        for department in departments:
            total = db.scalar(
                select(func.count(Student.id)).where(
                    Student.organization_id == organization_id,
                    Student.department_id == department.id,
                    Student.is_active.is_(True),
                )
            ) or 0

            rows = db.execute(
                select(
                    Attendance.status,
                    func.count(Attendance.id),
                )
                .join(
                    Student,
                    Student.id == Attendance.student_id,
                )
                .where(
                    Attendance.organization_id == organization_id,
                    Attendance.attendance_date == attendance_date,
                    Student.department_id == department.id,
                )
                .group_by(Attendance.status)
            ).all()

            counts = {
                status: count
                for status, count in rows
            }

            present = counts.get("PRESENT", 0)
            late = counts.get("LATE", 0)
            absent = counts.get("ABSENT", 0)

            marked = present + late + absent

            percentage = (
                ((present + late) / marked) * 100
                if marked
                else 0.0
            )

            result.append(
                {
                    "department_id": str(department.id),
                    "department_name": department.name,
                    "total_students": total,
                    "present": present,
                    "late": late,
                    "absent": absent,
                    "attendance_percentage": round(
                        percentage,
                        2,
                    ),
                }
            )

        return result
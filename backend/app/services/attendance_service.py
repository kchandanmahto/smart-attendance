from datetime import date, datetime, time, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.attendance_policy import AttendancePolicy
from app.models.holiday import Holiday
from app.models.student import Student
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
)


class AttendanceService:

    @staticmethod
    def _get_student(
        db: Session,
        organization_id: UUID,
        student_id: UUID,
    ):

        student = db.scalar(
            select(Student).where(
                Student.id == student_id,
                Student.organization_id == organization_id,
                Student.is_active.is_(True),
            )
        )

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found",
            )

        return student

    @staticmethod
    def _get_policy(
        db: Session,
        organization_id: UUID,
    ):

        policy = db.scalar(
            select(AttendancePolicy).where(
                AttendancePolicy.organization_id
                == organization_id,
                AttendancePolicy.is_active.is_(True),
            ).order_by(
                AttendancePolicy.created_at.desc()
            )
        )

        return policy

    @staticmethod
    def _is_holiday(
        db: Session,
        organization_id: UUID,
        attendance_date: date,
    ):

        holiday = db.scalar(
            select(Holiday).where(
                Holiday.organization_id
                == organization_id,
                Holiday.holiday_date
                == attendance_date,
                Holiday.is_active.is_(True),
            )
        )

        return holiday

    @staticmethod
    def _get_existing(
        db: Session,
        student_id: UUID,
        attendance_date: date,
    ):

        return db.scalar(
            select(Attendance).where(
                Attendance.student_id == student_id,
                Attendance.attendance_date
                == attendance_date,
            )
        )

    @staticmethod
    def create(
        db: Session,
        organization_id: UUID,
        data: AttendanceCreate,
    ):

        student = AttendanceService._get_student(
            db,
            organization_id,
            data.student_id,
        )

        attendance_date = (
            data.attendance_date
            or datetime.now(
                timezone.utc
            ).date()
        )

        holiday = AttendanceService._is_holiday(
            db,
            organization_id,
            attendance_date,
        )

        if holiday:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Attendance cannot be marked. "
                    f"Holiday: {holiday.name}"
                ),
            )

        existing = AttendanceService._get_existing(
            db,
            data.student_id,
            attendance_date,
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Attendance already exists for this date",
            )

        check_in = (
            data.check_in_time
            or datetime.now(timezone.utc)
        )

        attendance = Attendance(
            organization_id=organization_id,
            student_id=data.student_id,
            section_id=student.section_id,
            attendance_date=attendance_date,
            status=data.status,
            source=data.source,
            check_in_time=check_in,
            check_out_time=data.check_out_time,
            confidence_score=data.confidence_score,
            verification_method=data.verification_method,
            remarks=data.remarks,
            marked_by=data.marked_by,
        )

        db.add(attendance)
        db.commit()
        db.refresh(attendance)

        return attendance

    @staticmethod
    def mark_automatic(
        db: Session,
        organization_id: UUID,
        student_id: UUID,
        confidence_score=None,
    ):

        student = AttendanceService._get_student(
            db,
            organization_id,
            student_id,
        )

        now = datetime.now(timezone.utc)
        today = now.date()

        holiday = AttendanceService._is_holiday(
            db,
            organization_id,
            today,
        )

        if holiday:
            raise HTTPException(
                status_code=400,
                detail=f"Today is holiday: {holiday.name}",
            )

        existing = AttendanceService._get_existing(
            db,
            student_id,
            today,
        )

        if existing:
            return existing, False

        policy = AttendanceService._get_policy(
            db,
            organization_id,
        )

        status_value = "PRESENT"

        if policy:
            current_time = now.time()

            # Simple policy-based late calculation.
            # Default attendance starts from 09:00.
            attendance_start = time(
                hour=9,
                minute=0,
            )

            late_minutes = (
                current_time.hour * 60
                + current_time.minute
                - (
                    attendance_start.hour * 60
                    + attendance_start.minute
                )
            )

            if late_minutes > policy.late_threshold_minutes:
                status_value = "LATE"

        attendance = Attendance(
            organization_id=organization_id,
            student_id=student_id,
            section_id=student.section_id,
            attendance_date=today,
            check_in_time=now,
            status=status_value,
            source="FACE_RECOGNITION",
            confidence_score=confidence_score,
            verification_method="LBPH",
            remarks="Automatically marked by face recognition",
        )

        db.add(attendance)
        db.commit()
        db.refresh(attendance)

        return attendance, True

    @staticmethod
    def get_by_id(
        db: Session,
        organization_id: UUID,
        attendance_id: UUID,
    ):

        attendance = db.scalar(
            select(Attendance).where(
                Attendance.id == attendance_id,
                Attendance.organization_id
                == organization_id,
            )
        )

        if not attendance:
            raise HTTPException(
                status_code=404,
                detail="Attendance not found",
            )

        return attendance

    @staticmethod
    def get_by_date(
        db: Session,
        organization_id: UUID,
        attendance_date: date,
    ):

        return db.scalars(
            select(Attendance)
            .where(
                Attendance.organization_id
                == organization_id,
                Attendance.attendance_date
                == attendance_date,
            )
            .order_by(
                Attendance.created_at.desc()
            )
        ).all()

    @staticmethod
    def get_student_attendance(
        db: Session,
        organization_id: UUID,
        student_id: UUID,
    ):

        AttendanceService._get_student(
            db,
            organization_id,
            student_id,
        )

        return db.scalars(
            select(Attendance)
            .where(
                Attendance.organization_id
                == organization_id,
                Attendance.student_id
                == student_id,
            )
            .order_by(
                Attendance.attendance_date.desc()
            )
        ).all()

    @staticmethod
    def update(
        db: Session,
        organization_id: UUID,
        attendance_id: UUID,
        data: AttendanceUpdate,
    ):

        attendance = AttendanceService.get_by_id(
            db,
            organization_id,
            attendance_id,
        )

        updates = data.model_dump(
            exclude_unset=True
        )

        for field, value in updates.items():
            setattr(
                attendance,
                field,
                value,
            )

        db.commit()
        db.refresh(attendance)

        return attendance
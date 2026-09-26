from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.department import Department
from app.models.section import Section
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate


class StudentService:

    @staticmethod
    def create(
        db: Session,
        organization_id: UUID,
        data: StudentCreate,
    ) -> Student:

        existing = db.scalar(
            select(Student).where(
                Student.student_id == data.student_id
            )
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Student ID already exists",
            )

        department = db.scalar(
            select(Department).where(
                Department.id == data.department_id,
                Department.organization_id == organization_id,
                Department.is_active.is_(True),
            )
        )

        if not department:
            raise HTTPException(
                status_code=404,
                detail="Department not found",
            )

        course = db.scalar(
            select(Course).where(
                Course.id == data.course_id,
                Course.organization_id == organization_id,
                Course.department_id == data.department_id,
                Course.is_active.is_(True),
            )
        )

        if not course:
            raise HTTPException(
                status_code=404,
                detail="Course not found",
            )

        section = db.scalar(
            select(Section).where(
                Section.id == data.section_id,
                Section.course_id == data.course_id,
                Section.is_active.is_(True),
            )
        )

        if not section:
            raise HTTPException(
                status_code=404,
                detail="Section not found",
            )

        student = Student(
            organization_id=organization_id,
            department_id=data.department_id,
            course_id=data.course_id,
            section_id=data.section_id,
            student_id=data.student_id,
            roll_number=data.roll_number,
            admission_number=data.admission_number,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            phone=data.phone,
            date_of_birth=data.date_of_birth,
            gender=data.gender,
            year=data.year,
            semester=data.semester,
            profile_photo=data.profile_photo,
            face_enrollment_status="NOT_ENROLLED",
            is_active=True,
        )

        db.add(student)
        db.commit()
        db.refresh(student)

        return student

    @staticmethod
    def get_by_id(
        db: Session,
        organization_id: UUID,
        student_id: UUID,
    ) -> Student:

        student = db.scalar(
            select(Student).where(
                Student.id == student_id,
                Student.organization_id == organization_id,
            )
        )

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student not found",
            )

        return student

    @staticmethod
    def get_all(
        db: Session,
        organization_id: UUID,
        include_inactive: bool = False,
    ):

        query = select(Student).where(
            Student.organization_id == organization_id
        )

        if not include_inactive:
            query = query.where(
                Student.is_active.is_(True)
            )

        return db.scalars(
            query.order_by(Student.created_at.desc())
        ).all()

    @staticmethod
    def update(
        db: Session,
        organization_id: UUID,
        student_id: UUID,
        data: StudentUpdate,
    ):

        student = StudentService.get_by_id(
            db,
            organization_id,
            student_id,
        )

        updates = data.model_dump(
            exclude_unset=True
        )

        if "department_id" in updates:
            department = db.scalar(
                select(Department).where(
                    Department.id == updates["department_id"],
                    Department.organization_id == organization_id,
                    Department.is_active.is_(True),
                )
            )

            if not department:
                raise HTTPException(
                    status_code=404,
                    detail="Department not found",
                )

        if "course_id" in updates:
            course = db.scalar(
                select(Course).where(
                    Course.id == updates["course_id"],
                    Course.organization_id == organization_id,
                    Course.is_active.is_(True),
                )
            )

            if not course:
                raise HTTPException(
                    status_code=404,
                    detail="Course not found",
                )

        for field, value in updates.items():
            setattr(student, field, value)

        db.commit()
        db.refresh(student)

        return student

    @staticmethod
    def delete(
        db: Session,
        organization_id: UUID,
        student_id: UUID,
    ):

        student = StudentService.get_by_id(
            db,
            organization_id,
            student_id,
        )

        student.is_active = False

        db.commit()
        db.refresh(student)

        return student
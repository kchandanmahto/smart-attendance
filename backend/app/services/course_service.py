from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.department import Department
from app.schemas.course import CourseCreate, CourseUpdate


class CourseService:

    @staticmethod
    def create(
        db: Session,
        organization_id: UUID,
        data: CourseCreate,
    ):

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

        existing = db.scalar(
            select(Course).where(
                Course.organization_id == organization_id,
                Course.code == data.code,
            )
        )

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Course code already exists",
            )

        course = Course(
            organization_id=organization_id,
            department_id=data.department_id,
            name=data.name,
            code=data.code,
            duration_years=data.duration_years,
        )

        db.add(course)
        db.commit()
        db.refresh(course)

        return course

    @staticmethod
    def get_all(
        db: Session,
        organization_id: UUID,
    ):

        return db.scalars(
            select(Course)
            .where(
                Course.organization_id == organization_id
            )
            .order_by(Course.name)
        ).all()

    @staticmethod
    def get_by_id(
        db: Session,
        organization_id: UUID,
        course_id: UUID,
    ):

        course = db.scalar(
            select(Course).where(
                Course.id == course_id,
                Course.organization_id == organization_id,
            )
        )

        if not course:
            raise HTTPException(
                status_code=404,
                detail="Course not found",
            )

        return course

    @staticmethod
    def update(
        db: Session,
        organization_id: UUID,
        course_id: UUID,
        data: CourseUpdate,
    ):

        course = CourseService.get_by_id(
            db,
            organization_id,
            course_id,
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

        for field, value in updates.items():
            setattr(course, field, value)

        db.commit()
        db.refresh(course)

        return course

    @staticmethod
    def delete(
        db: Session,
        organization_id: UUID,
        course_id: UUID,
    ):

        course = CourseService.get_by_id(
            db,
            organization_id,
            course_id,
        )

        course.is_active = False

        db.commit()
        db.refresh(course)

        return course
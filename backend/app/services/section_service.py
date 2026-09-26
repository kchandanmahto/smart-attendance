from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.section import Section
from app.schemas.section import SectionCreate, SectionUpdate


class SectionService:

    @staticmethod
    def create(
        db: Session,
        organization_id: UUID,
        data: SectionCreate,
    ):

        course = db.scalar(
            select(Course).where(
                Course.id == data.course_id,
                Course.organization_id == organization_id,
                Course.is_active.is_(True),
            )
        )

        if not course:
            raise HTTPException(
                status_code=404,
                detail="Course not found",
            )

        section = Section(
            course_id=data.course_id,
            name=data.name,
            academic_year=data.academic_year,
            semester=data.semester,
        )

        db.add(section)
        db.commit()
        db.refresh(section)

        return section

    @staticmethod
    def get_all(
        db: Session,
        organization_id: UUID,
    ):

        return db.scalars(
            select(Section)
            .join(
                Course,
                Section.course_id == Course.id,
            )
            .where(
                Course.organization_id == organization_id
            )
            .order_by(Section.name)
        ).all()

    @staticmethod
    def get_by_id(
        db: Session,
        organization_id: UUID,
        section_id: UUID,
    ):

        section = db.scalar(
            select(Section)
            .join(
                Course,
                Section.course_id == Course.id,
            )
            .where(
                Section.id == section_id,
                Course.organization_id == organization_id,
            )
        )

        if not section:
            raise HTTPException(
                status_code=404,
                detail="Section not found",
            )

        return section

    @staticmethod
    def update(
        db: Session,
        organization_id: UUID,
        section_id: UUID,
        data: SectionUpdate,
    ):

        section = SectionService.get_by_id(
            db,
            organization_id,
            section_id,
        )

        updates = data.model_dump(
            exclude_unset=True
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
            setattr(section, field, value)

        db.commit()
        db.refresh(section)

        return section

    @staticmethod
    def delete(
        db: Session,
        organization_id: UUID,
        section_id: UUID,
    ):

        section = SectionService.get_by_id(
            db,
            organization_id,
            section_id,
        )

        section.is_active = False

        db.commit()
        db.refresh(section)

        return section
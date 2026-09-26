from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate


class DepartmentService:

    @staticmethod
    def create(
        db: Session,
        organization_id: UUID,
        data: DepartmentCreate,
    ):

        existing = db.scalar(
            select(Department).where(
                Department.organization_id == organization_id,
                Department.code == data.code,
            )
        )

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Department code already exists",
            )

        department = Department(
            organization_id=organization_id,
            name=data.name,
            code=data.code,
            description=data.description,
        )

        db.add(department)
        db.commit()
        db.refresh(department)

        return department

    @staticmethod
    def get_all(
        db: Session,
        organization_id: UUID,
    ):

        return db.scalars(
            select(Department)
            .where(
                Department.organization_id == organization_id
            )
            .order_by(Department.name)
        ).all()

    @staticmethod
    def get_by_id(
        db: Session,
        organization_id: UUID,
        department_id: UUID,
    ):

        department = db.scalar(
            select(Department).where(
                Department.id == department_id,
                Department.organization_id == organization_id,
            )
        )

        if not department:
            raise HTTPException(
                status_code=404,
                detail="Department not found",
            )

        return department

    @staticmethod
    def update(
        db: Session,
        organization_id: UUID,
        department_id: UUID,
        data: DepartmentUpdate,
    ):

        department = DepartmentService.get_by_id(
            db,
            organization_id,
            department_id,
        )

        for field, value in data.model_dump(
            exclude_unset=True
        ).items():
            setattr(department, field, value)

        db.commit()
        db.refresh(department)

        return department

    @staticmethod
    def delete(
        db: Session,
        organization_id: UUID,
        department_id: UUID,
    ):

        department = DepartmentService.get_by_id(
            db,
            organization_id,
            department_id,
        )

        department.is_active = False

        db.commit()
        db.refresh(department)

        return department
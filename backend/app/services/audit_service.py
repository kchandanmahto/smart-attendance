from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


class AuditService:

    @staticmethod
    def create(
        db: Session,
        organization_id: UUID,
        action: str,
        user_id: UUID | None = None,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        description: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLog:

        log = AuditLog(
            organization_id=organization_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        db.add(log)
        db.flush()

        return log

    @staticmethod
    def get_logs(
        db: Session,
        organization_id: UUID,
        limit: int = 100,
    ) -> list[AuditLog]:

        stmt = (
            select(AuditLog)
            .where(
                AuditLog.organization_id
                == organization_id
            )
            .order_by(
                AuditLog.created_at.desc()
            )
            .limit(limit)
        )

        return db.scalars(stmt).all()
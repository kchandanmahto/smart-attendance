from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.database.session import get_db
from app.schemas.audit_log import AuditLogResponse
from app.services.audit_service import AuditService


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


@router.get(
    "",
    response_model=list[AuditLogResponse],
)
def get_audit_logs(
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "ADMIN",
        )
    ),
    db: Session = Depends(get_db),
):
    return AuditService.get_logs(
        db=db,
        organization_id=current_user.organization_id,
        limit=limit,
    )
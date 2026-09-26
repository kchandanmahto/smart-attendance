from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    organization_id: UUID
    user_id: UUID | None
    action: str
    entity_type: str | None
    entity_id: UUID | None
    description: str | None
    ip_address: str | None
    user_agent: str | None
    created_at: datetime
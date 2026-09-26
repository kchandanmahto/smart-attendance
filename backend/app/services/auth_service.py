from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    verify_password,
)
from app.models.role import Role
from app.models.user import User


class AuthService:

    @staticmethod
    def login(
        db: Session,
        email: str,
        password: str,
    ):

        user = db.scalar(
            select(User).where(
                User.email == email,
                User.is_active.is_(True),
            )
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not verify_password(
            password,
            user.password_hash,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        role = db.scalar(
            select(Role).where(
                Role.id == user.role_id
            )
        )

        if not role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User role not configured",
            )

        token = create_access_token(
            user_id=user.id,
            organization_id=user.organization_id,
            role=role.name,
        )

        return token, user, role
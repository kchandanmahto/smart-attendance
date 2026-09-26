from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    TokenResponse,
)
from app.services.auth_service import AuthService


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):

    token, _, _ = AuthService.login(
        db=db,
        email=data.email,
        password=data.password,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
def get_me(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    from sqlalchemy import select
    from app.models.role import Role

    role = db.scalar(
        select(Role).where(
            Role.id == current_user.role_id
        )
    )

    return {
        "id": current_user.id,
        "organization_id": current_user.organization_id,
        "role": role.name if role else "UNKNOWN",
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
    }
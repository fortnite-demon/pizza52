from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

ALLOWED_ROLES = {"customer", "admin"}


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return current_user


# ---------- Schemas ----------

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    phone: str | None
    role: str
    is_blocked: bool
    created_at: str


class ChangeRoleRequest(BaseModel):
    role: str


class BlockUserRequest(BaseModel):
    is_blocked: bool


# ---------- Helpers ----------

def _serialize_user(u: User) -> UserResponse:
    return UserResponse(
        id=u.id,
        email=u.email,
        name=u.name,
        phone=u.phone,
        role=u.role,
        is_blocked=u.is_blocked,
        created_at=u.created_at.isoformat(),
    )


# ---------- Endpoints ----------

@router.get("/users", response_model=list[UserResponse])
def get_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[UserResponse]:
    users = db.query(User).order_by(User.created_at.asc()).all()
    return [_serialize_user(u) for u in users]


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def change_user_role(
    user_id: int,
    payload: ChangeRoleRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> UserResponse:
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Роль должна быть одной из: {', '.join(ALLOWED_ROLES)}",
        )
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя изменить собственную роль",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return _serialize_user(user)


@router.patch("/users/{user_id}/block", response_model=UserResponse)
def block_user(
    user_id: int,
    payload: BlockUserRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> UserResponse:
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя заблокировать самого себя",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    user.is_blocked = payload.is_blocked
    db.commit()
    db.refresh(user)
    return _serialize_user(user)

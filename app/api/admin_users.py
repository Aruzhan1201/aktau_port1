from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker
from app.models.user import User, UserRole
from app.services import admin_service

router = APIRouter(prefix="/admin/users", tags=["Admin"])


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str
    phone: str | None = None
    company_id: int | None = None
    is_active: bool = True


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    role: str | None = None
    phone: str | None = None
    password: str | None = None
    is_active: bool | None = None


@router.get("/")
async def list_users(
    role: str | None = Query(None),
    search: str | None = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.super_admin)),
):
    users = await admin_service.list_users(session, role, search, skip, limit)
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role.value if hasattr(u.role, "value") else u.role,
            "company_id": u.company_id,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.get("/{user_id}")
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.super_admin)),
):
    user = await admin_service.get_user(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role.value if hasattr(user.role, "value") else user.role,
        "company_id": user.company_id,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("/")
async def create_user(
    body: UserCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.super_admin)),
):
    user = await admin_service.create_user(
        session, body.name, body.email, body.password,
        body.role, body.phone, body.company_id, body.is_active,
    )
    return {"id": user.id, "message": "User created"}


@router.put("/{user_id}")
async def update_user(
    user_id: int,
    body: UserUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.super_admin)),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    user = await admin_service.update_user(session, user_id, updates)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated"}


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.super_admin)),
):
    deleted = await admin_service.delete_user(session, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

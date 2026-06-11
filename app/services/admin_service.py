from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.core.security import hash_password as get_password_hash


async def list_users(
    session: AsyncSession,
    role: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[User]:
    query = select(User).order_by(desc(User.created_at))
    if role:
        query = query.where(User.role == UserRole(role))
    if search:
        like = f"%{search}%"
        query = query.where(
            User.name.ilike(like) | User.email.ilike(like) | User.phone.ilike(like)
        )
    query = query.offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_user(session: AsyncSession, user_id: int) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(
    session: AsyncSession,
    name: str,
    email: str,
    password: str,
    role: str,
    phone: str | None = None,
    company_id: int | None = None,
    is_active: bool = True,
) -> User:
    user = User(
        name=name,
        email=email,
        hashed_password=get_password_hash(password),
        role=UserRole(role),
        phone=phone,
        company_id=company_id,
        is_active=is_active,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def update_user(
    session: AsyncSession,
    user_id: int,
    updates: dict[str, Any],
) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return None
    for key, value in updates.items():
        if key == "role":
            setattr(user, key, UserRole(value))
        elif key == "password":
            user.hashed_password = get_password_hash(value)
        elif hasattr(user, key) and key not in ("id", "created_at", "hashed_password"):
            setattr(user, key, value)
    await session.commit()
    await session.refresh(user)
    return user


async def deactivate_user(session: AsyncSession, user_id: int) -> bool:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return False
    user.is_active = False
    await session.commit()
    return True


async def delete_user(session: AsyncSession, user_id: int) -> bool:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return False
    await session.delete(user)
    await session.commit()
    return True


def _user_to_dict(user: User) -> dict:
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

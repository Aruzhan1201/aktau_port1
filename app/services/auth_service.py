from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole


async def register_user(
    session: AsyncSession,
    name: str,
    email: str,
    password: str,
    role: UserRole = UserRole.client,
    phone: str | None = None,
    company_id: int | None = None,
) -> User:
    existing = await session.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise ValueError("Email already registered")

    user = User(
        name=name,
        email=email,
        phone=phone,
        role=role,
        company_id=company_id,
        hashed_password=hash_password(password),
    )
    session.add(user)
    try:
        await session.flush()
    except IntegrityError:
        raise ValueError("Email already registered")
    return user


async def login_user(
    session: AsyncSession, email: str, password: str
) -> tuple[User, str]:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("Invalid email or password")
    if not verify_password(password, user.hashed_password):
        raise ValueError("Invalid email or password")
    if not user.is_active:
        raise ValueError("Account is deactivated")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return user, token

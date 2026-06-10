from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company


async def create_company(
    session: AsyncSession,
    name: str,
    tax_id: str | None = None,
    address: str | None = None,
    phone: str | None = None,
    email: str | None = None,
) -> Company:
    company = Company(
        name=name,
        tax_id=tax_id,
        address=address,
        phone=phone,
        email=email,
    )
    session.add(company)
    await session.flush()
    return company


async def get_company(session: AsyncSession, company_id: int) -> Company | None:
    result = await session.execute(select(Company).where(Company.id == company_id))
    return result.scalar_one_or_none()


async def list_companies(session: AsyncSession) -> list[Company]:
    result = await session.execute(select(Company).order_by(Company.name))
    return list(result.scalars().all())


async def update_company(
    session: AsyncSession, company_id: int, data: dict
) -> Company | None:
    company = await get_company(session, company_id)
    if not company:
        return None
    for key, value in data.items():
        if value is not None and hasattr(company, key):
            setattr(company, key, value)
    await session.flush()
    return company


async def delete_company(session: AsyncSession, company_id: int) -> Company | None:
    company = await get_company(session, company_id)
    if not company:
        return None
    await session.delete(company)
    await session.flush()
    return company

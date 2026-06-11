from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tariff_plan import TariffPlan


async def create_tariff(
    session: AsyncSession,
    port: str,
    name: str,
    service_type: str,
    price: float,
    unit: str = "per_hour",
    currency: str = "USD",
    valid_from: datetime | None = None,
    valid_to: datetime | None = None,
) -> TariffPlan:
    tariff = TariffPlan(
        port=port,
        name=name,
        service_type=service_type,
        price=price,
        unit=unit,
        currency=currency,
        valid_from=valid_from,
        valid_to=valid_to,
    )
    session.add(tariff)
    await session.commit()
    await session.refresh(tariff)
    return tariff


async def update_tariff(session: AsyncSession, tariff_id: int, updates: dict[str, Any]) -> TariffPlan | None:
    result = await session.execute(select(TariffPlan).where(TariffPlan.id == tariff_id))
    tariff = result.scalar_one_or_none()
    if not tariff:
        return None
    for key, value in updates.items():
        if hasattr(tariff, key):
            setattr(tariff, key, value)
    await session.commit()
    await session.refresh(tariff)
    return tariff


async def delete_tariff(session: AsyncSession, tariff_id: int) -> bool:
    result = await session.execute(select(TariffPlan).where(TariffPlan.id == tariff_id))
    tariff = result.scalar_one_or_none()
    if not tariff:
        return False
    await session.delete(tariff)
    await session.commit()
    return True


async def get_tariffs(
    session: AsyncSession,
    port: str | None = None,
    service_type: str | None = None,
) -> list[TariffPlan]:
    query = select(TariffPlan)
    if port:
        query = query.where(TariffPlan.port == port)
    if service_type:
        query = query.where(TariffPlan.service_type == service_type)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_active_tariffs(session: AsyncSession, port: str | None = None) -> list[TariffPlan]:
    now = datetime.now(timezone.utc)
    query = select(TariffPlan).where(
        and_(
            TariffPlan.valid_from.is_(None) | (TariffPlan.valid_from <= now),
            TariffPlan.valid_to.is_(None) | (TariffPlan.valid_to >= now),
        )
    )
    if port:
        query = query.where(TariffPlan.port == port)
    result = await session.execute(query)
    return list(result.scalars().all())


async def calculate_cost(
    session: AsyncSession,
    port: str,
    service_type: str,
    units: float = 1.0,
) -> dict:
    tariffs = await get_active_tariffs(session, port)
    matching = [t for t in tariffs if t.service_type == service_type]
    if not matching:
        return {"available": False, "cost": 0, "currency": "USD", "message": "No tariff found"}
    tariff = matching[0]
    total = tariff.price * units
    return {
        "available": True,
        "tariff_id": tariff.id,
        "tariff_name": tariff.name,
        "price_per_unit": tariff.price,
        "unit": tariff.unit,
        "units": units,
        "cost": round(total, 2),
        "currency": tariff.currency,
    }

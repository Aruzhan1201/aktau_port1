from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ship import Ship, ShipStatus


async def create_ship(
    session: AsyncSession,
    name: str,
    capacity: float,
    imo_number: str | None = None,
    captain_id: int | None = None,
) -> Ship:
    ship = Ship(
        name=name,
        imo_number=imo_number,
        captain_id=captain_id,
        capacity=capacity,
        status=ShipStatus.available,
    )
    session.add(ship)
    await session.flush()
    return ship


async def get_ship(session: AsyncSession, ship_id: int) -> Ship | None:
    result = await session.execute(select(Ship).where(Ship.id == ship_id))
    return result.scalar_one_or_none()


async def list_ships(
    session: AsyncSession,
    status: ShipStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Ship], int]:
    query = select(Ship)
    count_query = select(func.count(Ship.id))
    if status:
        query = query.where(Ship.status == status)
        count_query = count_query.where(Ship.status == status)

    total = (await session.execute(count_query)).scalar() or 0
    query = query.order_by(Ship.name).offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all()), total


async def update_ship(
    session: AsyncSession, ship_id: int, data: dict
) -> Ship | None:
    ship = await get_ship(session, ship_id)
    if not ship:
        return None
    for key, value in data.items():
        if value is not None and hasattr(ship, key):
            setattr(ship, key, value)
    await session.flush()
    return ship


async def delete_ship(session: AsyncSession, ship_id: int) -> Ship | None:
    ship = await get_ship(session, ship_id)
    if not ship:
        return None
    await session.delete(ship)
    await session.flush()
    return ship


async def update_ship_location(
    session: AsyncSession, ship_id: int, latitude: float, longitude: float
) -> Ship | None:
    ship = await get_ship(session, ship_id)
    if not ship:
        return None
    ship.current_location = {"lat": latitude, "lng": longitude}
    await session.flush()
    return ship


async def find_available_ships(
    session: AsyncSession, min_capacity: float = 0
) -> list[Ship]:
    query = select(Ship).where(
        Ship.status == ShipStatus.available,
        Ship.capacity >= min_capacity,
    )
    result = await session.execute(query)
    return list(result.scalars().all())

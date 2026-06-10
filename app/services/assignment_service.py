from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assignment import Assignment


async def create_assignment(
    session: AsyncSession,
    ship_id: int,
    berth_id: int,
    cargo_id: int | None = None,
    arrival_time: datetime | None = None,
    departure_time: datetime | None = None,
) -> Assignment:
    assignment = Assignment(
        ship_id=ship_id,
        berth_id=berth_id,
        cargo_id=cargo_id,
        status="active",
        arrival_time=arrival_time or datetime.now(timezone.utc),
        departure_time=departure_time,
    )
    session.add(assignment)
    await session.flush()
    return assignment


async def get_assignment(session: AsyncSession, assignment_id: int) -> Assignment | None:
    result = await session.execute(
        select(Assignment).where(Assignment.id == assignment_id)
    )
    return result.scalar_one_or_none()


async def list_assignments(
    session: AsyncSession,
    ship_id: int | None = None,
    berth_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Assignment], int]:
    query = select(Assignment)
    count_query = select(func.count(Assignment.id))
    if ship_id is not None:
        query = query.where(Assignment.ship_id == ship_id)
        count_query = count_query.where(Assignment.ship_id == ship_id)
    if berth_id is not None:
        query = query.where(Assignment.berth_id == berth_id)
        count_query = count_query.where(Assignment.berth_id == berth_id)

    total = (await session.execute(count_query)).scalar() or 0
    query = query.order_by(Assignment.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all()), total

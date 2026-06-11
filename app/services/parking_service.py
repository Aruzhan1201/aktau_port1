from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.parking_zone import ParkingZone, ParkingZoneStatus
from app.models.parking_spot import ParkingSpot, ParkingSpotStatus


async def create_zone(
    session: AsyncSession,
    name: str,
    port: str,
    capacity: int,
    manager_id: int | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> ParkingZone:
    zone = ParkingZone(
        name=name,
        port=port,
        capacity=capacity,
        manager_id=manager_id,
    )
    if latitude is not None and longitude is not None:
        zone.location_coords = {"latitude": latitude, "longitude": longitude}

    session.add(zone)
    await session.flush()

    for i in range(1, capacity + 1):
        spot = ParkingSpot(
            zone_id=zone.id,
            spot_number=f"{name}-{i:03d}",
            status=ParkingSpotStatus.free,
        )
        session.add(spot)

    await session.flush()
    return zone


async def get_zone(session: AsyncSession, zone_id: int) -> ParkingZone | None:
    result = await session.execute(select(ParkingZone).where(ParkingZone.id == zone_id))
    return result.scalar_one_or_none()


async def list_zones(
    session: AsyncSession,
    port: str | None = None,
    status: ParkingZoneStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[ParkingZone], int]:
    query = select(ParkingZone)
    count_query = select(func.count(ParkingZone.id))
    if port:
        query = query.where(ParkingZone.port == port)
        count_query = count_query.where(ParkingZone.port == port)
    if status:
        query = query.where(ParkingZone.status == status)
        count_query = count_query.where(ParkingZone.status == status)

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(ParkingZone.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    items = list(result.scalars().all())
    return items, total


async def update_zone(session: AsyncSession, zone_id: int, data: dict) -> ParkingZone | None:
    zone = await get_zone(session, zone_id)
    if not zone:
        return None
    for key, value in data.items():
        if value is not None and hasattr(zone, key):
            setattr(zone, key, value)
    await session.flush()
    return zone


async def delete_zone(session: AsyncSession, zone_id: int) -> ParkingZone | None:
    zone = await get_zone(session, zone_id)
    if not zone:
        return None
    await session.delete(zone)
    await session.flush()
    return zone


async def list_spots(
    session: AsyncSession,
    zone_id: int | None = None,
    status: ParkingSpotStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[ParkingSpot], int]:
    query = select(ParkingSpot)
    count_query = select(func.count(ParkingSpot.id))
    if zone_id is not None:
        query = query.where(ParkingSpot.zone_id == zone_id)
        count_query = count_query.where(ParkingSpot.zone_id == zone_id)
    if status:
        query = query.where(ParkingSpot.status == status)
        count_query = count_query.where(ParkingSpot.status == status)

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(ParkingSpot.spot_number).offset(skip).limit(limit)
    result = await session.execute(query)
    items = list(result.scalars().all())
    return items, total


async def get_spot(session: AsyncSession, spot_id: int) -> ParkingSpot | None:
    result = await session.execute(select(ParkingSpot).where(ParkingSpot.id == spot_id))
    return result.scalar_one_or_none()


async def assign_spot(
    session: AsyncSession,
    spot_id: int,
    driver_id: int,
    tariff_per_hour: float | None = None,
) -> ParkingSpot | None:
    spot = await get_spot(session, spot_id)
    if not spot:
        return None
    if spot.status != ParkingSpotStatus.free:
        raise ValueError(f"Spot is {spot.status.value}, not free")

    spot.driver_id = driver_id
    spot.status = ParkingSpotStatus.occupied
    spot.time_in = datetime.now(timezone.utc)
    if tariff_per_hour is not None:
        spot.tariff_per_hour = tariff_per_hour

    zone = await get_zone(session, spot.zone_id)
    if zone:
        occupied = await _count_occupied(session, spot.zone_id)
        if occupied >= zone.capacity:
            zone.status = ParkingZoneStatus.full

    await session.flush()
    return spot


async def release_spot(session: AsyncSession, spot_id: int) -> ParkingSpot | None:
    spot = await get_spot(session, spot_id)
    if not spot:
        return None

    spot.driver_id = None
    spot.status = ParkingSpotStatus.free
    spot.time_out = datetime.now(timezone.utc)
    spot.time_in = None

    zone = await get_zone(session, spot.zone_id)
    if zone and zone.status == ParkingZoneStatus.full:
        zone.status = ParkingZoneStatus.active

    await session.flush()
    return spot


async def _count_occupied(session: AsyncSession, zone_id: int) -> int:
    result = await session.execute(
        select(func.count(ParkingSpot.id)).where(
            ParkingSpot.zone_id == zone_id,
            ParkingSpot.status == ParkingSpotStatus.occupied,
        )
    )
    return result.scalar() or 0

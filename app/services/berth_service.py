from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.berth import Berth, BerthStatus
from app.models.berth_reservation import BerthReservation, ReservationStatus
from app.models.notification import Notification, NotificationType
from app.models.ship import Ship

from app.services.payment_service import are_reservation_payments_paid


async def create_berth(
    session: AsyncSession,
    name: str,
    capacity: float,
    manager_id: int | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> Berth:
    coords = None
    if latitude is not None and longitude is not None:
        coords = {"lat": latitude, "lng": longitude}
    berth = Berth(
        name=name,
        manager_id=manager_id,
        capacity=capacity,
        status=BerthStatus.free,
        location_coords=coords,
    )
    session.add(berth)
    await session.flush()
    return berth


async def get_berth(session: AsyncSession, berth_id: int) -> Berth | None:
    result = await session.execute(select(Berth).where(Berth.id == berth_id))
    return result.scalar_one_or_none()


async def list_berths(
    session: AsyncSession,
    status: BerthStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Berth], int]:
    query = select(Berth)
    count_query = select(func.count(Berth.id))
    if status:
        query = query.where(Berth.status == status)
        count_query = count_query.where(Berth.status == status)
    total = (await session.execute(count_query)).scalar() or 0
    query = query.order_by(Berth.name).offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all()), total


async def update_berth(
    session: AsyncSession, berth_id: int, data: dict
) -> Berth | None:
    berth = await get_berth(session, berth_id)
    if not berth:
        return None
    if "latitude" in data and "longitude" in data:
        if data["latitude"] is not None and data["longitude"] is not None:
            data["location_coords"] = {
                "lat": data.pop("latitude"),
                "lng": data.pop("longitude"),
            }
        else:
            data.pop("latitude", None)
            data.pop("longitude", None)
    for key, value in data.items():
        if value is not None and hasattr(berth, key):
            setattr(berth, key, value)
    await session.flush()
    return berth


async def delete_berth(session: AsyncSession, berth_id: int) -> Berth | None:
    berth = await get_berth(session, berth_id)
    if not berth:
        return None
    await session.delete(berth)
    await session.flush()
    return berth


async def _check_overlapping_reservation(
    session: AsyncSession,
    berth_id: int,
    arrival_time: datetime,
    departure_time: datetime | None,
    exclude_reservation_id: int | None = None,
) -> bool:
    query = select(BerthReservation).where(
        BerthReservation.berth_id == berth_id,
        BerthReservation.status == ReservationStatus.active,
        BerthReservation.arrival_time < (
            departure_time.replace(tzinfo=timezone.utc) if departure_time and departure_time.tzinfo is None
            else departure_time or datetime(9999, 12, 31, tzinfo=timezone.utc)
        ),
        or_(
            BerthReservation.departure_time.is_(None),
            BerthReservation.departure_time > (
                arrival_time.replace(tzinfo=timezone.utc) if arrival_time.tzinfo is None
                else arrival_time
            ),
        ),
    )
    if exclude_reservation_id:
        query = query.where(BerthReservation.id != exclude_reservation_id)

    result = await session.execute(query)
    return result.first() is not None


async def reserve_berth(
    session: AsyncSession,
    berth_id: int,
    ship_id: int,
    arrival_time: datetime,
    departure_time: datetime | None = None,
    reserved_by: int | None = None,
) -> BerthReservation:
    berth = await get_berth(session, berth_id)
    if not berth:
        raise ValueError("Berth not found")
    if berth.status == BerthStatus.maintenance:
        raise ValueError("Berth is under maintenance")

    if await _check_overlapping_reservation(
        session, berth_id, arrival_time, departure_time
    ):
        raise ValueError("Berth is occupied for selected dates")

    ship_result = await session.execute(select(Ship).where(Ship.id == ship_id))
    ship = ship_result.scalar_one_or_none()
    if not ship:
        raise ValueError("Ship not found")

    reservation = BerthReservation(
        berth_id=berth_id,
        ship_id=ship_id,
        status=ReservationStatus.active,
        arrival_time=arrival_time,
        departure_time=departure_time,
    )
    session.add(reservation)
    berth.status = BerthStatus.occupied

    if reserved_by:
        notif = Notification(
            user_id=berth.manager_id if berth.manager_id else reserved_by,
            title="Berth Reserved",
            message=f"Berth {berth.name} reserved for ship {ship.name}.",
            type=NotificationType.berth_update,
            related_entity_type="berth",
            related_entity_id=berth_id,
        )
        session.add(notif)

    await session.flush()
    return reservation


async def release_berth(
    session: AsyncSession, berth_id: int
) -> Berth | None:
    berth = await get_berth(session, berth_id)
    if not berth:
        return None
    berth.status = BerthStatus.free

    result = await session.execute(
        select(BerthReservation).where(
            BerthReservation.berth_id == berth_id,
            BerthReservation.status == ReservationStatus.active,
        )
    )
    active_reservations = list(result.scalars().all())
    for res in active_reservations:
        res.status = ReservationStatus.completed
        res.departure_time = datetime.now(timezone.utc)

    return berth

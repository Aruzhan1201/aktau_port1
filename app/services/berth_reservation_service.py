from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.berth import Berth
from app.models.berth_reservation import BerthReservation, ReservationStatus
from app.models.ship import Ship


async def get_berth_reservations(
    session: AsyncSession,
    berth_id: int | None = None,
    status: ReservationStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[dict], int]:
    query = (
        select(
            BerthReservation,
            Berth.name.label("berth_name"),
            Ship.name.label("ship_name"),
        )
        .join(Berth, BerthReservation.berth_id == Berth.id)
        .join(Ship, BerthReservation.ship_id == Ship.id)
    )
    count_query = select(func.count(BerthReservation.id))

    if berth_id is not None:
        query = query.where(BerthReservation.berth_id == berth_id)
        count_query = count_query.where(BerthReservation.berth_id == berth_id)
    if status is not None:
        query = query.where(BerthReservation.status == status)
        count_query = count_query.where(BerthReservation.status == status)

    total = (await session.execute(count_query)).scalar() or 0
    query = query.order_by(BerthReservation.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    rows = result.all()

    items = []
    for row in rows:
        reservation = row[0]
        items.append(
            {
                "id": reservation.id,
                "berth_id": reservation.berth_id,
                "ship_id": reservation.ship_id,
                "berth_name": row.berth_name,
                "ship_name": row.ship_name,
                "status": reservation.status.value,
                "arrival_time": reservation.arrival_time.isoformat() if reservation.arrival_time else None,
                "departure_time": reservation.departure_time.isoformat() if reservation.departure_time else None,
                "created_at": reservation.created_at.isoformat() if reservation.created_at else None,
            }
        )
    return items, total


async def cancel_reservation(
    session: AsyncSession, reservation_id: int
) -> BerthReservation | None:
    result = await session.execute(
        select(BerthReservation).where(BerthReservation.id == reservation_id)
    )
    reservation = result.scalar_one_or_none()
    if not reservation:
        return None
    reservation.status = ReservationStatus.cancelled

    from app.models.berth import BerthStatus
    berth = await session.get(Berth, reservation.berth_id)
    if berth:
        berth.status = BerthStatus.free

    return reservation

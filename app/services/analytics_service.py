import hashlib
import json

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.berth import Berth, BerthStatus
from app.models.cargo import Cargo, CargoStatus
from app.models.berth_reservation import BerthReservation, ReservationStatus
from app.models.payment import Payment, PaymentStatus, PaymentType
from app.models.ship import Ship, ShipStatus

from app.services.cache_service import cache_get, cache_set
from app.services.port_queue_service import calculate_average_waiting_time
from app.services.payment_service import get_revenue


def _make_cache_key(prefix: str, session: AsyncSession) -> str:
    raw = f"{prefix}:{id(session)}"
    return f"analytics:{hashlib.md5(raw.encode()).hexdigest()}"


async def get_dashboard(session: AsyncSession) -> dict:
    cache_key = _make_cache_key("dashboard", session)
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached
    total_cargoes = await _count(session, select(func.count(Cargo.id)))
    income_data = await get_revenue(session)

    occupied = await _count(
        session,
        select(func.count(Berth.id)).where(Berth.status == BerthStatus.occupied),
    )
    free = await _count(
        session,
        select(func.count(Berth.id)).where(Berth.status == BerthStatus.free),
    )
    total_berths = occupied + free
    berth_util = round((occupied / total_berths * 100), 1) if total_berths > 0 else 0

    avg_wait = await calculate_average_waiting_time(session)

    total_ships = await _count(session, select(func.count(Ship.id)))
    in_transit = await _count(
        session,
        select(func.count(Ship.id)).where(Ship.status == ShipStatus.in_transit),
    )
    ship_util = round((in_transit / total_ships * 100), 1) if total_ships > 0 else 0

    cargoes_by_status = {}
    for status in CargoStatus:
        cnt = await _count(
            session,
            select(func.count(Cargo.id)).where(Cargo.status == status),
        )
        cargoes_by_status[status.value] = cnt

    result = {
        "total_cargoes": total_cargoes,
        "total_income": income_data["total_income"],
        "income_by_type": {
            "cargo_fees": income_data["cargo_fees"],
            "berth_fees": income_data["berth_fees"],
            "penalties": income_data["penalties"],
        },
        "occupied_berths": occupied,
        "free_berths": free,
        "berth_utilization_pct": berth_util,
        "average_waiting_time_hours": avg_wait,
        "ship_utilization_pct": ship_util,
        "cargoes_by_status": cargoes_by_status,
    }
    await cache_set(cache_key, result)
    return result


async def get_ship_utilization(session: AsyncSession) -> dict:
    result = await session.execute(
        select(Ship.id, Ship.name, Ship.status)
    )
    ships = result.all()
    total = len(ships)
    in_transit_count = sum(1 for s in ships if s.status == ShipStatus.in_transit)

    by_ship = [
        {
            "ship_id": s.id,
            "name": s.name,
            "status": s.status.value if hasattr(s.status, "value") else s.status,
            "utilized": s.status == ShipStatus.in_transit,
        }
        for s in ships
    ]

    return {
        "overall_pct": round((in_transit_count / total * 100), 1) if total > 0 else 0,
        "by_ship": by_ship,
    }


async def get_waiting_times(session: AsyncSession) -> dict:
    from app.models.port_queue import PortQueue, QueueStatus

    result = await session.execute(
        select(
            func.avg(
                func.extract("epoch", PortQueue.assigned_at - PortQueue.entered_at) / 3600
            ),
            func.max(
                func.extract("epoch", PortQueue.assigned_at - PortQueue.entered_at) / 3600
            ),
            func.min(
                func.extract("epoch", PortQueue.assigned_at - PortQueue.entered_at) / 3600
            ),
        ).where(
            PortQueue.status.in_([QueueStatus.assigned, QueueStatus.completed]),
            PortQueue.assigned_at.isnot(None),
        )
    )
    row = result.one()
    return {
        "average_hours": round(row[0], 2) if row[0] else 0,
        "max_hours": round(row[1], 2) if row[1] else 0,
        "min_hours": round(row[2], 2) if row[2] else 0,
    }


async def _count(session: AsyncSession, query) -> int:
    result = await session.execute(query)
    return result.scalar() or 0

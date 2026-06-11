from datetime import datetime, timezone

from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cargo import Cargo
from app.models.berth import Berth, BerthStatus
from app.models.berth_reservation import BerthReservation
from app.models.parking_spot import ParkingSpot, ParkingSpotStatus
from app.models.parking_zone import ParkingZone
from app.models.port_queue import PortQueue, QueueStatus


async def get_traffic_overview(
    session: AsyncSession,
) -> dict:
    total_cargo = await _count(session, select(func.count(Cargo.id)))
    in_transit_cargo = await _count(
        session, select(func.count(Cargo.id)).where(Cargo.status == "in_transit")
    )
    waiting_cargo = await _count(
        session, select(func.count(Cargo.id)).where(Cargo.status.in_(["created", "approved", "assigned", "loading"]))
    )

    total_berths = await _count(session, select(func.count(Berth.id)))
    occupied_berths = await _count(
        session, select(func.count(Berth.id)).where(Berth.status == BerthStatus.occupied)
    )

    total_zones = await _count(session, select(func.count(ParkingZone.id)))
    total_spots = await _count(session, select(func.count(ParkingSpot.id)))
    occupied_spots = await _count(
        session, select(func.count(ParkingSpot.id)).where(ParkingSpot.status == ParkingSpotStatus.occupied)
    )

    queue_length = await _count(
        session, select(func.count(PortQueue.id)).where(PortQueue.status == QueueStatus.waiting)
    )

    avg_wait = await session.execute(
        select(
            func.avg(
                func.extract("epoch", PortQueue.assigned_at - PortQueue.entered_at) / 3600
            )
        ).where(
            PortQueue.status.in_([QueueStatus.assigned, QueueStatus.completed]),
            PortQueue.assigned_at.isnot(None),
        )
    )
    avg_wait_val = round(avg_wait.scalar() or 0, 2)

    return {
        "cargo": {
            "total": total_cargo,
            "in_transit": in_transit_cargo,
            "waiting_for_assignment": waiting_cargo,
        },
        "berths": {
            "total": total_berths,
            "occupied": occupied_berths,
            "free": total_berths - occupied_berths,
            "utilization_pct": round((occupied_berths / total_berths * 100), 1) if total_berths > 0 else 0,
        },
        "parking": {
            "total_zones": total_zones,
            "total_spots": total_spots,
            "occupied_spots": occupied_spots,
            "free_spots": total_spots - occupied_spots,
            "utilization_pct": round((occupied_spots / total_spots * 100), 1) if total_spots > 0 else 0,
        },
        "queue": {
            "waiting": queue_length,
            "avg_wait_hours": avg_wait_val,
        },
    }


async def _count(session: AsyncSession, query) -> int:
    result = await session.execute(query)
    return result.scalar() or 0

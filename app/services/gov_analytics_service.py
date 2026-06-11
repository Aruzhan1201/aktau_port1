from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cargo import Cargo, CargoStatus
from app.models.berth import Berth, BerthStatus
from app.models.berth_reservation import BerthReservation, ReservationStatus
from app.models.port_queue import PortQueue, QueueStatus
from app.models.incident_report import IncidentReport
from app.models.ro_ro_vehicle import RoRoVehicle


async def get_gov_dashboard(session: AsyncSession, port: str | None = None) -> dict:
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    # Throughput (cargo in last 7 days)
    cargo_filter = [Cargo.created_at >= week_ago]
    if port:
        pass
    total_cargo = await _count(session, select(func.count(Cargo.id)).where(and_(*cargo_filter)))

    # Berth occupancy
    total_berths = await _count(session, select(func.count(Berth.id)))
    occupied = await _count(
        session, select(func.count(Berth.id)).where(Berth.status == BerthStatus.occupied)
    )
    berth_util = round((occupied / total_berths * 100), 1) if total_berths > 0 else 0

    # Average queue wait
    avg_q = await session.execute(
        select(
            func.avg(
                func.extract("epoch", PortQueue.assigned_at - PortQueue.entered_at) / 3600
            )
        ).where(
            PortQueue.status.in_([QueueStatus.assigned, QueueStatus.completed]),
            PortQueue.assigned_at.isnot(None),
            PortQueue.entered_at >= week_ago,
        )
    )
    avg_wait = round(avg_q.scalar() or 0, 2)

    # Current queue length
    queue_len = await _count(
        session,
        select(func.count(PortQueue.id)).where(PortQueue.status == QueueStatus.waiting),
    )

    # Incidents (last 7 days)
    incident_filter = [IncidentReport.created_at >= week_ago]
    if port:
        incident_filter.append(IncidentReport.port == port)
    total_incidents = await _count(
        session, select(func.count(IncidentReport.id)).where(and_(*incident_filter))
    )

    # Ro-Ro throughput
    ro_filter = [RoRoVehicle.entry_time >= week_ago]
    if port:
        ro_filter.append(RoRoVehicle.port == port)
    ro_ro_count = await _count(
        session, select(func.count(RoRoVehicle.id)).where(and_(*ro_filter))
    )

    # Delayed cargoes
    delayed = await _count(
        session,
        select(func.count(Cargo.id)).where(
            Cargo.status.in_([CargoStatus.in_transit, CargoStatus.loading]),
            Cargo.eta.isnot(None),
            Cargo.eta < now,
        )
    )

    return {
        "throughput": {
            "total_cargo_7d": total_cargo,
            "ro_ro_vehicles_7d": ro_ro_count,
        },
        "berth_occupancy": {
            "total_berths": total_berths,
            "occupied": occupied,
            "free": total_berths - occupied,
            "utilization_pct": berth_util,
        },
        "delays": {
            "average_wait_hours": avg_wait,
            "queue_length": queue_len,
            "delayed_cargoes": delayed,
        },
        "incidents": {
            "total_7d": total_incidents,
        },
    }


async def get_throughput_trend(session: AsyncSession, port: str | None = None, days: int = 30) -> dict:
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)

    daily_cargo_q = select(
        func.date_trunc("day", Cargo.created_at),
        func.count(Cargo.id),
    ).where(Cargo.created_at >= since).group_by(func.date_trunc("day", Cargo.created_at))

    result = await session.execute(daily_cargo_q)
    daily_cargo = [{"date": r[0].isoformat(), "count": r[1]} for r in result]

    daily_ro_q = select(
        func.date_trunc("day", RoRoVehicle.entry_time),
        func.count(RoRoVehicle.id),
    ).where(RoRoVehicle.entry_time >= since)
    if port:
        daily_ro_q = daily_ro_q.where(RoRoVehicle.port == port)
    daily_ro_q = daily_ro_q.group_by(func.date_trunc("day", RoRoVehicle.entry_time))

    ro_result = await session.execute(daily_ro_q)
    daily_ro = [{"date": r[0].isoformat(), "count": r[1]} for r in ro_result]

    return {
        "daily_cargo": daily_cargo,
        "daily_ro_ro": daily_ro,
    }


async def get_delay_analytics(session: AsyncSession, days: int = 30) -> dict:
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)

    result = await session.execute(
        select(
            func.avg(func.extract("epoch", PortQueue.assigned_at - PortQueue.entered_at) / 3600),
            func.max(func.extract("epoch", PortQueue.assigned_at - PortQueue.entered_at) / 3600),
            func.min(func.extract("epoch", PortQueue.assigned_at - PortQueue.entered_at) / 3600),
            func.count(PortQueue.id),
        ).where(
            PortQueue.status.in_([QueueStatus.assigned, QueueStatus.completed]),
            PortQueue.assigned_at.isnot(None),
            PortQueue.entered_at >= since,
        )
    )
    row = result.one()
    return {
        "average_hours": round(row[0], 2) if row[0] else 0,
        "max_hours": round(row[1], 2) if row[1] else 0,
        "min_hours": round(row[2], 2) if row[2] else 0,
        "total_processed": row[3] or 0,
        "period_days": days,
    }


async def _count(session: AsyncSession, query) -> int:
    result = await session.execute(query)
    return result.scalar() or 0

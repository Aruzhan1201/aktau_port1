from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ro_ro_vehicle import RoRoVehicle, RoRoStatus
from app.models.ro_ro_processing_log import RoRoProcessingLog
from app.websocket.manager import manager


async def register_entry(
    session: AsyncSession,
    plate_number: str,
    driver_name: str,
    driver_phone: str | None,
    vehicle_type: str,
    port: str,
    cargo_id: int | None = None,
    operator_id: int | None = None,
) -> RoRoVehicle:
    vehicle = RoRoVehicle(
        plate_number=plate_number,
        driver_name=driver_name,
        driver_phone=driver_phone,
        vehicle_type=vehicle_type,
        port=port,
        cargo_id=cargo_id,
        status=RoRoStatus.entered,
        entry_time=datetime.now(timezone.utc),
    )
    session.add(vehicle)
    await session.flush()

    log = RoRoProcessingLog(
        vehicle_id=vehicle.id,
        action="entry",
        operator_id=operator_id,
    )
    session.add(log)
    await session.commit()
    await session.refresh(vehicle)

    await manager.broadcast_ro_ro_update(vehicle.id, {
        "type": "ro_ro_entry",
        "vehicle": _vehicle_to_dict(vehicle),
    })

    return vehicle


async def update_status(
    session: AsyncSession,
    vehicle_id: int,
    new_status: str,
    operator_id: int | None = None,
) -> RoRoVehicle | None:
    result = await session.execute(
        select(RoRoVehicle).where(RoRoVehicle.id == vehicle_id)
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        return None

    old_status = vehicle.status
    vehicle.status = RoRoStatus(new_status)

    if new_status == "exited":
        vehicle.exit_time = datetime.now(timezone.utc)

    log = RoRoProcessingLog(
        vehicle_id=vehicle.id,
        action=f"{old_status.value if hasattr(old_status, 'value') else old_status}_to_{new_status}",
        operator_id=operator_id,
    )
    session.add(log)
    await session.commit()
    await session.refresh(vehicle)

    await manager.broadcast_ro_ro_update(vehicle.id, {
        "type": "ro_ro_status",
        "vehicle": _vehicle_to_dict(vehicle),
    })

    return vehicle


async def register_exit(
    session: AsyncSession,
    vehicle_id: int,
    operator_id: int | None = None,
) -> RoRoVehicle | None:
    return await update_status(session, vehicle_id, "exited", operator_id)


async def get_vehicles(
    session: AsyncSession,
    port: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[RoRoVehicle]:
    query = select(RoRoVehicle).order_by(desc(RoRoVehicle.entry_time))
    if port:
        query = query.where(RoRoVehicle.port == port)
    if status:
        query = query.where(RoRoVehicle.status == RoRoStatus(status))
    query = query.offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_kpis(session: AsyncSession, port: str | None = None, period_days: int = 7) -> dict:
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=period_days)

    base_filter = [RoRoVehicle.entry_time >= since]
    if port:
        base_filter.append(RoRoVehicle.port == port)

    # Total vehicles
    total_q = select(func.count(RoRoVehicle.id)).where(and_(*base_filter))
    total_result = await session.execute(total_q)
    total = total_result.scalar() or 0

    # Exited vehicles (have processing time)
    exited_filter = base_filter + [RoRoVehicle.exit_time.isnot(None)]
    exited_q = select(func.count(RoRoVehicle.id)).where(and_(*exited_filter))
    exited_result = await session.execute(exited_q)
    exited = exited_result.scalar() or 0

    # Average processing time (hours)
    avg_q = select(
        func.avg(
            func.extract("epoch", RoRoVehicle.exit_time - RoRoVehicle.entry_time) / 3600
        )
    ).where(and_(*exited_filter))
    avg_result = await session.execute(avg_q)
    avg_time = round(avg_result.scalar() or 0, 2)

    # By status
    status_q = select(RoRoVehicle.status, func.count(RoRoVehicle.id)).where(
        and_(*base_filter)
    ).group_by(RoRoVehicle.status)
    status_result = await session.execute(status_q)
    by_status = {}
    for row in status_result:
        key = row[0].value if hasattr(row[0], "value") else row[0]
        by_status[key] = row[1]

    # Daily throughput
    day_filter = base_filter.copy()
    daily_q = select(
        func.date_trunc("day", RoRoVehicle.entry_time),
        func.count(RoRoVehicle.id),
    ).where(and_(*day_filter)).group_by(func.date_trunc("day", RoRoVehicle.entry_time))
    daily_result = await session.execute(daily_q)
    daily_throughput = []
    for row in daily_result:
        daily_throughput.append({
            "date": row[0].isoformat() if row[0] else None,
            "count": row[1],
        })

    return {
        "total_vehicles": total,
        "exited_vehicles": exited,
        "average_processing_hours": avg_time,
        "by_status": by_status,
        "daily_throughput": daily_throughput,
        "period_days": period_days,
    }


async def get_analytics(session: AsyncSession, port: str | None = None) -> dict:
    kpis = await get_kpis(session, port, 30)
    # Planned vs actual: estimate planned based on average throughput
    daily = kpis.get("daily_throughput", [])
    total_actual = kpis["total_vehicles"]
    planned_per_day = 50  # configurable target
    planned_total = planned_per_day * 30
    return {
        "kpis": kpis,
        "planned_vs_actual": {
            "planned": planned_total,
            "actual": total_actual,
            "achievement_pct": round((total_actual / planned_total * 100), 1) if planned_total > 0 else 0,
        },
    }


def _vehicle_to_dict(v: RoRoVehicle) -> dict:
    return {
        "id": v.id,
        "plate_number": v.plate_number,
        "driver_name": v.driver_name,
        "driver_phone": v.driver_phone,
        "vehicle_type": v.vehicle_type,
        "cargo_id": v.cargo_id,
        "port": v.port,
        "status": v.status.value if hasattr(v.status, "value") else v.status,
        "entry_time": v.entry_time.isoformat() if v.entry_time else None,
        "exit_time": v.exit_time.isoformat() if v.exit_time else None,
        "created_at": v.created_at.isoformat() if v.created_at else None,
    }

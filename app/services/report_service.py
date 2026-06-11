import csv
import io
from datetime import datetime, timezone

from sqlalchemy import func, select, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.performance_report import PerformanceReport
from app.models.cargo import Cargo, CargoStatus
from app.models.berth import Berth, BerthStatus
from app.models.incident_report import IncidentReport
from app.models.port_queue import PortQueue, QueueStatus
from app.models.ro_ro_vehicle import RoRoVehicle
from app.models.payment import Payment, PaymentStatus


async def generate_performance_report(
    session: AsyncSession,
    port: str,
    period_start: datetime,
    period_end: datetime,
    generated_by: int,
) -> dict:
    # Throughput
    total_cargo = await _count(
        session,
        select(func.count(Cargo.id)).where(
            Cargo.created_at.between(period_start, period_end),
        )
    )
    # Berth occupancy
    total_berths = await _count(session, select(func.count(Berth.id)).where(Berth.port.is_(None) | (Berth.id > 0)))
    occupied = await _count(
        session,
        select(func.count(Berth.id)).where(
            Berth.status == BerthStatus.occupied,
        )
    )
    berth_util = round((occupied / total_berths * 100), 1) if total_berths > 0 else 0

    # Average queue wait
    avg_wait = await session.execute(
        select(
            func.avg(
                func.extract("epoch", PortQueue.assigned_at - PortQueue.entered_at) / 3600
            )
        ).where(
            PortQueue.status.in_([QueueStatus.assigned, QueueStatus.completed]),
            PortQueue.assigned_at.isnot(None),
            PortQueue.entered_at.between(period_start, period_end),
        )
    )
    avg_wait_val = round(avg_wait.scalar() or 0, 2)

    # Incidents
    incident_count = await _count(
        session,
        select(func.count(IncidentReport.id)).where(
            IncidentReport.port == port,
            IncidentReport.created_at.between(period_start, period_end),
        )
    )

    # Ro-Ro throughput
    ro_ro_count = await _count(
        session,
        select(func.count(RoRoVehicle.id)).where(
            RoRoVehicle.port == port,
            RoRoVehicle.entry_time.between(period_start, period_end),
        )
    )

    data = {
        "port": port,
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "throughput": {
            "total_cargo": total_cargo,
            "ro_ro_vehicles": ro_ro_count,
        },
        "berth_occupancy": {
            "total_berths": total_berths,
            "occupied": occupied,
            "utilization_pct": berth_util,
        },
        "delays": {
            "average_wait_hours": avg_wait_val,
        },
        "safety": {
            "incidents": incident_count,
        },
    }
    return data


async def generate_safety_report(
    session: AsyncSession,
    port: str,
    period_start: datetime,
    period_end: datetime,
) -> dict:
    incidents = await session.execute(
        select(IncidentReport).where(
            IncidentReport.port == port,
            IncidentReport.created_at.between(period_start, period_end),
        )
    )
    incident_list = []
    for inc in incidents.scalars().all():
        incident_list.append({
            "id": inc.id,
            "type": inc.incident_type,
            "severity": inc.severity.value if hasattr(inc.severity, "value") else inc.severity,
            "status": inc.status.value if hasattr(inc.status, "value") else inc.status,
            "description": inc.description[:200],
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
        })

    # Severity breakdown
    sev_result = await session.execute(
        select(
            IncidentReport.severity,
            func.count(IncidentReport.id),
        ).where(
            IncidentReport.port == port,
            IncidentReport.created_at.between(period_start, period_end),
        ).group_by(IncidentReport.severity)
    )
    by_severity = {str(row[0]): row[1] for row in sev_result}

    return {
        "port": port,
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "total_incidents": len(incident_list),
        "by_severity": by_severity,
        "incidents": incident_list,
    }


async def generate_throughput_report(
    session: AsyncSession,
    port: str,
    period_start: datetime,
    period_end: datetime,
) -> dict:
    # Daily cargo counts
    result = await session.execute(
        select(
            func.date_trunc("day", Cargo.created_at),
            func.count(Cargo.id),
        ).where(
            Cargo.created_at.between(period_start, period_end),
        ).group_by(func.date_trunc("day", Cargo.created_at))
        .order_by(func.date_trunc("day", Cargo.created_at))
    )
    daily_cargo = [{"date": r[0].isoformat(), "count": r[1]} for r in result]

    # Daily Ro-Ro
    ro_result = await session.execute(
        select(
            func.date_trunc("day", RoRoVehicle.entry_time),
            func.count(RoRoVehicle.id),
        ).where(
            RoRoVehicle.port == port,
            RoRoVehicle.entry_time.between(period_start, period_end),
        ).group_by(func.date_trunc("day", RoRoVehicle.entry_time))
        .order_by(func.date_trunc("day", RoRoVehicle.entry_time))
    )
    daily_ro_ro = [{"date": r[0].isoformat(), "count": r[1]} for r in ro_result]

    total_cargo = sum(d["count"] for d in daily_cargo)
    total_ro_ro = sum(d["count"] for d in daily_ro_ro)

    return {
        "port": port,
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "total_cargo": total_cargo,
        "total_ro_ro": total_ro_ro,
        "daily_cargo": daily_cargo,
        "daily_ro_ro": daily_ro_ro,
    }


async def generate_delay_report(
    session: AsyncSession,
    port: str,
    period_start: datetime,
    period_end: datetime,
) -> dict:
    result = await session.execute(
        select(
            func.avg(func.extract("epoch", PortQueue.assigned_at - PortQueue.entered_at) / 3600),
            func.max(func.extract("epoch", PortQueue.assigned_at - PortQueue.entered_at) / 3600),
            func.min(func.extract("epoch", PortQueue.assigned_at - PortQueue.entered_at) / 3600),
        ).where(
            PortQueue.status.in_([QueueStatus.assigned, QueueStatus.completed]),
            PortQueue.assigned_at.isnot(None),
            PortQueue.entered_at.between(period_start, period_end),
        )
    )
    row = result.one()
    return {
        "port": port,
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "average_hours": round(row[0], 2) if row[0] else 0,
        "max_hours": round(row[1], 2) if row[1] else 0,
        "min_hours": round(row[2], 2) if row[2] else 0,
    }


async def save_report(
    session: AsyncSession,
    port: str,
    report_type: str,
    title: str,
    parameters: dict,
    data: dict,
    generated_by: int,
) -> PerformanceReport:
    report = PerformanceReport(
        port=port,
        report_type=report_type,
        title=title,
        generated_by=generated_by,
        parameters=parameters,
        data=data,
    )
    session.add(report)
    await session.commit()
    await session.refresh(report)
    return report


async def get_saved_reports(
    session: AsyncSession,
    port: str | None = None,
    report_type: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[PerformanceReport]:
    query = select(PerformanceReport)
    if port:
        query = query.where(PerformanceReport.port == port)
    if report_type:
        query = query.where(PerformanceReport.report_type == report_type)
    query = query.order_by(PerformanceReport.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


def export_csv(data: list[dict], column_order: list[str] | None = None) -> str:
    if not data:
        return ""
    output = io.StringIO()
    columns = column_order or list(data[0].keys())
    writer = csv.DictWriter(output, fieldnames=columns)
    writer.writeheader()
    for row in data:
        writer.writerow({k: row.get(k, "") for k in columns})
    return output.getvalue()


async def _count(session: AsyncSession, query) -> int:
    result = await session.execute(query)
    return result.scalar() or 0

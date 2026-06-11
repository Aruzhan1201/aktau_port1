from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.incident_report import IncidentReport, IncidentSeverity, IncidentStatus
from app.websocket.manager import manager


async def create_incident(
    session: AsyncSession,
    port: str,
    incident_type: str,
    severity: str,
    description: str,
    reported_by: int,
) -> IncidentReport:
    incident = IncidentReport(
        port=port,
        incident_type=incident_type,
        severity=IncidentSeverity(severity),
        description=description,
        reported_by=reported_by,
        status=IncidentStatus.open,
    )
    session.add(incident)
    await session.commit()
    await session.refresh(incident)

    await manager.broadcast_incident_update(incident.id, {
        "type": "incident_created",
        "incident": _incident_to_dict(incident),
    })

    return incident


async def update_incident(
    session: AsyncSession,
    incident_id: int,
    updates: dict[str, Any],
) -> IncidentReport | None:
    result = await session.execute(
        select(IncidentReport).where(IncidentReport.id == incident_id)
    )
    incident = result.scalar_one_or_none()
    if not incident:
        return None

    for key, value in updates.items():
        if hasattr(incident, key):
            if key == "status" and value == "resolved":
                setattr(incident, key, IncidentStatus(value))
                incident.resolved_at = datetime.now(timezone.utc)
            elif key == "severity":
                setattr(incident, key, IncidentSeverity(value))
            elif key == "status":
                setattr(incident, key, IncidentStatus(value))
            else:
                setattr(incident, key, value)

    await session.commit()
    await session.refresh(incident)

    await manager.broadcast_incident_update(incident.id, {
        "type": "incident_updated",
        "incident": _incident_to_dict(incident),
    })

    return incident


async def get_incidents(
    session: AsyncSession,
    port: str | None = None,
    status: str | None = None,
    severity: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[IncidentReport]:
    query = select(IncidentReport).order_by(desc(IncidentReport.created_at))
    if port:
        query = query.where(IncidentReport.port == port)
    if status:
        query = query.where(IncidentReport.status == IncidentStatus(status))
    if severity:
        query = query.where(IncidentReport.severity == IncidentSeverity(severity))
    query = query.offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_incident(session: AsyncSession, incident_id: int) -> IncidentReport | None:
    result = await session.execute(
        select(IncidentReport).where(IncidentReport.id == incident_id)
    )
    return result.scalar_one_or_none()


async def get_incident_stats(session: AsyncSession, port: str | None = None) -> dict:
    query = select(
        IncidentReport.status,
        func.count(IncidentReport.id),
    )
    if port:
        query = query.where(IncidentReport.port == port)
    query = query.group_by(IncidentReport.status)
    result = await session.execute(query)
    by_status = {row[0].value if hasattr(row[0], "value") else row[0]: row[1] for row in result}

    sev_query = select(
        IncidentReport.severity,
        func.count(IncidentReport.id),
    )
    if port:
        sev_query = sev_query.where(IncidentReport.port == port)
    sev_query = sev_query.group_by(IncidentReport.severity)
    sev_result = await session.execute(sev_query)
    by_severity = {row[0].value if hasattr(row[0], "value") else row[0]: row[1] for row in sev_result}

    total = sum(by_status.values())
    resolved = by_status.get("resolved", 0)
    resolution_rate = round((resolved / total * 100), 1) if total > 0 else 0

    return {
        "total": total,
        "by_status": by_status,
        "by_severity": by_severity,
        "resolution_rate_pct": resolution_rate,
    }


def _incident_to_dict(incident: IncidentReport) -> dict:
    return {
        "id": incident.id,
        "port": incident.port,
        "incident_type": incident.incident_type,
        "severity": incident.severity.value if hasattr(incident.severity, "value") else incident.severity,
        "description": incident.description,
        "reported_by": incident.reported_by,
        "status": incident.status.value if hasattr(incident.status, "value") else incident.status,
        "resolved_at": incident.resolved_at.isoformat() if incident.resolved_at else None,
        "resolution_notes": incident.resolution_notes,
        "created_at": incident.created_at.isoformat() if incident.created_at else None,
    }

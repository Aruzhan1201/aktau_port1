from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker, get_current_user
from app.models.user import User, UserRole
from app.services import incident_service

router = APIRouter(prefix="/incidents", tags=["Incidents"])


class IncidentCreate(BaseModel):
    port: str
    incident_type: str
    severity: str = "medium"
    description: str


class IncidentUpdate(BaseModel):
    status: str | None = None
    severity: str | None = None
    resolution_notes: str | None = None
    description: str | None = None


@router.post("/")
async def create_incident(
    body: IncidentCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    incident = await incident_service.create_incident(
        session, body.port, body.incident_type, body.severity, body.description, user.id
    )
    return {"id": incident.id, "message": "Incident created"}


@router.get("/")
async def list_incidents(
    port: str | None = Query(None),
    status: str | None = Query(None),
    severity: str | None = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.governance, UserRole.admin, UserRole.super_admin)),
):
    incidents = await incident_service.get_incidents(session, port, status, severity, skip, limit)
    return [
        {
            "id": i.id,
            "port": i.port,
            "incident_type": i.incident_type,
            "severity": i.severity.value if hasattr(i.severity, "value") else i.severity,
            "description": i.description,
            "reported_by": i.reported_by,
            "status": i.status.value if hasattr(i.status, "value") else i.status,
            "resolved_at": i.resolved_at.isoformat() if i.resolved_at else None,
            "resolution_notes": i.resolution_notes,
            "created_at": i.created_at.isoformat() if i.created_at else None,
        }
        for i in incidents
    ]


@router.get("/stats")
async def get_incident_stats(
    port: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.governance, UserRole.admin, UserRole.super_admin)),
):
    return await incident_service.get_incident_stats(session, port)


@router.get("/{incident_id}")
async def get_incident(
    incident_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.governance, UserRole.admin, UserRole.super_admin)),
):
    incident = await incident_service.get_incident(session, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/{incident_id}")
async def update_incident(
    incident_id: int,
    body: IncidentUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.governance, UserRole.admin, UserRole.super_admin)),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    incident = await incident_service.update_incident(session, incident_id, updates)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"message": "Incident updated"}

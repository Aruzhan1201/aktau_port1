from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker
from app.models.user import User, UserRole
from app.services import port_config_service, berth_service

router = APIRouter(prefix="/admin/ports", tags=["Admin"])


class PortUpdate(BaseModel):
    display_name: str | None = None
    center_lat: float | None = None
    center_lng: float | None = None
    zoom_level: int | None = None
    config_json: dict | None = None
    operations_status: str | None = None


class BerthBatchCreate(BaseModel):
    berths: list[dict[str, Any]]


class TransitRouteUpdate(BaseModel):
    name: str
    waypoints: list[dict[str, float]]
    color_hex: str = "#10b981"
    description: str | None = None
    distance_km: float | None = None


@router.get("/{port_name}")
async def get_port_config(
    port_name: str,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.super_admin)),
):
    config = await port_config_service.get_port_config(session, port_name)
    if not config:
        raise HTTPException(status_code=404, detail="Port not found")
    return {
        "id": config.id,
        "port_name": config.port_name,
        "display_name": config.display_name,
        "center_lat": config.center_lat,
        "center_lng": config.center_lng,
        "zoom_level": config.zoom_level,
        "config_json": config.config_json,
        "operations_status": config.operations_status,
    }


@router.put("/{port_name}")
async def update_port_config(
    port_name: str,
    body: PortUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.super_admin)),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    config = await port_config_service.update_port_config(session, port_name, updates)
    if not config:
        raise HTTPException(status_code=404, detail="Port not found")
    return {"message": "Port config updated"}


@router.get("/{port_name}/berths")
async def get_port_berths(
    port_name: str,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.super_admin)),
):
    return await port_config_service.get_berth_layout(session, port_name)


@router.post("/{port_name}/berths/batch")
async def batch_create_berths(
    port_name: str,
    body: BerthBatchCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.super_admin)),
):
    created = []
    for b in body.berths:
        berth = await berth_service.create_berth(
            session,
            name=b.get("name"),
            capacity=b.get("capacity", 0),
            lat=b.get("latitude", 0),
            lng=b.get("longitude", 0),
            manager_id=b.get("manager_id"),
        )
        created.append({"id": berth.id, "name": berth.name})
    return {"created": created, "count": len(created)}


@router.get("/{port_name}/routes")
async def get_transit_routes(
    port_name: str,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.super_admin, UserRole.admin)),
):
    return await port_config_service.get_transit_routes(session, port_name)

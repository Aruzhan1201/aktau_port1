from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.map import BerthMapResponse, RouteResponse, ShipMapResponse
from app.services import map_service, port_config_service

router = APIRouter(prefix="/maps", tags=["Maps"])


@router.get("/ships", response_model=list[ShipMapResponse])
async def get_ship_positions(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    return await map_service.get_ship_coordinates(session)


@router.get("/berths", response_model=list[BerthMapResponse])
async def get_berth_positions(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    return await map_service.get_berth_coordinates(session)


@router.get("/routes/{cargo_id}", response_model=RouteResponse)
async def get_cargo_route(
    cargo_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    route = await map_service.get_cargo_route(session, cargo_id)
    if not route:
        raise HTTPException(status_code=404, detail="Cargo not found")
    return route


# Per-port map endpoints
@router.get("/{port}/berths")
async def get_port_berths(
    port: str,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    return await port_config_service.get_berth_layout(session, port)


@router.get("/{port}/routes")
async def get_port_routes(
    port: str,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    routes = await port_config_service.get_transit_routes(session, port)
    return [
        {
            "id": r.id,
            "name": r.name,
            "port": r.port,
            "waypoints": r.waypoints,
            "color_hex": r.color_hex,
            "description": r.description,
            "distance_km": r.distance_km,
        }
        for r in routes
    ]


@router.get("/{port}/config")
async def get_port_config(
    port: str,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    config = await port_config_service.get_port_config(session, port)
    if not config:
        raise HTTPException(status_code=404, detail="Port config not found")
    return {
        "port_name": config.port_name,
        "display_name": config.display_name,
        "center_lat": config.center_lat,
        "center_lng": config.center_lng,
        "zoom_level": config.zoom_level,
        "operations_status": config.operations_status,
    }

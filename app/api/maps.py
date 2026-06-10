from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.map import BerthMapResponse, RouteResponse, ShipMapResponse
from app.services import map_service

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

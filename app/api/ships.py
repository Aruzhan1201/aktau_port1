from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker, get_current_user
from app.models.ship import ShipStatus
from app.models.user import User, UserRole
from app.schemas.ship import (
    LocationUpdateRequest,
    ShipCreate,
    ShipListResponse,
    ShipResponse,
    ShipUpdate,
)
from app.services import ship_service

router = APIRouter(prefix="/ship", tags=["Ships"])


@router.post("/create", response_model=ShipResponse, status_code=status.HTTP_201_CREATED)
async def create_ship(
    body: ShipCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.admin, UserRole.captain)),
):
    captain_id = body.captain_id
    if current_user.role == UserRole.captain:
        captain_id = current_user.id
    ship = await ship_service.create_ship(
        session=session,
        name=body.name,
        capacity=body.capacity,
        imo_number=body.imo_number,
        captain_id=captain_id,
    )
    return ship


@router.post("/update-location", response_model=ShipResponse)
async def update_location(
    body: LocationUpdateRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.captain, UserRole.admin)),
):
    ship = await ship_service.get_ship(session, body.ship_id)
    if not ship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ship not found")
    if current_user.role == UserRole.captain and ship.captain_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your ship")

    updated = await ship_service.update_ship_location(
        session=session,
        ship_id=body.ship_id,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    return updated


@router.get("/", response_model=ShipListResponse)
async def list_ships(
    status: ShipStatus | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    items, total = await ship_service.list_ships(
        session, status=status, skip=skip, limit=limit
    )
    return ShipListResponse(total=total, items=items)


@router.put("/{ship_id}", response_model=ShipResponse)
async def update_ship(
    ship_id: int,
    body: ShipUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin, UserRole.super_admin)),
):
    updated = await ship_service.update_ship(session, ship_id, body.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ship not found")
    return updated


@router.delete("/{ship_id}", response_model=ShipResponse)
async def delete_ship(
    ship_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin, UserRole.super_admin)),
):
    deleted = await ship_service.delete_ship(session, ship_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ship not found")
    return deleted


@router.get("/{ship_id}", response_model=ShipResponse)
async def get_ship(
    ship_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    ship = await ship_service.get_ship(session, ship_id)
    if not ship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ship not found")
    return ship

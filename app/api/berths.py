from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker, get_current_user
from app.models.berth import BerthStatus
from app.models.user import User, UserRole
from app.schemas.berth import (
    BerthCreate,
    BerthListResponse,
    BerthReserveRequest,
    BerthResponse,
    ReservationResponse,
)
from app.services import berth_service, berth_reservation_service

router = APIRouter(prefix="/berth", tags=["Berths"])


@router.post("/create", response_model=BerthResponse, status_code=status.HTTP_201_CREATED)
async def create_berth(
    body: BerthCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin)),
):
    berth = await berth_service.create_berth(
        session=session,
        name=body.name,
        capacity=body.capacity,
        manager_id=body.manager_id,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    return berth


@router.post("/reserve", response_model=ReservationResponse)
async def reserve_berth(
    body: BerthReserveRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin)),
):
    try:
        reservation = await berth_service.reserve_berth(
            session=session,
            berth_id=body.berth_id,
            ship_id=body.ship_id,
            arrival_time=body.arrival_time,
            departure_time=body.departure_time,
            reserved_by=current_user.id,
        )
        return reservation
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=BerthListResponse)
async def list_berths(
    status: BerthStatus | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    items, total = await berth_service.list_berths(
        session, status=status, skip=skip, limit=limit
    )
    return BerthListResponse(total=total, items=items)


@router.get("/{berth_id}", response_model=BerthResponse)
async def get_berth(
    berth_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    berth = await berth_service.get_berth(session, berth_id)
    if not berth:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Berth not found")
    return berth


@router.get("/{berth_id}/reservations")
async def get_berth_reservations(
    berth_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin)),
):
    items, total = await berth_reservation_service.get_berth_reservations(
        session, berth_id=berth_id, skip=skip, limit=limit
    )
    return {"total": total, "items": items}

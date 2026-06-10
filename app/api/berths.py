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
    BerthUpdate,
    ReservationResponse,
    ReservationUpdate,
)
from app.services import berth_service, berth_reservation_service

router = APIRouter(prefix="/berth", tags=["Berths"])


@router.post("/create", response_model=BerthResponse, status_code=status.HTTP_201_CREATED)
async def create_berth(
    body: BerthCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin)),
):
    try:
        berth = await berth_service.create_berth(
            session=session,
            name=body.name,
            capacity=body.capacity,
            manager_id=body.manager_id,
            latitude=body.latitude,
            longitude=body.longitude,
        )
        return berth
    except Exception as e:
        if "unique" in str(e).lower() or "IntegrityError" in str(e):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Berth name already exists")
        raise


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


@router.put("/{berth_id}", response_model=BerthResponse)
async def update_berth(
    berth_id: int,
    body: BerthUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin)),
):
    updated = await berth_service.update_berth(session, berth_id, body.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Berth not found")
    return updated


@router.delete("/{berth_id}", response_model=BerthResponse)
async def delete_berth(
    berth_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin)),
):
    deleted = await berth_service.delete_berth(session, berth_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Berth not found")
    return deleted


@router.get("/reservation/{reservation_id}")
async def get_reservation(
    reservation_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin)),
):
    reservation = await berth_reservation_service.get_reservation(session, reservation_id)
    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    return reservation


@router.put("/reservation/{reservation_id}")
async def update_reservation(
    reservation_id: int,
    body: ReservationUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin)),
):
    try:
        updated = await berth_reservation_service.update_reservation(
            session, reservation_id, body.model_dump(exclude_unset=True)
        )
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/reservation/{reservation_id}")
async def delete_reservation(
    reservation_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin)),
):
    deleted = await berth_reservation_service.cancel_reservation(session, reservation_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    return deleted


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

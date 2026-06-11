from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker, get_current_user
from app.models.parking_zone import ParkingZoneStatus
from app.models.parking_spot import ParkingSpotStatus
from app.models.user import User, UserRole
from app.schemas.parking import (
    ParkingZoneCreate,
    ParkingZoneUpdate,
    ParkingZoneResponse,
    ParkingZoneListResponse,
    ParkingSpotCreate,
    ParkingSpotUpdate,
    ParkingSpotAssign,
    ParkingSpotResponse,
    ParkingSpotListResponse,
)
from app.services import parking_service

router = APIRouter(prefix="/parking", tags=["Parking"])


@router.post("/zones", response_model=ParkingZoneResponse, status_code=status.HTTP_201_CREATED)
async def create_parking_zone(
    body: ParkingZoneCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin, UserRole.super_admin)),
):
    try:
        zone = await parking_service.create_zone(
            session=session,
            name=body.name,
            port=body.port,
            capacity=body.capacity,
            manager_id=body.manager_id or current_user.id,
            latitude=body.latitude,
            longitude=body.longitude,
        )
        return zone
    except Exception as e:
        if "unique" in str(e).lower() or "IntegrityError" in str(e):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Zone name already exists")
        raise


@router.get("/zones", response_model=ParkingZoneListResponse)
async def list_parking_zones(
    port: str | None = Query(None),
    status: ParkingZoneStatus | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    items, total = await parking_service.list_zones(session, port=port, status=status, skip=skip, limit=limit)
    return ParkingZoneListResponse(total=total, items=items)


@router.get("/zones/{zone_id}", response_model=ParkingZoneResponse)
async def get_parking_zone(
    zone_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    zone = await parking_service.get_zone(session, zone_id)
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking zone not found")
    return zone


@router.put("/zones/{zone_id}", response_model=ParkingZoneResponse)
async def update_parking_zone(
    zone_id: int,
    body: ParkingZoneUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin, UserRole.super_admin)),
):
    updated = await parking_service.update_zone(session, zone_id, body.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking zone not found")
    return updated


@router.delete("/zones/{zone_id}")
async def delete_parking_zone(
    zone_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin, UserRole.super_admin)),
):
    deleted = await parking_service.delete_zone(session, zone_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking zone not found")
    return {"message": "Parking zone deleted"}


@router.get("/spots", response_model=ParkingSpotListResponse)
async def list_parking_spots(
    zone_id: int | None = Query(None),
    status: ParkingSpotStatus | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    items, total = await parking_service.list_spots(session, zone_id=zone_id, status=status, skip=skip, limit=limit)
    return ParkingSpotListResponse(total=total, items=items)


@router.get("/spots/{spot_id}", response_model=ParkingSpotResponse)
async def get_parking_spot(
    spot_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    spot = await parking_service.get_spot(session, spot_id)
    if not spot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking spot not found")
    return spot


@router.post("/spots/{spot_id}/assign", response_model=ParkingSpotResponse)
async def assign_parking_spot(
    spot_id: int,
    body: ParkingSpotAssign,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.driver, UserRole.admin, UserRole.super_admin)),
):
    try:
        driver_id = body.driver_id or current_user.id if current_user.role == UserRole.driver else body.driver_id
        spot = await parking_service.assign_spot(
            session=session,
            spot_id=spot_id,
            driver_id=driver_id,
            tariff_per_hour=body.tariff_per_hour,
        )
        if not spot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking spot not found")
        return spot
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/spots/{spot_id}/release", response_model=ParkingSpotResponse)
async def release_parking_spot(
    spot_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.driver, UserRole.admin, UserRole.super_admin)),
):
    spot = await parking_service.release_spot(session, spot_id)
    if not spot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking spot not found")
    return spot

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker, get_current_user
from app.models.cargo import CargoStatus
from app.models.user import User, UserRole
from app.schemas.cargo import (
    AssignShipRequest,
    CargoCreate,
    CargoListResponse,
    CargoResponse,
    CargoStatusUpdate,
)
from app.services import cargo_service

router = APIRouter(prefix="/cargo", tags=["Cargoes"])


@router.post("/create", response_model=CargoResponse, status_code=status.HTTP_201_CREATED)
async def create_cargo(
    body: CargoCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.client, UserRole.admin)),
):
    cargo = await cargo_service.create_cargo(
        session=session,
        client_id=current_user.id,
        company_id=current_user.company_id,
        cargo_type=body.cargo_type,
        weight=body.weight,
        origin=body.origin,
        destination=body.destination,
        eta=body.eta,
    )
    return cargo


@router.get("/{cargo_id}", response_model=CargoResponse)
async def get_cargo(
    cargo_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    cargo = await cargo_service.get_cargo(session, cargo_id)
    if not cargo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")
    if current_user.role == UserRole.client and cargo.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your cargo")
    return cargo


@router.get("/", response_model=CargoListResponse)
async def list_cargoes(
    status: CargoStatus | None = Query(None),
    ship_id: int | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    client_id = current_user.id if current_user.role == UserRole.client else None
    if current_user.role == UserRole.admin:
        client_id = None
    items, total = await cargo_service.list_cargoes(
        session, client_id=client_id, status=status, ship_id=ship_id, skip=skip, limit=limit
    )
    return CargoListResponse(total=total, items=items)


@router.patch("/{cargo_id}/status", response_model=CargoResponse)
async def update_cargo_status(
    cargo_id: int,
    body: CargoStatusUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.captain, UserRole.admin)),
):
    cargo = await cargo_service.update_cargo_status(
        session=session,
        cargo_id=cargo_id,
        new_status=body.status,
        changed_by=current_user.id,
        notes=body.notes,
    )
    if not cargo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")
    return cargo


@router.post("/assign-ship", response_model=CargoResponse)
async def assign_ship(
    body: AssignShipRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin)),
):
    try:
        cargo = await cargo_service.assign_ship_to_cargo(
            session=session,
            cargo_id=body.cargo_id,
            ship_id=body.ship_id,
            changed_by=current_user.id,
        )
        if not cargo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")
        return cargo
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

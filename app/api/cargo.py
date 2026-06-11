from datetime import datetime, timezone

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
    CargoUpdate,
)
from app.services import cargo_service
from app.websocket.manager import manager

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
        sender_name=body.sender_name,
        sender_phone=body.sender_phone,
        receiver_name=body.receiver_name,
        receiver_phone=body.receiver_phone,
        route_waypoints=body.route_waypoints,
        vehicle_type=body.vehicle_type.value if body.vehicle_type else None,
        budget=body.budget,
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
    driver_id: int | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    client_id = current_user.id if current_user.role == UserRole.client else None
    if current_user.role == UserRole.admin:
        client_id = None
    items, total = await cargo_service.list_cargoes(
        session, client_id=client_id, driver_id=driver_id, status=status, ship_id=ship_id, skip=skip, limit=limit
    )
    return CargoListResponse(total=total, items=items)


@router.patch("/{cargo_id}/status", response_model=CargoResponse)
async def update_cargo_status(
    cargo_id: int,
    body: CargoStatusUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.captain, UserRole.admin)),
):
    try:
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
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{cargo_id}", response_model=CargoResponse)
async def update_cargo(
    cargo_id: int,
    body: CargoUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.client, UserRole.admin)),
):
    if current_user.role == UserRole.client:
        cargo = await cargo_service.get_cargo(session, cargo_id)
        if not cargo or cargo.client_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")
    updated = await cargo_service.update_cargo(session, cargo_id, body.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")
    if current_user.role == UserRole.client and updated.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your cargo")
    return updated


@router.delete("/{cargo_id}", response_model=CargoResponse)
async def delete_cargo(
    cargo_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.client, UserRole.admin)),
):
    if current_user.role == UserRole.client:
        cargo = await cargo_service.get_cargo(session, cargo_id)
        if not cargo or cargo.client_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")
    deleted = await cargo_service.delete_cargo(session, cargo_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")
    return deleted


@router.post("/assign-ship", response_model=CargoResponse)
async def assign_ship(
    body: AssignShipRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.captain, UserRole.parking_manager, UserRole.admin)),
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


@router.patch("/{cargo_id}/approve-captain")
async def approve_captain(
    cargo_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.captain, UserRole.admin, UserRole.super_admin)),
):
    cargo = await cargo_service.get_cargo(session, cargo_id)
    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo not found")
    cargo.captain_approved = True
    await session.commit()
    await session.refresh(cargo)
    phone_revealed = False
    if cargo.captain_approved and cargo.client_approved and not cargo.phone_revealed_at:
        cargo.phone_revealed_at = datetime.now(timezone.utc)
        await session.commit()
        phone_revealed = True
    await manager.broadcast_cargo_update(cargo_id, {
        "type": "cargo_update",
        "cargo_id": cargo_id,
        "captain_approved": True,
        "client_approved": cargo.client_approved,
        "phone_revealed": phone_revealed,
    })
    return {"message": "Captain approved", "captain_approved": True, "client_approved": cargo.client_approved}


@router.patch("/{cargo_id}/approve-client")
async def approve_client(
    cargo_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.client, UserRole.admin, UserRole.super_admin)),
):
    cargo = await cargo_service.get_cargo(session, cargo_id)
    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo not found")
    cargo.client_approved = True
    await session.commit()
    await session.refresh(cargo)
    phone_revealed = False
    if cargo.captain_approved and cargo.client_approved and not cargo.phone_revealed_at:
        cargo.phone_revealed_at = datetime.now(timezone.utc)
        await session.commit()
        phone_revealed = True
    await manager.broadcast_cargo_update(cargo_id, {
        "type": "cargo_update",
        "cargo_id": cargo_id,
        "captain_approved": cargo.captain_approved,
        "client_approved": True,
        "phone_revealed": phone_revealed,
    })
    return {"message": "Client approved", "client_approved": True, "captain_approved": cargo.captain_approved}


@router.post("/{cargo_id}/reveal-phone")
async def reveal_phone(
    cargo_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    cargo = await cargo_service.get_cargo(session, cargo_id)
    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo not found")
    if not cargo.captain_approved or not cargo.client_approved:
        raise HTTPException(status_code=400, detail="Both parties must approve before phone reveal")
    return {
        "sender_phone": cargo.sender_phone or cargo.client.phone if cargo.client else None,
        "receiver_phone": cargo.receiver_phone,
        "driver_phone": cargo.driver.phone if cargo.driver else None,
        "revealed_at": cargo.phone_revealed_at.isoformat() if cargo.phone_revealed_at else None,
    }

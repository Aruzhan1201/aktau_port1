from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker
from app.models.user import User, UserRole
from app.services import ro_ro_service

router = APIRouter(prefix="/ro-ro", tags=["Ro-Ro"])


class RoRoEntry(BaseModel):
    plate_number: str
    driver_name: str
    driver_phone: str | None = None
    vehicle_type: str = "car"
    port: str = "aktau"
    cargo_id: int | None = None


class RoRoStatusUpdate(BaseModel):
    status: str


@router.post("/entry")
async def register_entry(
    body: RoRoEntry,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin, UserRole.super_admin)),
):
    vehicle = await ro_ro_service.register_entry(
        session, body.plate_number, body.driver_name, body.driver_phone,
        body.vehicle_type, body.port, body.cargo_id, user.id,
    )
    return {"id": vehicle.id, "plate_number": vehicle.plate_number, "message": "Entry registered"}


@router.post("/{vehicle_id}/status")
async def update_status(
    vehicle_id: int,
    body: RoRoStatusUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin, UserRole.super_admin)),
):
    vehicle = await ro_ro_service.update_status(session, vehicle_id, body.status, user.id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": f"Status updated to {body.status}"}


@router.post("/{vehicle_id}/exit")
async def register_exit(
    vehicle_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin, UserRole.super_admin)),
):
    vehicle = await ro_ro_service.register_exit(session, vehicle_id, user.id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Exit registered", "exit_time": vehicle.exit_time.isoformat() if vehicle.exit_time else None}


@router.get("/")
async def list_vehicles(
    port: str | None = Query(None),
    status: str | None = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin, UserRole.super_admin)),
):
    return await ro_ro_service.get_vehicles(session, port, status, skip, limit)


@router.get("/kpis")
async def get_kpis(
    port: str | None = Query(None),
    days: int = Query(7),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin, UserRole.super_admin, UserRole.governance)),
):
    return await ro_ro_service.get_kpis(session, port, days)


@router.get("/analytics")
async def get_analytics(
    port: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin, UserRole.super_admin)),
):
    return await ro_ro_service.get_analytics(session, port)

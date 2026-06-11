from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker
from app.models.user import User, UserRole
from app.services import tariff_service

router = APIRouter(prefix="/tariffs", tags=["Tariffs"])

from app.core.deps import get_current_user as _get_current_user


async def get_current_user_for_tariffs(
    user: User = Depends(_get_current_user),
) -> User:
    return user


class TariffCreate(BaseModel):
    port: str
    name: str
    service_type: str
    price: float
    unit: str = "per_hour"
    currency: str = "USD"
    valid_from: datetime | None = None
    valid_to: datetime | None = None


class TariffUpdate(BaseModel):
    name: str | None = None
    price: float | None = None
    unit: str | None = None
    currency: str | None = None
    valid_from: datetime | None = None
    valid_to: datetime | None = None


@router.post("/")
async def create_tariff(
    body: TariffCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.super_admin)),
):
    tariff = await tariff_service.create_tariff(
        session, body.port, body.name, body.service_type,
        body.price, body.unit, body.currency, body.valid_from, body.valid_to,
    )
    return {"id": tariff.id, "message": "Tariff created"}


@router.get("/")
async def list_tariffs(
    port: str | None = Query(None),
    service_type: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user_for_tariffs),
):
    return await tariff_service.get_tariffs(session, port, service_type)


@router.get("/active")
async def get_active_tariffs(
    port: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user_for_tariffs),
):
    return await tariff_service.get_active_tariffs(session, port)


@router.get("/calculate")
async def calculate_cost(
    port: str = Query(...),
    service_type: str = Query(...),
    units: float = Query(1.0),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user_for_tariffs),
):
    return await tariff_service.calculate_cost(session, port, service_type, units)


@router.put("/{tariff_id}")
async def update_tariff(
    tariff_id: int,
    body: TariffUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.super_admin)),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    tariff = await tariff_service.update_tariff(session, tariff_id, updates)
    if not tariff:
        raise HTTPException(status_code=404, detail="Tariff not found")
    return {"message": "Tariff updated"}


@router.delete("/{tariff_id}")
async def delete_tariff(
    tariff_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.super_admin)),
):
    deleted = await tariff_service.delete_tariff(session, tariff_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Tariff not found")
    return {"message": "Tariff deleted"}

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.user import User
from app.services import weather_service

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/{port}")
async def get_weather(
    port: str,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    return await weather_service.get_current_weather(session, port)


@router.get("/{port}/forecast")
async def get_forecast(
    port: str,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    return await weather_service.get_forecast(session, port)


@router.get("/alerts/all")
async def get_alerts(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    return await weather_service.get_alerts(session)

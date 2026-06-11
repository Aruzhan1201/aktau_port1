from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker
from app.models.user import User, UserRole
from app.services import gov_analytics_service

router = APIRouter(prefix="/analytics/gov", tags=["Government Analytics"])


@router.get("/dashboard")
async def get_gov_dashboard(
    port: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.governance, UserRole.admin, UserRole.super_admin)),
):
    return await gov_analytics_service.get_gov_dashboard(session, port)


@router.get("/throughput")
async def get_throughput_trend(
    port: str | None = Query(None),
    days: int = Query(30),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.governance, UserRole.admin, UserRole.super_admin)),
):
    return await gov_analytics_service.get_throughput_trend(session, port, days)


@router.get("/delays")
async def get_delay_analytics(
    days: int = Query(30),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.governance, UserRole.admin, UserRole.super_admin)),
):
    return await gov_analytics_service.get_delay_analytics(session, days)

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker
from app.models.user import User, UserRole
from app.schemas.analytics import DashboardResponse, RevenueReport, ShipUtilizationReport, WaitingTimeReport
from app.services import analytics_service, payment_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin, UserRole.super_admin, UserRole.governance, UserRole.port_manager, UserRole.parking_manager)),
):
    return await analytics_service.get_dashboard(session)


@router.get("/revenue", response_model=RevenueReport)
async def get_revenue_report(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin)),
):
    revenue = await payment_service.get_revenue(session)
    return RevenueReport(
        total_income=revenue["total_income"],
        cargo_fees=revenue["cargo_fees"],
        berth_fees=revenue["berth_fees"],
        penalties=revenue["penalties"],
    )


@router.get("/waiting-times", response_model=WaitingTimeReport)
async def get_waiting_times(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin)),
):
    return await analytics_service.get_waiting_times(session)


@router.get("/ship-utilization", response_model=ShipUtilizationReport)
async def get_ship_utilization(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin)),
):
    return await analytics_service.get_ship_utilization(session)

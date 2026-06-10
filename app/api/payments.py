from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker
from app.models.payment import PaymentType
from app.models.user import User, UserRole
from app.schemas.payment import PaymentCreate, PaymentResponse, RevenueResponse
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    body: PaymentCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin)),
):
    payment = await payment_service.create_payment(
        session=session,
        payment_type=body.type,
        amount=body.amount,
        currency=body.currency,
        cargo_id=body.cargo_id,
        reservation_id=body.reservation_id,
        paid_by=body.paid_by,
    )
    return payment


@router.get("/", response_model=list[PaymentResponse])
async def list_payments(
    type: PaymentType | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin)),
):
    items, total = await payment_service.list_payments(
        session, payment_type=type, skip=skip, limit=limit
    )
    return items


@router.get("/revenue", response_model=RevenueResponse)
async def get_revenue(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin)),
):
    return await payment_service.get_revenue(session)

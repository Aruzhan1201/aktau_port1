from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker, get_current_user
from app.models.cargo import Cargo
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
        bank_name=body.bank_name,
        bank_account=body.bank_account,
        payment_method=body.payment_method,
        reference_number=body.reference_number,
    )
    return payment


@router.get("/", response_model=list[PaymentResponse])
async def list_payments(
    type: PaymentType | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role in (UserRole.admin, UserRole.super_admin, UserRole.governance, UserRole.port_manager, UserRole.parking_manager):
        items, total = await payment_service.list_payments(
            session, payment_type=type, skip=skip, limit=limit
        )
    else:
        result = await session.execute(
            select(Cargo.id).where(
                (Cargo.client_id == current_user.id)
                | (Cargo.driver_id == current_user.id)
                | (Cargo.sender_id == current_user.id)
                | (Cargo.receiver_id == current_user.id)
            )
        )
        user_cargo_ids = [row[0] for row in result.all()]
        items, total = await payment_service.list_payments(
            session,
            payment_type=type,
            paid_by=current_user.id,
            cargo_ids=user_cargo_ids if user_cargo_ids else None,
            skip=skip,
            limit=limit,
        )
    return items


@router.post("/{payment_id}/pay", response_model=PaymentResponse)
async def mark_payment_paid(
    payment_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin)),
):
    payment = await payment_service.mark_payment_paid(session, payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return payment


@router.get("/revenue", response_model=RevenueResponse)
async def get_revenue(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin, UserRole.super_admin, UserRole.governance, UserRole.port_manager, UserRole.parking_manager)),
):
    return await payment_service.get_revenue(session)

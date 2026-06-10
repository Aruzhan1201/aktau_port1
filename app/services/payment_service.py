from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment, PaymentStatus, PaymentType


async def create_payment(
    session: AsyncSession,
    payment_type: PaymentType,
    amount: float,
    currency: str = "USD",
    cargo_id: int | None = None,
    reservation_id: int | None = None,
    paid_by: int | None = None,
) -> Payment:
    payment = Payment(
        type=payment_type,
        amount=amount,
        currency=currency,
        cargo_id=cargo_id,
        reservation_id=reservation_id,
        paid_by=paid_by,
        status=PaymentStatus.pending,
    )
    session.add(payment)
    await session.flush()
    return payment


async def get_payment(session: AsyncSession, payment_id: int) -> Payment | None:
    result = await session.execute(select(Payment).where(Payment.id == payment_id))
    return result.scalar_one_or_none()


async def list_payments(
    session: AsyncSession,
    payment_type: PaymentType | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Payment], int]:
    query = select(Payment)
    count_query = select(func.count(Payment.id))
    if payment_type:
        query = query.where(Payment.type == payment_type)
        count_query = count_query.where(Payment.type == payment_type)
    total = (await session.execute(count_query)).scalar() or 0
    query = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all()), total


async def get_revenue(session: AsyncSession) -> dict:
    cargo_fees = await _sum_by_type(session, PaymentType.cargo_fee, PaymentStatus.paid)
    berth_fees = await _sum_by_type(session, PaymentType.berth_fee, PaymentStatus.paid)
    penalties = await _sum_by_type(session, PaymentType.penalty, PaymentStatus.paid)
    total_pending = await _sum_by_status(session, PaymentStatus.pending)
    total_paid = cargo_fees + berth_fees + penalties

    return {
        "total_income": total_paid,
        "cargo_fees": cargo_fees,
        "berth_fees": berth_fees,
        "penalties": penalties,
        "total_pending": total_pending,
        "total_paid": total_paid,
    }


async def _sum_by_type(
    session: AsyncSession, payment_type: PaymentType, status: PaymentStatus
) -> float:
    result = await session.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.type == payment_type, Payment.status == status
        )
    )
    return float(result.scalar() or 0)


async def _sum_by_status(session: AsyncSession, status: PaymentStatus) -> float:
    result = await session.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.status == status
        )
    )
    return float(result.scalar() or 0)

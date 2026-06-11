from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deal import Deal, DealStatus, DealType


async def create_deal(
    session: AsyncSession,
    type: DealType,
    client_id: int,
    driver_id: int | None = None,
    captain_id: int | None = None,
    cargo_id: int | None = None,
    proposed_price: float | None = None,
    currency: str = "USD",
    notes: str | None = None,
) -> Deal:
    client_approved = False
    if client_id == captain_id:
        client_approved = True
    deal = Deal(
        type=type,
        status=DealStatus.pending,
        client_id=client_id,
        driver_id=driver_id,
        captain_id=captain_id,
        cargo_id=cargo_id,
        proposed_price=proposed_price,
        currency=currency,
        notes=notes,
        client_approved=client_approved,
        client_status="approved" if client_approved else "pending",
    )
    session.add(deal)
    if client_approved and captain_id is not None and driver_id is None:
        await _check_both_approved(session, deal)
    await session.flush()
    return deal


async def get_deal(session: AsyncSession, deal_id: int) -> Deal | None:
    result = await session.execute(select(Deal).where(Deal.id == deal_id))
    return result.scalar_one_or_none()


async def list_deals(
    session: AsyncSession,
    client_id: int | None = None,
    driver_id: int | None = None,
    captain_id: int | None = None,
    status: DealStatus | None = None,
    type: DealType | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Deal], int]:
    query = select(Deal)
    count_query = select(func.count(Deal.id))

    if client_id is not None:
        query = query.where(Deal.client_id == client_id)
        count_query = count_query.where(Deal.client_id == client_id)
    if driver_id is not None:
        query = query.where(Deal.driver_id == driver_id)
        count_query = count_query.where(Deal.driver_id == driver_id)
    if captain_id is not None:
        query = query.where(Deal.captain_id == captain_id)
        count_query = count_query.where(Deal.captain_id == captain_id)
    if status:
        query = query.where(Deal.status == status)
        count_query = count_query.where(Deal.status == status)
    if type:
        query = query.where(Deal.type == type)
        count_query = count_query.where(Deal.type == type)

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Deal.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    items = list(result.scalars().all())
    return items, total


async def approve_by_client(session: AsyncSession, deal_id: int) -> Deal | None:
    deal = await get_deal(session, deal_id)
    if not deal:
        return None

    deal.client_approved = True
    deal.client_status = "approved"
    await _check_both_approved(session, deal)
    await session.flush()
    return deal


async def approve_by_driver(session: AsyncSession, deal_id: int) -> Deal | None:
    deal = await get_deal(session, deal_id)
    if not deal:
        return None

    deal.driver_approved = True
    deal.driver_status = "approved"
    await _check_both_approved(session, deal)
    await session.flush()
    return deal


async def approve_by_captain(session: AsyncSession, deal_id: int) -> Deal | None:
    deal = await get_deal(session, deal_id)
    if not deal:
        return None

    deal.captain_approved = True
    deal.captain_status = "approved"
    await _check_both_approved(session, deal)
    await session.flush()
    return deal


async def reject_by_client(session: AsyncSession, deal_id: int) -> Deal | None:
    deal = await get_deal(session, deal_id)
    if not deal:
        return None

    deal.client_status = "rejected"
    deal.status = DealStatus.cancelled
    await session.flush()
    return deal


async def reject_by_driver(session: AsyncSession, deal_id: int) -> Deal | None:
    deal = await get_deal(session, deal_id)
    if not deal:
        return None
    deal.driver_status = "rejected"
    deal.status = DealStatus.cancelled
    await session.flush()
    return deal


async def reject_by_captain(session: AsyncSession, deal_id: int) -> Deal | None:
    deal = await get_deal(session, deal_id)
    if not deal:
        return None
    deal.captain_status = "rejected"
    deal.status = DealStatus.cancelled
    await session.flush()
    return deal


async def _check_both_approved(session: AsyncSession, deal: Deal):
    if deal.driver_id is not None and deal.captain_id is not None:
        if deal.client_approved and deal.driver_approved and deal.captain_approved:
            deal.status = DealStatus.both_approved
            deal.phone_revealed_at = datetime.now(timezone.utc)
    elif deal.driver_id is not None:
        if deal.client_approved and deal.driver_approved:
            deal.status = DealStatus.both_approved
            deal.phone_revealed_at = datetime.now(timezone.utc)
    elif deal.captain_id is not None:
        if deal.client_approved and deal.captain_approved:
            deal.status = DealStatus.both_approved
            deal.phone_revealed_at = datetime.now(timezone.utc)


async def complete_deal(session: AsyncSession, deal_id: int) -> Deal | None:
    deal = await get_deal(session, deal_id)
    if not deal:
        return None
    if deal.status != DealStatus.both_approved:
        raise ValueError("Deal must be both_approved before completing")
    deal.status = DealStatus.completed
    await session.flush()
    return deal


async def cancel_deal(session: AsyncSession, deal_id: int) -> Deal | None:
    deal = await get_deal(session, deal_id)
    if not deal:
        return None
    if deal.status in (DealStatus.completed, DealStatus.cancelled):
        raise ValueError("Cannot cancel a completed or already cancelled deal")
    deal.status = DealStatus.cancelled
    await session.flush()
    return deal


async def update_deal(session: AsyncSession, deal_id: int, data: dict) -> Deal | None:
    deal = await get_deal(session, deal_id)
    if not deal:
        return None
    for key, value in data.items():
        if value is not None and hasattr(deal, key):
            setattr(deal, key, value)
    await session.flush()
    return deal

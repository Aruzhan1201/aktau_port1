from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cargo import Cargo, CargoStatus
from app.models.cargo_status_log import CargoStatusLog
from app.models.notification import Notification, NotificationType
from app.models.port_queue import PortQueue, QueueStatus
from app.models.ship import Ship, ShipStatus

from app.services.payment_service import are_cargo_payments_paid


async def create_cargo(
    session: AsyncSession,
    client_id: int,
    cargo_type: str,
    weight: float,
    origin: str,
    destination: str,
    eta: datetime | None = None,
    company_id: int | None = None,
    ai_generated: bool = False,
    ai_confidence: float | None = None,
    ai_raw_input: str | None = None,
) -> Cargo:
    cargo = Cargo(
        client_id=client_id,
        company_id=company_id,
        cargo_type=cargo_type,
        weight=weight,
        origin=origin,
        destination=destination,
        eta=eta,
        status=CargoStatus.created,
        ai_generated=ai_generated,
        ai_confidence=ai_confidence,
        ai_raw_input=ai_raw_input,
    )
    session.add(cargo)
    await session.flush()

    await _log_status(session, cargo.id, None, CargoStatus.created, client_id)
    return cargo


async def get_cargo(session: AsyncSession, cargo_id: int) -> Cargo | None:
    result = await session.execute(select(Cargo).where(Cargo.id == cargo_id))
    return result.scalar_one_or_none()


async def list_cargoes(
    session: AsyncSession,
    client_id: int | None = None,
    status: CargoStatus | None = None,
    ship_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Cargo], int]:
    query = select(Cargo)
    count_query = select(func.count(Cargo.id))
    if client_id is not None:
        query = query.where(Cargo.client_id == client_id)
        count_query = count_query.where(Cargo.client_id == client_id)
    if status is not None:
        query = query.where(Cargo.status == status)
        count_query = count_query.where(Cargo.status == status)
    if ship_id is not None:
        query = query.where(Cargo.ship_id == ship_id)
        count_query = count_query.where(Cargo.ship_id == ship_id)

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Cargo.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    items = list(result.scalars().all())
    return items, total


async def update_cargo(
    session: AsyncSession, cargo_id: int, data: dict
) -> Cargo | None:
    cargo = await get_cargo(session, cargo_id)
    if not cargo:
        return None
    for key, value in data.items():
        if value is not None and hasattr(cargo, key):
            setattr(cargo, key, value)
    cargo.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return cargo


async def delete_cargo(session: AsyncSession, cargo_id: int, changed_by: int) -> Cargo | None:
    cargo = await get_cargo(session, cargo_id)
    if not cargo:
        return None
    old_status = cargo.status
    cargo.status = CargoStatus.cancelled
    cargo.updated_at = datetime.now(timezone.utc)
    await _log_status(session, cargo_id, old_status, CargoStatus.cancelled, changed_by, "Cancelled")
    return cargo


def _calculate_priority(eta: datetime | None, cargo_type: str) -> float:
    score = 1.0
    if eta:
        hours_until_deadline = (eta - datetime.now(timezone.utc)).total_seconds() / 3600
        if hours_until_deadline < 48:
            score += 0.5
    perishable_types = ["food", "grain", "produce", "seafood", "meat", "dairy"]
    if cargo_type.lower() in perishable_types:
        score += 0.3
    return score


async def update_cargo_status(
    session: AsyncSession,
    cargo_id: int,
    new_status: CargoStatus,
    changed_by: int,
    notes: str | None = None,
) -> Cargo | None:
    cargo = await get_cargo(session, cargo_id)
    if not cargo:
        return None

    payment_blocked_statuses = {CargoStatus.arrived, CargoStatus.delivered}
    if new_status in payment_blocked_statuses:
        if not await are_cargo_payments_paid(session, cargo_id):
            raise ValueError("Cannot proceed: cargo payments are not all paid")

    old_status = cargo.status
    cargo.status = new_status
    cargo.updated_at = datetime.now(timezone.utc)

    await _log_status(session, cargo_id, old_status, new_status, changed_by, notes)
    await _handle_status_side_effects(session, cargo, old_status, new_status, changed_by)
    return cargo


async def _log_status(
    session: AsyncSession,
    cargo_id: int,
    from_status: CargoStatus | None,
    to_status: CargoStatus,
    changed_by: int,
    notes: str | None = None,
):
    log = CargoStatusLog(
        cargo_id=cargo_id,
        from_status=from_status,
        to_status=to_status,
        changed_by=changed_by,
        notes=notes,
    )
    session.add(log)


async def _handle_status_side_effects(
    session: AsyncSession,
    cargo: Cargo,
    old_status: CargoStatus | None,
    new_status: CargoStatus,
    changed_by: int,
):
    if new_status == CargoStatus.approved and not cargo.ship_id:
        priority = _calculate_priority(cargo.eta, cargo.cargo_type)
        queue_entry = PortQueue(
            cargo_id=cargo.id,
            priority_score=priority,
            status=QueueStatus.waiting,
        )
        session.add(queue_entry)
        cargo.priority_score = priority

    notification_map = {
        CargoStatus.approved: ("Cargo Approved", f"Your cargo #{cargo.id} has been approved."),
        CargoStatus.assigned: (
            "Cargo Assigned",
            f"Cargo #{cargo.id} assigned to ship #{cargo.ship_id}.",
        ),
        CargoStatus.arrived: (
            "Cargo Arrived",
            f"Cargo #{cargo.id} has arrived at {cargo.destination}.",
        ),
        CargoStatus.delivered: (
            "Cargo Delivered",
            f"Cargo #{cargo.id} has been delivered.",
        ),
    }
    if new_status in notification_map:
        title, msg = notification_map[new_status]
        notif = Notification(
            user_id=cargo.client_id,
            title=title,
            message=msg,
            type=NotificationType.cargo_update,
            related_entity_type="cargo",
            related_entity_id=cargo.id,
        )
        session.add(notif)


async def assign_ship_to_cargo(
    session: AsyncSession,
    cargo_id: int,
    ship_id: int,
    changed_by: int,
) -> Cargo | None:
    cargo = await get_cargo(session, cargo_id)
    if not cargo:
        return None
    ship_result = await session.execute(select(Ship).where(Ship.id == ship_id))
    ship = ship_result.scalar_one_or_none()
    if not ship:
        raise ValueError("Ship not found")
    if ship.status != ShipStatus.available:
        raise ValueError("Ship is not available")

    if not await are_cargo_payments_paid(session, cargo_id):
        raise ValueError("Cannot assign ship: cargo payments are not all paid")

    cargo.ship_id = ship_id
    ship.status = ShipStatus.berthed
    await update_cargo_status(session, cargo_id, CargoStatus.assigned, changed_by)
    return cargo

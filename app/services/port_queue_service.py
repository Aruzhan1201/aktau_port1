from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cargo import Cargo
from app.models.port_queue import PortQueue, QueueStatus


async def get_queue(
    session: AsyncSession,
    status: QueueStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[dict], int, int]:
    query = (
        select(
            PortQueue,
            Cargo.cargo_type,
            Cargo.weight,
            Cargo.destination,
        )
        .join(Cargo, PortQueue.cargo_id == Cargo.id)
    )
    count_all = select(func.count(PortQueue.id))
    count_waiting = select(func.count(PortQueue.id)).where(
        PortQueue.status == QueueStatus.waiting
    )

    if status:
        query = query.where(PortQueue.status == status)

    total = (await session.execute(count_all)).scalar() or 0
    waiting = (await session.execute(count_waiting)).scalar() or 0

    query = (
        query.order_by(PortQueue.priority_score.desc(), PortQueue.entered_at.asc())
        .offset(skip)
        .limit(limit)
    )
    result = await session.execute(query)
    rows = result.all()

    items = []
    for row in rows:
        q = row[0]
        items.append(
            {
                "id": q.id,
                "cargo_id": q.cargo_id,
                "ship_id": q.ship_id,
                "priority_score": q.priority_score,
                "status": q.status.value,
                "entered_at": q.entered_at.isoformat(),
                "assigned_at": q.assigned_at.isoformat() if q.assigned_at else None,
                "completed_at": q.completed_at.isoformat() if q.completed_at else None,
                "cargo_type": row.cargo_type,
                "weight": row.weight,
                "destination": row.destination,
            }
        )
    return items, total, waiting


async def process_next(session: AsyncSession) -> dict | None:
    result = await session.execute(
        select(PortQueue)
        .where(PortQueue.status == QueueStatus.waiting)
        .order_by(PortQueue.priority_score.desc(), PortQueue.entered_at.asc())
        .limit(1)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        return None

    entry.status = QueueStatus.assigned
    entry.assigned_at = datetime.now(timezone.utc)

    cargo_result = await session.execute(
        select(Cargo).where(Cargo.id == entry.cargo_id)
    )
    cargo = cargo_result.scalar_one_or_none()

    return {
        "queue_id": entry.id,
        "cargo_id": entry.cargo_id,
        "priority_score": entry.priority_score,
        "cargo_type": cargo.cargo_type if cargo else None,
        "weight": cargo.weight if cargo else None,
        "destination": cargo.destination if cargo else None,
    }


async def enqueue_cargo(
    session: AsyncSession,
    cargo_id: int,
    priority_score: float = 1.0,
) -> PortQueue:
    entry = PortQueue(
        cargo_id=cargo_id,
        priority_score=priority_score,
        status=QueueStatus.waiting,
    )
    session.add(entry)
    await session.flush()
    return entry


async def calculate_average_waiting_time(session: AsyncSession) -> float:
    result = await session.execute(
        select(
            func.avg(
                func.extract("epoch", PortQueue.assigned_at - PortQueue.entered_at) / 3600
            )
        ).where(
            PortQueue.status.in_([QueueStatus.assigned, QueueStatus.completed]),
            PortQueue.assigned_at.isnot(None),
        )
    )
    avg = result.scalar()
    return round(avg, 2) if avg else 0.0

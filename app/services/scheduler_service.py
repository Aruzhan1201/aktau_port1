import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session_factory
from app.models.berth import Berth, BerthStatus
from app.models.berth_reservation import BerthReservation, ReservationStatus

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def release_expired_reservations():
    try:
        async with async_session_factory() as session:
            result = await session.execute(
                select(BerthReservation).where(
                    BerthReservation.status == ReservationStatus.active,
                )
            )
            reservations = list(result.scalars().all())
            now = datetime.now(timezone.utc)
            released = 0
            for res in reservations:
                expired = res.departure_time is not None and res.departure_time <= now
                no_show = (
                    res.departure_time is None
                    and res.arrival_time <= now
                )
                if expired or no_show:
                    res.status = ReservationStatus.completed
                    berth = await session.get(Berth, res.berth_id)
                    if berth:
                        berth.status = BerthStatus.free
                    released += 1
            await session.commit()
            if released:
                logger.info("Released %d expired reservations", released)
    except Exception as e:
        logger.error("Failed to release expired reservations: %s", e)


def start_scheduler():
    scheduler.add_job(
        release_expired_reservations,
        "interval",
        seconds=settings.SCHEDULER_INTERVAL_SECONDS,
        id="release_expired_reservations",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "Scheduler started (interval=%ds)", settings.SCHEDULER_INTERVAL_SECONDS
    )


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType


async def create_notification(
    session: AsyncSession,
    user_id: int,
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.system,
    related_entity_type: str | None = None,
    related_entity_id: int | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
    )
    session.add(notif)
    await session.flush()
    return notif


async def get_user_notifications(
    session: AsyncSession,
    user_id: int,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Notification], int, int]:
    query = select(Notification).where(Notification.user_id == user_id)
    count_query = select(func.count(Notification.id)).where(
        Notification.user_id == user_id
    )
    unread_query = select(func.count(Notification.id)).where(
        Notification.user_id == user_id, Notification.is_read == False
    )

    if unread_only:
        query = query.where(Notification.is_read == False)

    total = (await session.execute(count_query)).scalar() or 0
    unread = (await session.execute(unread_query)).scalar() or 0

    query = (
        query.order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await session.execute(query)
    items = list(result.scalars().all())
    return items, total, unread


async def mark_notification_read(
    session: AsyncSession, notification_id: int, user_id: int
) -> Notification | None:
    result = await session.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    )
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
        await session.flush()
    return notif

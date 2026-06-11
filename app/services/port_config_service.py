from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.port_config import PortConfig
from app.models.transit_route import TransitRoute
from app.models.berth import Berth


async def get_port_config(session: AsyncSession, port_name: str) -> PortConfig | None:
    result = await session.execute(
        select(PortConfig).where(PortConfig.port_name == port_name)
    )
    return result.scalar_one_or_none()


async def update_port_config(
    session: AsyncSession,
    port_name: str,
    updates: dict[str, Any],
) -> PortConfig | None:
    result = await session.execute(
        select(PortConfig).where(PortConfig.port_name == port_name)
    )
    config = result.scalar_one_or_none()
    if not config:
        return None
    for key, value in updates.items():
        if hasattr(config, key) and key != "id":
            setattr(config, key, value)
    await session.commit()
    await session.refresh(config)
    return config


async def get_transit_routes(session: AsyncSession, port_name: str) -> list[TransitRoute]:
    result = await session.execute(
        select(TransitRoute).where(TransitRoute.port == port_name)
    )
    return list(result.scalars().all())


async def get_berth_layout(session: AsyncSession, port_name: str) -> list[dict]:
    # Berths are associated with a port via their location_coords proximity
    result = await session.execute(select(Berth))
    berths = result.scalars().all()

    # Load port config for center coordinates
    config = await get_port_config(session, port_name)
    if not config:
        return []

    # Filter berths by proximity to port center
    lat_span = 0.05
    lng_span = 0.05
    nearby = []
    for b in berths:
        if b.location_coords:
            bl = b.location_coords.get("lat", 0)
            bn = b.location_coords.get("lng", 0)
            if abs(bl - config.center_lat) < lat_span and abs(bn - config.center_lng) < lng_span:
                nearby.append({
                    "berth_id": b.id,
                    "name": b.name,
                    "latitude": bl,
                    "longitude": bn,
                    "status": b.status.value if hasattr(b.status, "value") else b.status,
                    "capacity": b.capacity,
                })
    return nearby

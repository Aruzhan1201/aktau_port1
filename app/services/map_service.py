from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.berth import Berth
from app.models.cargo import Cargo
from app.models.ship import Ship


async def get_ship_coordinates(session: AsyncSession) -> list[dict]:
    result = await session.execute(
        select(Ship).where(Ship.current_location.isnot(None))
    )
    ships = result.scalars().all()
    return [
        {
            "ship_id": s.id,
            "name": s.name,
            "latitude": s.current_location.get("lat"),
            "longitude": s.current_location.get("lng"),
            "status": s.status.value,
            "capacity": s.capacity,
        }
        for s in ships
        if s.current_location
    ]


async def get_berth_coordinates(session: AsyncSession) -> list[dict]:
    result = await session.execute(
        select(Berth).where(Berth.location_coords.isnot(None))
    )
    berths = result.scalars().all()

    items = []
    for b in berths:
        entry = {
            "berth_id": b.id,
            "name": b.name,
            "latitude": b.location_coords.get("lat"),
            "longitude": b.location_coords.get("lng"),
            "status": b.status.value,
            "capacity": b.capacity,
            "current_ship_name": None,
        }
        items.append(entry)
    return items


async def get_cargo_route(
    session: AsyncSession, cargo_id: int
) -> dict | None:
    result = await session.execute(select(Cargo).where(Cargo.id == cargo_id))
    cargo = result.scalar_one_or_none()
    if not cargo:
        return None

    route = {
        "cargo_id": cargo.id,
        "origin": cargo.origin,
        "destination": cargo.destination,
        "origin_coords": None,
        "destination_coords": None,
        "ship_current_coords": None,
        "waypoints": [],
        "status": cargo.status.value,
    }

    if cargo.ship_id:
        ship_result = await session.execute(
            select(Ship).where(Ship.id == cargo.ship_id)
        )
        ship = ship_result.scalar_one_or_none()
        if ship and ship.current_location:
            route["ship_current_coords"] = {
                "lat": ship.current_location.get("lat"),
                "lng": ship.current_location.get("lng"),
                "order": 0,
            }

    return route

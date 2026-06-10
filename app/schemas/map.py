from pydantic import BaseModel


class ShipMapResponse(BaseModel):
    ship_id: int
    name: str
    latitude: float
    longitude: float
    status: str
    capacity: float


class BerthMapResponse(BaseModel):
    berth_id: int
    name: str
    latitude: float
    longitude: float
    status: str
    capacity: float
    current_ship_name: str | None = None


class RoutePoint(BaseModel):
    lat: float
    lng: float
    order: int


class RouteResponse(BaseModel):
    cargo_id: int
    origin: str
    destination: str
    origin_coords: RoutePoint | None = None
    destination_coords: RoutePoint | None = None
    ship_current_coords: RoutePoint | None = None
    waypoints: list[RoutePoint] = []
    status: str

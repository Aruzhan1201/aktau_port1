from datetime import datetime

from pydantic import BaseModel, Field

from app.models.ship import ShipStatus


class ShipCreate(BaseModel):
    name: str = Field(..., max_length=255)
    imo_number: str | None = Field(None, max_length=50)
    captain_id: int | None = None
    capacity: float = Field(..., gt=0)


class ShipResponse(BaseModel):
    id: int
    name: str
    imo_number: str | None
    captain_id: int | None
    current_location: dict | None
    capacity: float
    status: ShipStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class LocationUpdateRequest(BaseModel):
    ship_id: int
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class ShipListResponse(BaseModel):
    total: int
    items: list[ShipResponse]

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.berth import BerthStatus


class BerthCreate(BaseModel):
    name: str = Field(..., max_length=100)
    capacity: float = Field(..., gt=0)
    manager_id: int | None = None
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)


class BerthUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    capacity: float | None = Field(None, gt=0)
    manager_id: int | None = None
    status: BerthStatus | None = None
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)


class BerthResponse(BaseModel):
    id: int
    name: str
    manager_id: int | None
    status: BerthStatus
    capacity: float
    location_coords: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}


class BerthReserveRequest(BaseModel):
    berth_id: int
    ship_id: int
    arrival_time: datetime
    departure_time: datetime | None = None


class ReservationResponse(BaseModel):
    id: int
    berth_id: int
    ship_id: int
    status: str
    arrival_time: datetime
    departure_time: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReservationUpdate(BaseModel):
    arrival_time: datetime | None = None
    departure_time: datetime | None = None
    status: str | None = None


class BerthListResponse(BaseModel):
    total: int
    items: list[BerthResponse]

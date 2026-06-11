from datetime import datetime

from pydantic import BaseModel, Field

from app.models.parking_zone import ParkingZoneStatus
from app.models.parking_spot import ParkingSpotStatus


class ParkingZoneCreate(BaseModel):
    name: str = Field(..., max_length=100)
    port: str = Field("aktau", max_length=50)
    manager_id: int | None = None
    capacity: int = Field(..., gt=0)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)


class ParkingZoneUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    port: str | None = Field(None, max_length=50)
    manager_id: int | None = None
    status: ParkingZoneStatus | None = None
    capacity: int | None = Field(None, gt=0)


class ParkingZoneResponse(BaseModel):
    id: int
    name: str
    port: str
    manager_id: int | None
    status: ParkingZoneStatus
    capacity: int
    location_coords: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ParkingZoneListResponse(BaseModel):
    total: int
    items: list[ParkingZoneResponse]


class ParkingSpotCreate(BaseModel):
    zone_id: int
    spot_number: str = Field(..., max_length=20)
    tariff_per_hour: float | None = Field(None, gt=0)


class ParkingSpotUpdate(BaseModel):
    status: ParkingSpotStatus | None = None
    tariff_per_hour: float | None = Field(None, gt=0)


class ParkingSpotAssign(BaseModel):
    driver_id: int
    tariff_per_hour: float | None = None


class ParkingSpotResponse(BaseModel):
    id: int
    zone_id: int
    spot_number: str
    status: ParkingSpotStatus
    driver_id: int | None
    tariff_per_hour: float | None
    time_in: datetime | None
    time_out: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ParkingSpotListResponse(BaseModel):
    total: int
    items: list[ParkingSpotResponse]

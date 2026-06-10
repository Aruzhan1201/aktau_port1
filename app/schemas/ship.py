import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.ship import ShipStatus


IMO_PATTERN = re.compile(r"^\d{7}$")


class ShipCreate(BaseModel):
    name: str = Field(..., max_length=255)
    imo_number: str | None = Field(None, max_length=50)
    captain_id: int | None = None
    capacity: float = Field(..., gt=0)

    @field_validator("imo_number")
    @classmethod
    def validate_imo(cls, v: str | None) -> str | None:
        if v is not None and not IMO_PATTERN.match(v):
            raise ValueError("IMO number must be exactly 7 digits")
        return v


class ShipUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    imo_number: str | None = Field(None, max_length=50)
    captain_id: int | None = None
    capacity: float | None = Field(None, gt=0)
    status: ShipStatus | None = None

    @field_validator("imo_number")
    @classmethod
    def validate_imo(cls, v: str | None) -> str | None:
        if v is not None and not IMO_PATTERN.match(v):
            raise ValueError("IMO number must be exactly 7 digits")
        return v


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

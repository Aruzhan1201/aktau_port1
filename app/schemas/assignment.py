from datetime import datetime

from pydantic import BaseModel, Field


class AssignmentCreate(BaseModel):
    ship_id: int
    berth_id: int
    cargo_id: int | None = None
    arrival_time: datetime | None = None
    departure_time: datetime | None = None


class AssignmentResponse(BaseModel):
    id: int
    ship_id: int
    berth_id: int
    cargo_id: int | None
    status: str
    arrival_time: datetime | None
    departure_time: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}

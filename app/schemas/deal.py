from datetime import datetime

from pydantic import BaseModel, Field

from app.models.deal import DealStatus, DealType


class DealCreate(BaseModel):
    type: DealType
    client_id: int
    driver_id: int | None = None
    captain_id: int | None = None
    cargo_id: int | None = None
    proposed_price: float | None = None
    currency: str = "USD"
    notes: str | None = None


class DealUpdate(BaseModel):
    proposed_price: float | None = None
    notes: str | None = None


class DealResponse(BaseModel):
    id: int
    type: DealType
    status: DealStatus
    client_id: int
    driver_id: int | None
    captain_id: int | None
    cargo_id: int | None
    proposed_price: float | None
    currency: str
    client_status: str
    driver_status: str
    captain_status: str
    client_approved: bool
    driver_approved: bool
    captain_approved: bool
    phone_revealed_at: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DealListResponse(BaseModel):
    total: int
    items: list[DealResponse]

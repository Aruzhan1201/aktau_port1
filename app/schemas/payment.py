from datetime import datetime

from pydantic import BaseModel, Field

from app.models.payment import PaymentStatus, PaymentType


class PaymentCreate(BaseModel):
    type: PaymentType
    amount: float = Field(..., gt=0)
    currency: str = "USD"
    cargo_id: int | None = None
    reservation_id: int | None = None
    paid_by: int | None = None


class PaymentResponse(BaseModel):
    id: int
    type: PaymentType
    amount: float
    currency: str
    cargo_id: int | None
    reservation_id: int | None
    paid_by: int | None
    status: PaymentStatus
    created_at: datetime
    paid_at: datetime | None

    model_config = {"from_attributes": True}


class RevenueResponse(BaseModel):
    total_income: float
    cargo_fees: float
    berth_fees: float
    penalties: float
    total_pending: float
    total_paid: float

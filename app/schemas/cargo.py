from datetime import datetime

from pydantic import BaseModel, Field

from app.models.cargo import CargoStatus


class CargoCreate(BaseModel):
    cargo_type: str = Field(..., max_length=100)
    weight: float = Field(..., gt=0)
    origin: str = Field(..., max_length=255)
    destination: str = Field(..., max_length=255)
    eta: datetime | None = None


class CargoUpdate(BaseModel):
    cargo_type: str | None = Field(None, max_length=100)
    weight: float | None = Field(None, gt=0)
    origin: str | None = Field(None, max_length=255)
    destination: str | None = Field(None, max_length=255)
    eta: datetime | None = None


class CargoResponse(BaseModel):
    id: int
    client_id: int
    company_id: int | None
    ship_id: int | None
    cargo_type: str
    weight: float
    origin: str
    destination: str
    status: CargoStatus
    eta: datetime | None
    priority_score: float
    is_flagged: bool
    flag_reason: str | None
    ai_generated: bool
    ai_confidence: float | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CargoStatusUpdate(BaseModel):
    status: CargoStatus
    notes: str | None = None


class AssignShipRequest(BaseModel):
    cargo_id: int
    ship_id: int


class AIOrderInput(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


class AIOrderOutput(BaseModel):
    cargo_type: str | None = None
    weight: float | None = None
    origin: str | None = None
    destination: str | None = None
    deadline: str | None = None
    confidence: float = 0.0
    missing_fields: list[str] = []
    requires_review: bool = False


class CargoListResponse(BaseModel):
    total: int
    items: list[CargoResponse]

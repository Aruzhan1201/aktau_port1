from datetime import datetime

from pydantic import BaseModel, Field

from app.models.cargo import CargoStatus, VehicleType


class CargoCreate(BaseModel):
    cargo_type: str = Field(..., max_length=100)
    weight: float = Field(..., gt=0)
    origin: str = Field(..., max_length=255)
    destination: str = Field(..., max_length=255)
    eta: datetime | None = None
    sender_name: str | None = Field(None, max_length=255)
    sender_phone: str | None = Field(None, max_length=50)
    receiver_name: str | None = Field(None, max_length=255)
    receiver_phone: str | None = Field(None, max_length=50)
    route_waypoints: list[dict] | None = None
    vehicle_type: VehicleType | None = None
    budget: float | None = None


class CargoUpdate(BaseModel):
    cargo_type: str | None = Field(None, max_length=100)
    weight: float | None = Field(None, gt=0)
    origin: str | None = Field(None, max_length=255)
    destination: str | None = Field(None, max_length=255)
    eta: datetime | None = None
    sender_name: str | None = Field(None, max_length=255)
    sender_phone: str | None = Field(None, max_length=50)
    receiver_name: str | None = Field(None, max_length=255)
    receiver_phone: str | None = Field(None, max_length=50)
    route_waypoints: list[dict] | None = None
    vehicle_type: VehicleType | None = None
    budget: float | None = None


class CargoResponse(BaseModel):
    id: int
    client_id: int
    company_id: int | None
    ship_id: int | None
    driver_id: int | None
    cargo_type: str
    weight: float
    origin: str
    destination: str
    route_waypoints: list[dict] | None
    vehicle_type: VehicleType | None
    budget: float | None
    status: CargoStatus
    eta: datetime | None
    priority_score: float
    is_flagged: bool
    flag_reason: str | None
    ai_generated: bool
    ai_confidence: float | None
    sender_name: str | None
    sender_phone: str | None
    receiver_name: str | None
    receiver_phone: str | None
    captain_approved: bool
    client_approved: bool
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

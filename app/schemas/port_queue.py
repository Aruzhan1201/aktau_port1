from datetime import datetime

from pydantic import BaseModel

from app.models.port_queue import QueueStatus


class QueueItemResponse(BaseModel):
    id: int
    cargo_id: int
    ship_id: int | None
    priority_score: float
    status: QueueStatus
    entered_at: datetime
    assigned_at: datetime | None
    completed_at: datetime | None
    cargo_type: str | None = None
    weight: float | None = None
    destination: str | None = None

    model_config = {"from_attributes": True}


class QueueListResponse(BaseModel):
    total: int
    waiting: int
    items: list[QueueItemResponse]

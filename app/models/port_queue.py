import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class QueueStatus(str, enum.Enum):
    waiting = "waiting"
    assigned = "assigned"
    completed = "completed"


class PortQueue(Base):
    __tablename__ = "port_queue"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cargo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cargoes.id"), nullable=False
    )
    ship_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("ships.id"), nullable=True
    )
    priority_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    status: Mapped[QueueStatus] = mapped_column(
        Enum(QueueStatus, name="queue_status"),
        nullable=False,
        default=QueueStatus.waiting,
    )
    entered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    assigned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    cargo: Mapped["Cargo"] = relationship("Cargo", back_populates="queue_entry")
    ship: Mapped["Ship"] = relationship("Ship", back_populates="queue_entries")

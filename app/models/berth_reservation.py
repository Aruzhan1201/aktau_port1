import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ReservationStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class BerthReservation(Base):
    __tablename__ = "berth_reservations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    berth_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("berths.id"), nullable=False
    )
    ship_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ships.id"), nullable=False
    )
    status: Mapped[ReservationStatus] = mapped_column(
        Enum(ReservationStatus, name="reservation_status"),
        nullable=False,
        default=ReservationStatus.active,
    )
    arrival_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    departure_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    berth: Mapped["Berth"] = relationship("Berth", back_populates="reservations")
    ship: Mapped["Ship"] = relationship("Ship", back_populates="berth_reservations")

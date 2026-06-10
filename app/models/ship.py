import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ShipStatus(str, enum.Enum):
    available = "available"
    berthed = "berthed"
    in_transit = "in_transit"
    maintenance = "maintenance"


class Ship(Base):
    __tablename__ = "ships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    imo_number: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    captain_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    current_location: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    capacity: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    status: Mapped[ShipStatus] = mapped_column(
        Enum(ShipStatus, name="ship_status"), nullable=False, default=ShipStatus.available
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    captain: Mapped["User"] = relationship(
        "User", back_populates="captain_ships", foreign_keys=[captain_id]
    )
    cargoes: Mapped[list["Cargo"]] = relationship("Cargo", back_populates="ship")
    assignments: Mapped[list["Assignment"]] = relationship(
        "Assignment", back_populates="ship"
    )
    berth_reservations: Mapped[list["BerthReservation"]] = relationship(
        "BerthReservation", back_populates="ship"
    )
    queue_entries: Mapped[list["PortQueue"]] = relationship(
        "PortQueue", back_populates="ship"
    )

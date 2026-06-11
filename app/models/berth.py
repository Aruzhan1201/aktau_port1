import enum
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BerthStatus(str, enum.Enum):
    free = "free"
    reserved = "reserved"
    occupied = "occupied"
    maintenance = "maintenance"


class Berth(Base):
    __tablename__ = "berths"
    __table_args__ = (
        CheckConstraint("capacity > 0", name="ck_berth_capacity_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    manager_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    status: Mapped[BerthStatus] = mapped_column(
        Enum(BerthStatus, name="berth_status"),
        nullable=False,
        default=BerthStatus.free,
    )
    capacity: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    location_coords: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    manager: Mapped["User"] = relationship(
        "User", back_populates="managed_berths", foreign_keys=[manager_id]
    )
    reservations: Mapped[list["BerthReservation"]] = relationship(
        "BerthReservation", back_populates="berth"
    )
    assignments: Mapped[list["Assignment"]] = relationship(
        "Assignment", back_populates="berth"
    )
    status_logs: Mapped[list["BerthStatusLog"]] = relationship(
        "BerthStatusLog", back_populates="berth", cascade="all, delete-orphan"
    )

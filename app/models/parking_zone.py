import enum
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ParkingZoneStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    full = "full"


class ParkingZone(Base):
    __tablename__ = "parking_zones"
    __table_args__ = (
        CheckConstraint("capacity > 0", name="ck_parking_zone_capacity_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    port: Mapped[str] = mapped_column(String(50), nullable=False, default="aktau")
    manager_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    status: Mapped[ParkingZoneStatus] = mapped_column(
        Enum(ParkingZoneStatus, name="parking_zone_status"),
        nullable=False,
        default=ParkingZoneStatus.active,
    )
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    location_coords: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    parking_manager: Mapped["User"] = relationship(
        "User", back_populates="managed_parking_zones", foreign_keys=[manager_id]
    )
    spots: Mapped[list["ParkingSpot"]] = relationship(
        "ParkingSpot", back_populates="zone", cascade="all, delete-orphan"
    )

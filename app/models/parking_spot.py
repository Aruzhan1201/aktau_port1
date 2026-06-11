import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ParkingSpotStatus(str, enum.Enum):
    free = "free"
    reserved = "reserved"
    occupied = "occupied"
    maintenance = "maintenance"


class ParkingSpot(Base):
    __tablename__ = "parking_spots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    zone_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("parking_zones.id"), nullable=False
    )
    spot_number: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[ParkingSpotStatus] = mapped_column(
        Enum(ParkingSpotStatus, name="parking_spot_status"),
        nullable=False,
        default=ParkingSpotStatus.free,
    )
    driver_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    tariff_per_hour: Mapped[float | None] = mapped_column(
        Float(precision=2), nullable=True, default=5.0
    )
    time_in: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    time_out: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    zone: Mapped["ParkingZone"] = relationship(
        "ParkingZone", back_populates="spots", foreign_keys=[zone_id]
    )
    driver: Mapped["User | None"] = relationship(
        "User", back_populates="assigned_parking_spots", foreign_keys=[driver_id]
    )

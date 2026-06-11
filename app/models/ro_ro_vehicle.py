import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RoRoStatus(str, enum.Enum):
    entered = "entered"
    loading = "loading"
    loaded = "loaded"
    exited = "exited"


class RoRoVehicle(Base):
    __tablename__ = "ro_ro_vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plate_number: Mapped[str] = mapped_column(String(50), nullable=False)
    driver_name: Mapped[str] = mapped_column(String(255), nullable=False)
    driver_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    vehicle_type: Mapped[str] = mapped_column(String(100), default="car", nullable=False)
    cargo_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("cargoes.id"), nullable=True
    )
    port: Mapped[str] = mapped_column(String(50), nullable=False, default="aktau")
    status: Mapped[RoRoStatus] = mapped_column(
        Enum(RoRoStatus, name="ro_ro_status"),
        nullable=False,
        default=RoRoStatus.entered,
    )
    entry_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    exit_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    cargo: Mapped["Cargo | None"] = relationship("Cargo", back_populates="ro_ro_vehicles")
    processing_logs: Mapped[list["RoRoProcessingLog"]] = relationship(
        "RoRoProcessingLog", back_populates="vehicle", cascade="all, delete-orphan"
    )

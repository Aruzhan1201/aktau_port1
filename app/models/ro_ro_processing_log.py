from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RoRoProcessingLog(Base):
    __tablename__ = "ro_ro_processing_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vehicle_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ro_ro_vehicles.id"), nullable=False
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    operator_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    vehicle: Mapped["RoRoVehicle"] = relationship(
        "RoRoVehicle", back_populates="processing_logs"
    )
    operator: Mapped["User | None"] = relationship("User")

from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.cargo import CargoStatus


class CargoStatusLog(Base):
    __tablename__ = "cargo_status_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cargo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cargoes.id"), nullable=False
    )
    from_status: Mapped[CargoStatus | None] = mapped_column(
        Enum(CargoStatus, name="cargo_status"), nullable=True
    )
    to_status: Mapped[CargoStatus] = mapped_column(
        Enum(CargoStatus, name="cargo_status"), nullable=False
    )
    changed_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    cargo: Mapped["Cargo"] = relationship("Cargo", back_populates="status_logs")
    changed_by_user: Mapped["User"] = relationship(
        "User", back_populates="status_logs"
    )

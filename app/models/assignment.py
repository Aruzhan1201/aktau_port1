from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ship_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ships.id"), nullable=False
    )
    berth_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("berths.id"), nullable=False
    )
    cargo_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("cargoes.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    arrival_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    departure_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    ship: Mapped["Ship"] = relationship("Ship", back_populates="assignments")
    berth: Mapped["Berth"] = relationship("Berth", back_populates="assignments")
    cargo: Mapped["Cargo"] = relationship("Cargo", back_populates="assignments")

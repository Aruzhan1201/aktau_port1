import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CargoStatus(str, enum.Enum):
    created = "created"
    approved = "approved"
    assigned = "assigned"
    loading = "loading"
    in_transit = "in_transit"
    arrived = "arrived"
    delivered = "delivered"


class Cargo(Base):
    __tablename__ = "cargoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    company_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("companies.id"), nullable=True
    )
    ship_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("ships.id"), nullable=True
    )
    cargo_type: Mapped[str] = mapped_column(String(100), nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    origin: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[CargoStatus] = mapped_column(
        Enum(CargoStatus, name="cargo_status"),
        nullable=False,
        default=CargoStatus.created,
    )
    eta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    priority_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    flag_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_raw_input: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    client: Mapped["User"] = relationship(
        "User", back_populates="cargoes", foreign_keys=[client_id]
    )
    company: Mapped["Company"] = relationship("Company", back_populates="cargoes")
    ship: Mapped["Ship"] = relationship("Ship", back_populates="cargoes")
    status_logs: Mapped[list["CargoStatusLog"]] = relationship(
        "CargoStatusLog", back_populates="cargo", cascade="all, delete-orphan"
    )
    documents: Mapped[list["CargoDocument"]] = relationship(
        "CargoDocument", back_populates="cargo", cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="cargo"
    )
    queue_entry: Mapped[list["PortQueue"]] = relationship(
        "PortQueue", back_populates="cargo"
    )
    assignments: Mapped[list["Assignment"]] = relationship(
        "Assignment", back_populates="cargo"
    )

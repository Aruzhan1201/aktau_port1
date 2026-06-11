import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DealStatus(str, enum.Enum):
    pending = "pending"
    client_approved = "client_approved"
    driver_approved = "driver_approved"
    captain_approved = "captain_approved"
    both_approved = "both_approved"
    completed = "completed"
    cancelled = "cancelled"


class DealType(str, enum.Enum):
    cargo_transport = "cargo_transport"
    parking_rental = "parking_rental"
    berth_rental = "berth_rental"


class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[DealType] = mapped_column(
        Enum(DealType, name="deal_type"), nullable=False
    )
    status: Mapped[DealStatus] = mapped_column(
        Enum(DealStatus, name="deal_status"),
        nullable=False,
        default=DealStatus.pending,
    )
    client_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    driver_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    captain_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    cargo_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("cargoes.id"), nullable=True
    )
    proposed_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    client_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )
    driver_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )
    captain_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )
    client_approved: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    driver_approved: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    captain_approved: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    phone_revealed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    client: Mapped["User"] = relationship(
        "User", back_populates="deals_as_client", foreign_keys=[client_id]
    )
    driver: Mapped["User | None"] = relationship(
        "User", back_populates="deals_as_driver", foreign_keys=[driver_id]
    )
    captain: Mapped["User | None"] = relationship(
        "User", back_populates="deals_as_captain", foreign_keys=[captain_id]
    )
    cargo: Mapped["Cargo | None"] = relationship("Cargo", back_populates="deals")

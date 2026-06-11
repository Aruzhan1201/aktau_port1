import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON
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
    cancelled = "cancelled"


class VehicleType(str, enum.Enum):
    ship = "ship"
    car = "car"
    both = "both"


class Cargo(Base):
    __tablename__ = "cargoes"
    __table_args__ = (
        CheckConstraint("weight > 0", name="ck_cargo_weight_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    sender_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    receiver_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    company_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("companies.id"), nullable=True
    )
    sender_company_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("companies.id"), nullable=True
    )
    receiver_company_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("companies.id"), nullable=True
    )
    ship_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("ships.id"), nullable=True
    )
    driver_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    cargo_type: Mapped[str] = mapped_column(String(100), nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    origin: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)

    route_waypoints: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    vehicle_type: Mapped[VehicleType | None] = mapped_column(
        Enum(VehicleType, name="vehicle_type"), nullable=True
    )
    budget: Mapped[float | None] = mapped_column(Float, nullable=True)

    status: Mapped[CargoStatus] = mapped_column(
        Enum(CargoStatus, name="cargo_status"),
        nullable=False,
        default=CargoStatus.created,
    )
    eta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    priority_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    flag_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    sender_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sender_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    receiver_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    receiver_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    captain_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    client_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    phone_revealed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    is_ro_ro: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    vehicle_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

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
    sender: Mapped["User | None"] = relationship(
        "User", back_populates="sent_cargoes", foreign_keys=[sender_id]
    )
    receiver: Mapped["User | None"] = relationship(
        "User", back_populates="received_cargoes", foreign_keys=[receiver_id]
    )
    company: Mapped["Company"] = relationship("Company", back_populates="cargoes", foreign_keys=[company_id])
    sender_company: Mapped["Company | None"] = relationship("Company", foreign_keys=[sender_company_id])
    receiver_company: Mapped["Company | None"] = relationship("Company", foreign_keys=[receiver_company_id])
    ship: Mapped["Ship"] = relationship("Ship", back_populates="cargoes")
    driver: Mapped["User | None"] = relationship(
        "User", back_populates="driver_cargoes", foreign_keys=[driver_id]
    )
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
    ro_ro_vehicles: Mapped[list["RoRoVehicle"]] = relationship(
        "RoRoVehicle", back_populates="cargo"
    )
    deals: Mapped[list["Deal"]] = relationship(
        "Deal", back_populates="cargo"
    )

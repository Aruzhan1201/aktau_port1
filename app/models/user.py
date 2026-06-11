import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    client = "client"
    sender = "sender"
    receiver = "receiver"
    parking_manager = "parking_manager"
    driver = "driver"
    captain = "captain"
    port_manager = "port_manager"
    governance = "governance"
    gov_authority = "gov_authority"
    admin = "admin"
    super_admin = "super_admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("companies.id"), nullable=True
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.client
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    telegram_chat_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    company: Mapped["Company"] = relationship("Company", back_populates="users")
    cargoes: Mapped[list["Cargo"]] = relationship(
        "Cargo", back_populates="client", foreign_keys="Cargo.client_id"
    )
    sent_cargoes: Mapped[list["Cargo"]] = relationship(
        "Cargo", back_populates="sender", foreign_keys="Cargo.sender_id"
    )
    received_cargoes: Mapped[list["Cargo"]] = relationship(
        "Cargo", back_populates="receiver", foreign_keys="Cargo.receiver_id"
    )
    driver_cargoes: Mapped[list["Cargo"]] = relationship(
        "Cargo", back_populates="driver", foreign_keys="Cargo.driver_id"
    )
    captain_ships: Mapped[list["Ship"]] = relationship(
        "Ship", back_populates="captain", foreign_keys="Ship.captain_id"
    )
    managed_berths: Mapped[list["Berth"]] = relationship(
        "Berth", back_populates="manager", foreign_keys="Berth.manager_id"
    )
    status_logs: Mapped[list["CargoStatusLog"]] = relationship(
        "CargoStatusLog", back_populates="changed_by_user"
    )
    verified_documents: Mapped[list["CargoDocument"]] = relationship(
        "CargoDocument", back_populates="verified_by_user"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user"
    )
    payments_made: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="paid_by_user"
    )
    reported_incidents: Mapped[list["IncidentReport"]] = relationship(
        "IncidentReport", back_populates="reporter"
    )
    generated_reports: Mapped[list["PerformanceReport"]] = relationship(
        "PerformanceReport", back_populates="generator"
    )
    managed_parking_zones: Mapped[list["ParkingZone"]] = relationship(
        "ParkingZone", back_populates="parking_manager", foreign_keys="ParkingZone.manager_id"
    )
    assigned_parking_spots: Mapped[list["ParkingSpot"]] = relationship(
        "ParkingSpot", back_populates="driver", foreign_keys="ParkingSpot.driver_id"
    )
    deals_as_client: Mapped[list["Deal"]] = relationship(
        "Deal", back_populates="client", foreign_keys="Deal.client_id"
    )
    deals_as_driver: Mapped[list["Deal"]] = relationship(
        "Deal", back_populates="driver", foreign_keys="Deal.driver_id"
    )
    deals_as_captain: Mapped[list["Deal"]] = relationship(
        "Deal", back_populates="captain", foreign_keys="Deal.captain_id"
    )

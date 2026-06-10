import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    client = "client"
    captain = "captain"
    parking_manager = "parking_manager"
    admin = "admin"


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

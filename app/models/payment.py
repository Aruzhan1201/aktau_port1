import enum
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PaymentType(str, enum.Enum):
    cargo_fee = "cargo_fee"
    berth_fee = "berth_fee"
    penalty = "penalty"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    refunded = "refunded"


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_payment_amount_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[PaymentType] = mapped_column(
        Enum(PaymentType, name="payment_type"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    cargo_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("cargoes.id"), nullable=True
    )
    reservation_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("berth_reservations.id"), nullable=True
    )
    paid_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status"),
        nullable=False,
        default=PaymentStatus.pending,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bank_account: Mapped[str | None] = mapped_column(String(50), nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(30), nullable=True)
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    cargo: Mapped["Cargo"] = relationship("Cargo", back_populates="payments")
    paid_by_user: Mapped["User"] = relationship("User", back_populates="payments_made")

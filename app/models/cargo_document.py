import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DocumentType(str, enum.Enum):
    invoice = "invoice"
    customs_declaration = "customs_declaration"
    bill_of_lading = "bill_of_lading"


class VerificationStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    flagged = "flagged"


class CargoDocument(Base):
    __tablename__ = "cargo_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cargo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cargoes.id"), nullable=False
    )
    document_type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType, name="document_type"), nullable=False
    )
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, name="verification_status"),
        nullable=False,
        default=VerificationStatus.pending,
    )
    flagged_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    cargo: Mapped["Cargo"] = relationship("Cargo", back_populates="documents")
    verified_by_user: Mapped["User"] = relationship(
        "User", back_populates="verified_documents"
    )

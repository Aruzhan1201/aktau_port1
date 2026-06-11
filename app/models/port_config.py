from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PortConfig(Base):
    __tablename__ = "port_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    port_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    center_lat: Mapped[float] = mapped_column(Float, nullable=False)
    center_lng: Mapped[float] = mapped_column(Float, nullable=False)
    zoom_level: Mapped[int] = mapped_column(Integer, default=14, nullable=False)
    config_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    operations_status: Mapped[str] = mapped_column(
        String(50), default="active", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

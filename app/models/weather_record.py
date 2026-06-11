import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class WeatherPort(str, enum.Enum):
    aktau = "aktau"
    kuryk = "kuryk"


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    port: Mapped[WeatherPort] = mapped_column(
        Enum(WeatherPort, name="weather_port"), nullable=False
    )
    wind_speed: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    wind_direction: Mapped[str | None] = mapped_column(String(50), nullable=True)
    wave_height: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    visibility: Mapped[float] = mapped_column(Float, nullable=False, default=10000.0)
    water_temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    storm_alert: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    storm_alert_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

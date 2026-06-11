from typing import List
import json

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Aktau Port Logistics"
    DEBUG: bool = False
    SECRET_KEY: str = "change-this-to-a-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/aktau_port"

    REDIS_URL: str = "redis://redis:6379/0"

    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "openai/gpt-4o"

    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_WEBHOOK_URL: str = ""

    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'

    UPLOAD_DIR: str = "uploads/documents"
    MAX_UPLOAD_SIZE_MB: int = 10
    REDIS_CACHE_TTL_SECONDS: int = 300
    SCHEDULER_INTERVAL_SECONDS: int = 60
    OPENWEATHERMAP_API_KEY: str = ""
    WEATHER_CACHE_TTL_SECONDS: int = 1800
    WEATHER_SCHEDULER_INTERVAL_SECONDS: int = 1800
    STORM_WIND_THRESHOLD: float = 15.0
    STORM_WAVE_THRESHOLD: float = 3.0
    STORM_VISIBILITY_THRESHOLD: float = 500.0

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

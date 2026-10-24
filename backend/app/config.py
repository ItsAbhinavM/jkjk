from datetime import datetime, timezone

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    database_url: str = "sqlite:///./app.db"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000", "https://jkjktechnicalassignment.vercel.app"]
    cors_origin_regex: str = r"https?://(localhost|127\.0\.0\.1)(:\d+)?"
    auto_ingest: bool = True  # ingest on startup when the DB is empty

    # Elexon BMRS (Insights API)
    elexon_base_url: str = "https://data.elexon.co.uk/bmrs/api/v1"
    request_timeout: float = 30.0
    max_retries: int = 3
    retry_backoff: float = 1.0  # seconds; doubles each retry
    chunk_days: int = 7  # split big date ranges into smaller requests

    # Target window: January 2026 (1,488 half-hour slots)
    range_start: datetime = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    range_end: datetime = datetime(2026, 1, 31, 23, 59, 59, tzinfo=timezone.utc)

    # Forecasts published more than this long before their target time are ignored.
    # Day-ahead decisions only need forecasts ~14-38h out, so this keeps the DB small.
    forecast_max_horizon_hours: int = 48


settings = Settings()
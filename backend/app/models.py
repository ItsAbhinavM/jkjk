from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.utils.datetime_utils import utcnow


class ActualGeneration(Base):
    """FUELHH wind outturn, one row per half-hour (UTC)."""

    __tablename__ = "actual_generation"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, index=True, unique=True, nullable=False)
    settlement_period: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-50
    generation_mw: Mapped[float] = mapped_column(Float, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class ForecastGeneration(Base):
    """WINDFOR wind forecasts, one row per (target time, publish time)."""

    __tablename__ = "forecast_generation"
    __table_args__ = (UniqueConstraint("start_time", "publish_time"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, index=True, nullable=False)
    publish_time: Mapped[datetime] = mapped_column(DateTime, index=True, nullable=False)
    settlement_period: Mapped[int] = mapped_column(Integer, nullable=False)
    generation_mw: Mapped[float] = mapped_column(Float, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
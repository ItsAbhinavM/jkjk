from datetime import datetime, date
from typing import Annotated

from pydantic import AfterValidator, BaseModel, Field

from app.config import settings
from app.utils.datetime_utils import is_half_hour_aligned, to_utc

RANGE_START = settings.range_start.date()
RANGE_END = settings.range_end.date()

def _half_hour_utc(dt: datetime) -> datetime:
    dt = to_utc(dt)
    if not is_half_hour_aligned(dt):
        raise ValueError(f"{dt.isoformat()} is not on a 30-minute boundary")
    return dt


HalfHourUTC = Annotated[datetime, AfterValidator(_half_hour_utc)]
UTCDateTime = Annotated[datetime, AfterValidator(to_utc)]
# Wind can't generate negative power to the grid, so negatives are clipped to 0.
MW = Annotated[float, Field(allow_inf_nan=False), AfterValidator(lambda v: max(v, 0.0))]


class ActualRecord(BaseModel):
    """One FUELHH record from Elexon."""

    start_time: HalfHourUTC = Field(alias="startTime")
    publish_time: UTCDateTime | None = Field(default=None, alias="publishTime")
    fuel_type: str = Field(alias="fuelType")
    generation: MW


class ForecastRecord(BaseModel):
    """One WINDFOR record from Elexon."""

    start_time: HalfHourUTC = Field(alias="startTime")
    publish_time: UTCDateTime = Field(alias="publishTime")
    generation: MW


class HealthResponse(BaseModel):
    status: str
    db_connected: bool

class SeriesPoint(BaseModel):
    start_time: datetime
    settlement_period: int
    actual_mw: float | None  # null = no data for this slot (never substituted with 0)
    forecast_mw: float | None
    error_mw: float | None  # forecast - actual


class MetricsResponse(BaseModel):
    mae: float | None
    rmse: float | None
    mape: float | None
    bias: float | None  # > 0: wind over-forecast on average
    count: int
    p10: float | None
    p50: float | None
    p90: float | None
    error_distribution: list[float]


class SimulateRequest(BaseModel):
    demand_mw: float = Field(default=12_000, gt=0)
    confidence_level: float = Field(default=0.9, ge=0.5, le=0.99)
    start_date: date = Field(default=RANGE_START, ge=RANGE_START, le=RANGE_END)
    end_date: date = Field(default=RANGE_END, ge=RANGE_START, le=RANGE_END)


class ProcurementRow(BaseModel):
    start_time: datetime
    forecast_wind: float | None
    demand: float
    raw_deficit: float | None
    recommended_procurement: float | None
    risk_buffer_mw: float
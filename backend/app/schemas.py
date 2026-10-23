from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, Field

from app.utils.datetime_utils import is_half_hour_aligned, to_utc


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
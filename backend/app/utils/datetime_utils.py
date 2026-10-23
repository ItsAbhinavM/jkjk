from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pandas as pd

UTC = timezone.utc
LONDON = ZoneInfo("Europe/London")
HALF_HOUR = timedelta(minutes=30)


def utcnow() -> datetime:
    """Naive UTC 'now'. SQLite stores naive datetimes, so everything in the DB is UTC."""
    return datetime.now(UTC).replace(tzinfo=None)


def to_utc(dt: datetime) -> datetime:
    """Timezone-aware UTC datetime. Naive input is assumed to already be UTC."""
    return dt.replace(tzinfo=UTC) if dt.tzinfo is None else dt.astimezone(UTC)


def is_half_hour_aligned(dt: datetime) -> bool:
    return dt.minute in (0, 30) and dt.second == 0 and dt.microsecond == 0


def settlement_period(dt: datetime) -> int:
    """GB settlement period for a half-hour start time (1-48, or 46/50 on clock-change days).

    The settlement day starts at local (Europe/London) midnight.
    """
    dt = to_utc(dt)
    midnight = dt.astimezone(LONDON).replace(hour=0, minute=0, second=0, microsecond=0)
    return int((dt - midnight.astimezone(UTC)) / HALF_HOUR) + 1


def half_hour_index(start: datetime, end: datetime) -> pd.DatetimeIndex:
    """Every 30-minute slot from start up to end (tz-naive UTC)."""
    return pd.date_range(
        to_utc(start).replace(tzinfo=None), to_utc(end).replace(tzinfo=None), freq="30min"
    )
import asyncio
import logging
from datetime import datetime, timedelta

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class ElexonError(Exception):
    """Elexon could not be reached (or returned bad data) after all retries."""


def _iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _windows(start: datetime, end: datetime):
    """Split [start, end] into chunks so each request stays well inside the timeout."""
    cur = start
    while cur < end:
        nxt = min(cur + timedelta(days=settings.chunk_days), end)
        yield cur, nxt
        cur = nxt


async def _get_json(client: httpx.AsyncClient, path: str, params: dict) -> list[dict]:
    url = f"{settings.elexon_base_url}/{path}"
    for attempt in range(1, settings.max_retries + 1):
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            if not isinstance(data, list):
                raise ValueError("expected a JSON array")
            return data
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("Elexon %s failed (attempt %d/%d): %r", path, attempt, settings.max_retries, exc)
            if attempt == settings.max_retries:
                raise ElexonError(f"{path} failed after {attempt} attempts") from exc
            await asyncio.sleep(settings.retry_backoff * 2 ** (attempt - 1))
    raise ElexonError(f"{path}: no attempts made")  # only if max_retries < 1


async def fetch_actual_wind(client: httpx.AsyncClient, start: datetime, end: datetime) -> list[dict]:
    """FUELHH half-hourly outturn for WIND. Actuals are published just after each period, so pad the end."""
    rows: list[dict] = []
    for a, b in _windows(start, end + timedelta(days=1)):
        rows += await _get_json(
            client,
            "datasets/FUELHH/stream",
            {"publishDateTimeFrom": _iso(a), "publishDateTimeTo": _iso(b), "fuelType": "WIND"},
        )
    return rows


async def fetch_wind_forecasts(client: httpx.AsyncClient, start: datetime, end: datetime) -> list[dict]:
    """WINDFOR forecasts. Start earlier so forecasts for the first slots of the range are included."""
    first = start - timedelta(hours=settings.forecast_max_horizon_hours)
    rows: list[dict] = []
    for a, b in _windows(first, end):
        rows += await _get_json(
            client,
            "datasets/WINDFOR/stream",
            {"publishDateTimeFrom": _iso(a), "publishDateTimeTo": _iso(b)},
        )
    return rows
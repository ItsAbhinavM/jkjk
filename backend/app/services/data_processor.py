"""Fetch -> validate -> normalise -> store Elexon wind data.

Run manually with:  python -m app.services.data_processor
"""

import asyncio
import logging
from datetime import timedelta

import httpx
import pandas as pd
from pydantic import BaseModel, ValidationError
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.orm import Session

from app.config import settings
from app.db import SessionLocal, init_db
from app.models import ActualGeneration, ForecastGeneration
from app.schemas import ActualRecord, ForecastRecord
from app.services import elexon_client
from app.utils.datetime_utils import half_hour_index, settlement_period

logger = logging.getLogger(__name__)


def parse_records(raw: list, model: type[BaseModel]) -> list:
    """Validate each record on its own; log and skip the malformed ones."""
    valid = []
    for item in raw:
        try:
            valid.append(model.model_validate(item))
        except ValidationError as exc:
            logger.warning("Skipping malformed %s record %r: %s", model.__name__, item, exc.errors()[0]["msg"])
    return valid


def _to_frame(records: list) -> pd.DataFrame:
    df = pd.DataFrame(
        {
            "start_time": [r.start_time for r in records],
            "publish_time": [r.publish_time for r in records],
            "generation_mw": [r.generation for r in records],
        }
    )
    df["start_time"] = pd.to_datetime(df["start_time"], utc=True)
    df["publish_time"] = pd.to_datetime(df["publish_time"], utc=True)
    return df


def _finalise(df: pd.DataFrame) -> pd.DataFrame:
    """Add settlement period and drop timezones (DB holds naive UTC)."""
    df["settlement_period"] = df["start_time"].map(settlement_period).astype(int)
    df["start_time"] = df["start_time"].dt.tz_localize(None)
    df["publish_time"] = df["publish_time"].dt.tz_localize(None)
    return df.reset_index(drop=True)


def build_actuals(raw: list) -> pd.DataFrame:
    """WIND outturn inside the target range, one row per half-hour (latest publish wins)."""
    records = [r for r in parse_records(raw, ActualRecord) if r.fuel_type == "WIND"]
    if not records:
        return _finalise(_to_frame([]))
    df = _to_frame(records)
    df = df[(df["start_time"] >= settings.range_start) & (df["start_time"] <= settings.range_end)]
    df = df.sort_values("publish_time", na_position="first").drop_duplicates("start_time", keep="last")
    return _finalise(df.sort_values("start_time"))


def build_forecasts(raw: list) -> pd.DataFrame:
    """Forecasts for target times in range, unique per (start_time, publish_time)."""
    records = parse_records(raw, ForecastRecord)
    if not records:
        return _finalise(_to_frame([]))
    df = _to_frame(records)
    df = df[(df["start_time"] >= settings.range_start) & (df["start_time"] <= settings.range_end)]
    horizon = df["start_time"] - df["publish_time"]
    df = df[(horizon >= timedelta(0)) & (horizon <= timedelta(hours=settings.forecast_max_horizon_hours))]
    df = df.drop_duplicates(["start_time", "publish_time"], keep="last")  # keep the latest record in the stream
    return _finalise(df.sort_values(["start_time", "publish_time"]))


def reindex_actuals(df: pd.DataFrame) -> pd.DataFrame:
    """Full 30-minute grid for the target range. Missing slots are NaN, never 0."""
    grid = half_hour_index(settings.range_start, settings.range_end)
    out = df.set_index("start_time")[["generation_mw"]].reindex(grid)
    out.index.name = "start_time"
    out = out.reset_index()
    out["settlement_period"] = out["start_time"].map(settlement_period)
    return out[["start_time", "settlement_period", "generation_mw"]]


def _upsert(db: Session, model, df: pd.DataFrame, keys: list[str]) -> int:
    if df.empty:
        return 0
    cols = [c.name for c in model.__table__.columns if c.name not in ("id", "fetched_at")]
    rows = df.assign(fetched_at=pd.Timestamp.now(tz="UTC").tz_localize(None))[cols + ["fetched_at"]]
    stmt = insert(model)
    stmt = stmt.on_conflict_do_update(
        index_elements=keys,
        set_={c: stmt.excluded[c] for c in cols + ["fetched_at"] if c not in keys},
    )
    db.execute(stmt, rows.to_dict("records"))
    db.commit()
    return len(rows)


def _store(raw_actuals: list | None, raw_forecasts: list | None) -> dict:
    """CPU/DB heavy part; runs in a worker thread so the API stays responsive."""
    summary: dict = {}
    with SessionLocal() as db:
        if raw_actuals is not None:
            actuals = build_actuals(raw_actuals)
            missing = int(reindex_actuals(actuals)["generation_mw"].isna().sum())
            if missing:
                logger.warning("%d half-hour slots have no actual generation (left as NaN)", missing)
            summary["actuals_stored"] = _upsert(db, ActualGeneration, actuals, ["start_time"])
            summary["actuals_missing_slots"] = missing
        if raw_forecasts is not None:
            forecasts = build_forecasts(raw_forecasts)
            summary["forecasts_stored"] = _upsert(db, ForecastGeneration, forecasts, ["start_time", "publish_time"])
    return summary


async def _safe_fetch(fetch, client: httpx.AsyncClient) -> list | None:
    try:
        return await fetch(client, settings.range_start, settings.range_end)
    except elexon_client.ElexonError as exc:
        logger.error("%s - keeping cached records in the database", exc)
        return None


async def run_ingestion(client: httpx.AsyncClient | None = None) -> dict:
    """Pull Jan 2026 wind data from Elexon into SQLite. If Elexon fails, existing DB rows stay as they are."""
    init_db()
    own_client = client is None
    client = client or httpx.AsyncClient(timeout=settings.request_timeout)
    try:
        raw_actuals = await _safe_fetch(elexon_client.fetch_actual_wind, client)
        raw_forecasts = await _safe_fetch(elexon_client.fetch_wind_forecasts, client)
    finally:
        if own_client:
            await client.aclose()

    summary = await asyncio.to_thread(_store, raw_actuals, raw_forecasts)
    logger.info("Ingestion finished: %s", summary or "nothing new (served from cache)")
    return summary


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    asyncio.run(run_ingestion())
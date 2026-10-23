"""Day-ahead forecast matching and forecast-accuracy metrics.

Error convention: E = F - A (forecast minus actual). E > 0 means wind was over-forecast.
"""

from datetime import datetime

import numpy as np
import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ActualGeneration, ForecastGeneration
from app.utils.datetime_utils import settlement_period, to_utc

# Day-ahead purchases are made around 10:00-12:00 on D-1, so the forecast used for a target
# time must have been published at least this long before it.
GATE_LEAD = pd.Timedelta(hours=14)
EPSILON_MW = 10.0  # floor for the MAPE denominator, avoids dividing by ~0 MW


def num(x) -> float | None:
    """NaN -> None (JSON null), otherwise a float rounded for display."""
    return None if pd.isna(x) else round(float(x), 2)


def _query_frame(db: Session, stmt, columns: list[str]) -> pd.DataFrame:
    df = pd.DataFrame(db.execute(stmt).all(), columns=columns)
    for col in columns:
        if col.endswith("_time"):
            df[col] = pd.to_datetime(df[col]).dt.as_unit("ns")
    return df


def match_day_ahead(forecasts: pd.DataFrame) -> pd.Series:
    """For each target time, the latest forecast published at least GATE_LEAD before it."""
    eligible = forecasts[forecasts["publish_time"] <= forecasts["start_time"] - GATE_LEAD]
    latest = eligible.sort_values("publish_time").drop_duplicates("start_time", keep="last")
    return latest.set_index("start_time")["generation_mw"]


def load_series(db: Session, start: datetime, end: datetime) -> pd.DataFrame:
    """Half-hourly actual vs day-ahead forecast for [start, end), both naive UTC. Gaps stay NaN."""
    grid = pd.date_range(start, end, freq="30min", inclusive="left").as_unit("ns")

    actuals = _query_frame(
        db,
        select(ActualGeneration.start_time, ActualGeneration.generation_mw).where(
            ActualGeneration.start_time >= start, ActualGeneration.start_time < end
        ),
        ["start_time", "generation_mw"],
    )
    forecasts = _query_frame(
        db,
        select(
            ForecastGeneration.start_time, ForecastGeneration.publish_time, ForecastGeneration.generation_mw
        ).where(ForecastGeneration.start_time >= start, ForecastGeneration.start_time < end),
        ["start_time", "publish_time", "generation_mw"],
    )
    day_ahead = match_day_ahead(forecasts)

    out = pd.DataFrame({"start_time": grid})
    out["settlement_period"] = out["start_time"].map(settlement_period)
    out["actual_mw"] = actuals.set_index("start_time")["generation_mw"].reindex(grid).to_numpy(dtype=float)
    # WINDFOR is hourly, so each hourly forecast is held across both half-hours of that hour.
    out["forecast_mw"] = day_ahead.reindex(grid.floor("h")).to_numpy(dtype=float)
    out["error_mw"] = out["forecast_mw"] - out["actual_mw"]
    return out


def compute_metrics(series: pd.DataFrame) -> dict:
    """MAE, RMSE, MAPE, bias and error quantiles over slots that have both an actual and a forecast."""
    pairs = series.dropna(subset=["actual_mw", "forecast_mw"])
    err = pairs["error_mw"].to_numpy()
    actual = pairs["actual_mw"].to_numpy()

    if err.size == 0:
        return {"count": 0, "mae": None, "rmse": None, "mape": None, "bias": None,
                "p10": None, "p50": None, "p90": None, "error_distribution": []}

    p10, p50, p90 = np.quantile(err, [0.1, 0.5, 0.9])
    return {
        "count": int(err.size),
        "mae": num(np.abs(err).mean()),
        "rmse": num(np.sqrt((err**2).mean())),
        "mape": num(100 * (np.abs(err) / np.maximum(actual, EPSILON_MW)).mean()),
        "bias": num(err.mean()),
        "p10": num(p10),
        "p50": num(p50),
        "p90": num(p90),
        "error_distribution": np.round(err, 2).tolist(),
    }


def series_to_records(series: pd.DataFrame) -> list[dict]:
    """Rows for the API. Timestamps get an explicit UTC offset so browsers don't read them as local time."""
    return [
        {
            "start_time": to_utc(row.start_time.to_pydatetime()),
            "settlement_period": int(row.settlement_period),
            "actual_mw": num(row.actual_mw),
            "forecast_mw": num(row.forecast_mw),
            "error_mw": num(row.error_mw),
        }
        for row in series.itertuples(index=False)
    ]
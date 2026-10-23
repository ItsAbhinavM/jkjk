"""Day-ahead procurement recommendation with a forecast-error safety buffer."""

import numpy as np
import pandas as pd

from app.services.analytics_engine import num
from app.utils.datetime_utils import to_utc


class InsufficientData(ValueError):
    """No overlapping actual/forecast data to size a risk buffer from."""


def simulate(series: pd.DataFrame, demand_mw: float, confidence_level: float) -> list[dict]:
    """Half-hourly thermal top-up: P = max(0, D - F + B), where B = quantile(E, confidence_level).

    E = F - A is positive when wind is over-forecast, which is what creates shortfalls,
    so the upper quantile of E is the extra capacity needed to cover that risk.
    Slots without a forecast get null values rather than a made-up number.
    """
    errors = series["error_mw"].dropna().to_numpy()
    if errors.size == 0:
        raise InsufficientData("No overlapping actual and forecast data in the selected window.")

    buffer = round(float(np.quantile(errors, confidence_level)), 2)
    forecast = series["forecast_mw"]
    raw_deficit = demand_mw - forecast
    procurement = (raw_deficit + buffer).clip(lower=0)

    return [
        {
            "start_time": to_utc(t.to_pydatetime()),
            "forecast_wind": num(f),
            "demand": demand_mw,
            "raw_deficit": num(d),
            "recommended_procurement": num(p),
            "risk_buffer_mw": buffer,
        }
        for t, f, d, p in zip(series["start_time"], forecast, raw_deficit, procurement)
    ]
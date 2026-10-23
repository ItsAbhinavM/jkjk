from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import (
    RANGE_END,
    RANGE_START,
    HealthResponse,
    MetricsResponse,
    ProcurementRow,
    SeriesPoint,
    SimulateRequest,
)
from app.services import analytics_engine, procurement_engine

router = APIRouter()


def _window(start_date: date, end_date: date) -> tuple[datetime, datetime]:
    """Whole UTC days: [start_date 00:00, end_date + 1 day 00:00)."""
    if start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date must be on or before end_date")
    return datetime.combine(start_date, time.min), datetime.combine(end_date + timedelta(days=1), time.min)


def date_window(
    start_date: date = Query(RANGE_START, ge=RANGE_START, le=RANGE_END),
    end_date: date = Query(RANGE_END, ge=RANGE_START, le=RANGE_END),
) -> tuple[datetime, datetime]:
    return _window(start_date, end_date)


@router.get("/health", response_model=HealthResponse)
def health(db: Session = Depends(get_db)) -> HealthResponse:
    try:
        db.execute(text("SELECT 1"))
        return HealthResponse(status="ok", db_connected=True)
    except SQLAlchemyError:
        return HealthResponse(status="degraded", db_connected=False)


@router.get("/data/series", response_model=list[SeriesPoint])
def get_series(window: tuple[datetime, datetime] = Depends(date_window), db: Session = Depends(get_db)):
    series = analytics_engine.load_series(db, *window)
    return analytics_engine.series_to_records(series)


@router.get("/analytics/metrics", response_model=MetricsResponse)
def get_metrics(window: tuple[datetime, datetime] = Depends(date_window), db: Session = Depends(get_db)):
    series = analytics_engine.load_series(db, *window)
    return analytics_engine.compute_metrics(series)


@router.post("/procurement/simulate", response_model=list[ProcurementRow])
def simulate_procurement(body: SimulateRequest, db: Session = Depends(get_db)):
    series = analytics_engine.load_series(db, *_window(body.start_date, body.end_date))
    try:
        return procurement_engine.simulate(series, body.demand_mw, body.confidence_level)
    except procurement_engine.InsufficientData as exc:
        raise HTTPException(status_code=404, detail=str(exc))
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import settings
from app.db import SessionLocal, get_db, init_db
from app.models import ActualGeneration
from app.schemas import HealthResponse
from app.services.data_processor import run_ingestion

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def _db_is_empty() -> bool:
    with SessionLocal() as db:
        return db.scalar(select(func.count()).select_from(ActualGeneration)) == 0


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Fresh deploys (e.g. an ephemeral container disk) start with an empty DB, so load it in the background.
    if settings.auto_ingest and _db_is_empty():
        app.state.ingest_task = asyncio.create_task(run_ingestion())
    yield


app = FastAPI(title="Wind Forecast Decision Support", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/v1/health", response_model=HealthResponse)
def health(db: Session = Depends(get_db)) -> HealthResponse:
    try:
        db.execute(text("SELECT 1"))
        return HealthResponse(status="ok", db_connected=True)
    except SQLAlchemyError:
        return HealthResponse(status="degraded", db_connected=False)
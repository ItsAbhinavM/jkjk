import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select

from app.api.v1.router import api_router
from app.config import settings
from app.db import SessionLocal, init_db
from app.models import ActualGeneration
from app.services.data_processor import run_ingestion

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def _db_is_empty() -> bool:
    with SessionLocal() as db:
        return db.scalar(select(func.count()).select_from(ActualGeneration)) == 0


def _log_task_failure(task: asyncio.Task) -> None:
    if not task.cancelled() and task.exception():
        logging.getLogger(__name__).error("Background ingestion failed", exc_info=task.exception())


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Fresh deploys (e.g. an ephemeral container disk) start with an empty DB, so load it in the background.
    if settings.auto_ingest and _db_is_empty():
        app.state.ingest_task = asyncio.create_task(run_ingestion())
        app.state.ingest_task.add_done_callback(_log_task_failure)
    yield


app = FastAPI(title="Wind Forecast Decision Support", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex or None,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(api_router)
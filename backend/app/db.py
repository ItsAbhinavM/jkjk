import os
import shutil
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


BUNDLED_DB = Path(__file__).resolve().parent.parent / "data" / "wind.db"


def _database_url() -> str:
    """On Vercel the project files are read-only and nothing persists, so serve a copy of the DB shipped with the code."""
    if os.environ.get("VERCEL") and BUNDLED_DB.exists():
        working_copy = Path("/tmp/wind.db")
        if not working_copy.exists():
            shutil.copyfile(BUNDLED_DB, working_copy)
        return f"sqlite:///{working_copy}"
    return settings.database_url


engine = create_engine(_database_url(), connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False)


def init_db() -> None:
    from app import models  # noqa: F401  (registers the tables on Base)

    Base.metadata.create_all(engine)


def get_db():
    with SessionLocal() as db:
        yield db
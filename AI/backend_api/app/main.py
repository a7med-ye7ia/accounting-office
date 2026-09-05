from fastapi import FastAPI

from app.api.routes import router
from app.core.config import settings
from app.storage.database import init_db


app = FastAPI(title=settings.app_name)


@app.on_event("startup")
def on_startup() -> None:
    settings.runtime_dir.mkdir(parents=True, exist_ok=True)
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(router, prefix="/api/v1")

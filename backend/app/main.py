"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import APP_NAME, APP_VERSION, CORS_ORIGINS
from app.db.database import init_db
from app.routers import health, settings, files, alerts, search, llm, dashboard, actions, requirements, topics, timeline, ai_candidates, change_log, demo


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise the database on startup."""
    init_db()
    yield


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    lifespan=lifespan,
)

# CORS — allow the Vite frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, tags=["health"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])
app.include_router(files.router, prefix="/files", tags=["files"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(llm.router, prefix="/llm", tags=["llm"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(actions.router, prefix="/actions", tags=["actions"])
app.include_router(requirements.router, prefix="/requirements", tags=["requirements"])
app.include_router(topics.router, prefix="/topics", tags=["topics"])
app.include_router(timeline.router, prefix="/timeline", tags=["timeline"])
app.include_router(ai_candidates.router, prefix="/ai", tags=["ai"])
app.include_router(change_log.router, prefix="/change-log", tags=["change-log"])
app.include_router(demo.router, prefix="/demo", tags=["demo"])

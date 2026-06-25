"""Health check endpoint."""

from fastapi import APIRouter

from app.core.config import APP_VERSION

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "customer-knowledge-hub-backend",
        "version": APP_VERSION,
    }

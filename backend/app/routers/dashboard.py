"""Dashboard stats endpoint."""

from fastapi import APIRouter

from app.models.dashboard import DashboardStatsResponse
from app.services.dashboard import get_dashboard_stats

router = APIRouter()


@router.get("/stats", response_model=DashboardStatsResponse)
def dashboard_stats():
    """Return aggregated dashboard stats from files, alerts, and chunks tables."""
    return get_dashboard_stats()

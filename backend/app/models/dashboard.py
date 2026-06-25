"""Pydantic models for the dashboard stats endpoint."""

from pydantic import BaseModel


class LatestFileItem(BaseModel):
    id: int
    name: str
    file_type: str
    category: str
    summary_status: str
    indexed_at: str


class LatestAlertItem(BaseModel):
    id: int
    severity: str
    type: str
    description: str
    source_file: str | None = None
    status: str
    created_at: str


class DashboardStatsResponse(BaseModel):
    files_indexed: int
    files_parsed: int
    files_pending_parse: int
    total_alerts: int
    open_alerts: int
    reviewed_alerts: int
    ignored_alerts: int
    chunks_indexed: int
    open_actions: int = 0
    open_requirements: int = 0
    open_followups: int = 0
    last_indexed_at: str | None = None
    status_label: str
    latest_files: list[LatestFileItem] = []
    latest_alerts: list[LatestAlertItem] = []

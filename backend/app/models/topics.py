"""Pydantic models for tracked topics."""

from pydantic import BaseModel


class TopicSummaryItem(BaseModel):
    topic: str
    files_count: int = 0
    alerts_count: int = 0
    open_actions_count: int = 0
    open_requirements_count: int = 0
    total_items: int = 0
    last_activity_at: str | None = None

"""Pydantic models for timeline events."""

from pydantic import BaseModel


class TimelineEvent(BaseModel):
    id: str
    event_type: str          # file_indexed, file_parsed, file_missing, alert_created, action_created, action_done, requirement_created, requirement_changed
    title: str
    description: str
    source_file: str | None = None
    topic: str | None = None
    status: str | None = None
    severity_or_priority: str | None = None
    occurred_at: str
    related_entity_type: str  # file, alert, action, requirement
    related_entity_id: int

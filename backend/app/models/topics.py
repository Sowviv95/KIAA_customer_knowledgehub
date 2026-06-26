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


class TrackedTopicItem(BaseModel):
    id: int
    name: str
    understanding: str | None = None
    enabled: bool = True
    sort_order: int = 0
    keywords: str | None = None
    created_at: str
    updated_at: str


class TrackedTopicCreate(BaseModel):
    name: str
    understanding: str | None = None
    enabled: bool = True
    sort_order: int = 0
    keywords: str | None = None


class TrackedTopicUpdate(BaseModel):
    name: str | None = None
    understanding: str | None = None
    enabled: bool | None = None
    sort_order: int | None = None
    keywords: str | None = None

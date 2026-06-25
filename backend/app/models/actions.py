"""Pydantic models for actions."""

from pydantic import BaseModel


class ActionItem(BaseModel):
    id: int
    text: str
    owner: str | None = None
    due_date: str | None = None
    priority: str = "Medium"
    status: str = "Open"
    source_file: str | None = None
    excerpt: str | None = None
    created_at: str


class ActionCreate(BaseModel):
    text: str
    owner: str | None = None
    due_date: str | None = None
    priority: str = "Medium"
    status: str = "Open"
    source_file: str | None = None
    excerpt: str | None = None


class ActionUpdate(BaseModel):
    text: str | None = None
    owner: str | None = None
    due_date: str | None = None
    priority: str | None = None
    status: str | None = None
    source_file: str | None = None
    excerpt: str | None = None

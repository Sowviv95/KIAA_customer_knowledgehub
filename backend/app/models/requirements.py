"""Pydantic models for requirements."""

from pydantic import BaseModel


class RequirementItem(BaseModel):
    id: int
    text: str
    status: str = "Open"
    topic: str | None = None
    source_type: str | None = None
    source_file: str | None = None
    excerpt: str | None = None
    updated_at: str


class RequirementCreate(BaseModel):
    text: str
    status: str = "Open"
    topic: str | None = None
    source_type: str | None = None
    source_file: str | None = None
    excerpt: str | None = None


class RequirementUpdate(BaseModel):
    text: str | None = None
    status: str | None = None
    topic: str | None = None
    source_type: str | None = None
    source_file: str | None = None
    excerpt: str | None = None

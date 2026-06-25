"""Pydantic models for alert updates."""

from pydantic import BaseModel


class AlertStatusUpdate(BaseModel):
    status: str  # New, Reviewed, Ignored, Action

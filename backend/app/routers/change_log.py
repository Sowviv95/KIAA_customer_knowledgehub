"""Change log endpoint — customer knowledge event timeline."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.change_log import list_change_events

router = APIRouter()


class ChangeLogEvent(BaseModel):
    id: int
    event_type: str
    title: str
    description: str | None = None
    topic: str | None = None
    source_file: str | None = None
    source_excerpt: str | None = None
    related_type: str | None = None
    related_id: int | None = None
    created_at: str


@router.get("", response_model=list[ChangeLogEvent])
def get_change_log(
    event_type: str | None = None,
    topic: str | None = None,
    related_type: str | None = None,
    limit: int = 50,
):
    """List change log events, newest first."""
    return list_change_events(
        event_type=event_type,
        topic=topic,
        related_type=related_type,
        limit=min(limit, 200),
    )

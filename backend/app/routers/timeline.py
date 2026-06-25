"""Timeline endpoints."""

from fastapi import APIRouter

from app.models.timeline import TimelineEvent
from app.services.timeline import get_timeline_events

router = APIRouter()


@router.get("/events", response_model=list[TimelineEvent])
def timeline_events(
    limit: int = 50,
    topic: str | None = None,
    event_type: str | None = None,
):
    """Return chronological events derived from files, alerts, actions, requirements."""
    return get_timeline_events(limit=limit, topic=topic, event_type=event_type)

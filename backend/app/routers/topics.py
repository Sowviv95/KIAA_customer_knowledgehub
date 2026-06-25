"""Tracked topics endpoints."""

from fastapi import APIRouter

from app.models.topics import TopicSummaryItem
from app.services.topics import get_topic_summary

router = APIRouter()


@router.get("/summary", response_model=list[TopicSummaryItem])
def topic_summary():
    """Return per-topic counts derived from files, alerts, actions, and requirements."""
    return get_topic_summary()

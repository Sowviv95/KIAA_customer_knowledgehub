"""Pydantic models for AI candidate update extraction."""

from pydantic import BaseModel


VALID_UPDATE_TYPES = {
    "requirement", "decision", "open_question",
    "action_item", "scope_change", "risk", "clarification",
}

VALID_CANDIDATE_STATUSES = {"candidate", "accepted", "rejected"}


class AIStatusResponse(BaseModel):
    available: bool
    message: str


class AIExtractionRequest(BaseModel):
    topic: str | None = None
    file_id: int | None = None
    limit_chunks: int = 25


class AIUpdateCandidateItem(BaseModel):
    id: int
    update_type: str
    title: str
    description: str | None = None
    topic: str | None = None
    source_file: str
    source_chunk_id: int | None = None
    evidence_quote: str
    confidence: float | None = None
    status: str
    created_at: str
    reviewed_at: str | None = None
    reviewer_action: str | None = None
    converted_to_type: str | None = None
    converted_to_id: int | None = None
    converted_at: str | None = None


class AIExtractionResponse(BaseModel):
    count_created: int
    count_skipped: int
    candidates: list[AIUpdateCandidateItem]
    error: str | None = None


class AIUpdateCandidateReviewRequest(BaseModel):
    status: str  # "accepted" | "rejected" | "candidate"
    reviewer_action: str | None = None


class AIUpdateCandidateListResponse(BaseModel):
    candidates: list[AIUpdateCandidateItem]
    total: int


class ConvertToRequirementRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    topic: str | None = None


class ConvertToActionRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    topic: str | None = None
    priority: str = "Medium"
    owner: str | None = None
    due_date: str | None = None


class ConversionResponse(BaseModel):
    candidate: AIUpdateCandidateItem
    converted_to_type: str
    converted_to_id: int

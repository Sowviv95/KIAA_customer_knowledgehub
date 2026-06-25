"""Pydantic models for LLM endpoints."""

from pydantic import BaseModel


class LLMStatusResponse(BaseModel):
    provider: str
    configured: bool
    model: str
    key_source: str
    message: str


class EvidenceInput(BaseModel):
    file_name: str
    snippet: str


class GroundedAnswerRequest(BaseModel):
    question: str
    evidence_items: list[EvidenceInput]
    model: str | None = None
    max_tokens: int = 500


class UsageInfo(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class GroundedAnswerResponse(BaseModel):
    answer: str
    model: str
    evidence_count: int
    grounded: bool
    usage: UsageInfo | None = None
    called_api: bool


# --- Production grounded answer (search + LLM in one call) ---


class SourceInfo(BaseModel):
    file_id: int
    file_name: str
    chunk_id: int
    chunk_index: int
    snippet: str
    file_type: str = ""
    category: str = ""
    customer_relevance: str = ""
    token_estimate: int = 0


class GroundedSearchRequest(BaseModel):
    question: str
    search_query: str | None = None
    limit: int = 5
    model: str | None = None
    max_tokens: int = 400


class GroundedSearchResponse(BaseModel):
    answer: str
    grounded: bool
    called_llm: bool
    model: str | None = None
    evidence_count: int
    sources: list[SourceInfo] = []
    usage: UsageInfo | None = None

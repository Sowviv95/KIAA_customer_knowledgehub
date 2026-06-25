"""Pydantic models for search."""

from pydantic import BaseModel


class SearchResultItem(BaseModel):
    chunk_id: int
    file_id: int
    file_name: str
    chunk_index: int
    snippet: str
    file_type: str
    category: str
    customer_relevance: str
    token_estimate: int
    updated_at: str


class SearchResponse(BaseModel):
    query: str
    count: int
    results: list[SearchResultItem]

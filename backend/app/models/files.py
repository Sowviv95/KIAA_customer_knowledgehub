"""Pydantic models for files and scan results."""

from pydantic import BaseModel


class FileRecord(BaseModel):
    id: int
    name: str
    file_path: str
    file_type: str
    category: str
    file_hash: str | None = None
    file_size: int | None = None
    customer_relevance: str = "Reference"
    summary_status: str = "Pending"
    indexed_at: str
    updated_at: str


class ScanSummary(BaseModel):
    scanned: int
    new: int
    changed: int
    unchanged: int
    missing: int = 0
    reclassified: int = 0
    unsupported_skipped: int
    errors: list[str]


class AlertRecord(BaseModel):
    id: int
    severity: str
    type: str
    description: str
    source_file: str | None = None
    source_type: str | None = None
    topic: str | None = None
    status: str = "New"
    excerpt: str | None = None
    created_at: str


class ChunkRecord(BaseModel):
    id: int
    file_id: int
    chunk_index: int
    content: str
    token_count: int | None = None
    created_at: str


class ParseSummary(BaseModel):
    file_id: int
    file_name: str
    status: str
    chunks_created: int
    characters_extracted: int
    warnings: list[str]
    reason: str | None = None


class BulkParseSummary(BaseModel):
    processed: int
    parsed: int
    skipped: int
    failed: int
    chunks_created: int
    errors: list[str]


class FileSummaryItem(BaseModel):
    id: int
    name: str
    file_type: str
    category: str
    customer_relevance: str
    summary_status: str
    indexed_at: str
    updated_at: str
    chunk_count: int = 0
    first_chunk_excerpt: str | None = None
    alert_count: int = 0

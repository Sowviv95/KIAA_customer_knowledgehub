"""Pydantic models for settings."""

from pydantic import BaseModel


class SettingsResponse(BaseModel):
    local_folder_path: str = ""
    token_budget_per_request: int = 80000
    llm_provider: str = "OpenAI GPT-4o"
    embedding_provider: str = "OpenAI text-embedding-3-large"
    mock_mode: bool = True


class SettingsUpdate(BaseModel):
    local_folder_path: str | None = None
    token_budget_per_request: int | None = None
    llm_provider: str | None = None
    embedding_provider: str | None = None
    mock_mode: bool | None = None

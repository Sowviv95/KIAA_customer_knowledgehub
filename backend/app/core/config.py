"""Application configuration."""

import os
from pathlib import Path

# Paths relative to the backend/ directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
INDEXES_DIR = PROJECT_ROOT / "indexes"
CONFIG_DIR = PROJECT_ROOT / "config"

# Database
DB_PATH = DATA_DIR / "customer_knowledge_hub.db"

# App metadata
APP_NAME = "Customer Knowledge Hub Backend"
APP_VERSION = "0.1.0"

# CORS — allow the Vite dev server
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

# LLM — API key is read from environment only, never stored in DB or frontend
DEFAULT_LLM_MODEL = "gpt-4o-mini"


def get_openai_api_key() -> str | None:
    """Read OPENAI_API_KEY from environment. Returns None if not set."""
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    return key if key else None


def is_openai_configured() -> bool:
    """Check whether an OpenAI API key is available."""
    return get_openai_api_key() is not None

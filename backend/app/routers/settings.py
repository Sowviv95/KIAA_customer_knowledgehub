"""Settings endpoints — GET and PUT."""

from fastapi import APIRouter

from app.db.database import get_connection
from app.models.settings import SettingsResponse, SettingsUpdate

router = APIRouter()

SETTING_KEYS = [
    "local_folder_path",
    "token_budget_per_request",
    "llm_provider",
    "embedding_provider",
    "mock_mode",
]


def _rows_to_dict(rows) -> dict[str, str]:
    return {row["key"]: row["value"] for row in rows}


def _dict_to_response(d: dict[str, str]) -> SettingsResponse:
    return SettingsResponse(
        local_folder_path=d.get("local_folder_path", ""),
        token_budget_per_request=int(d.get("token_budget_per_request", "80000")),
        llm_provider=d.get("llm_provider", "OpenAI GPT-4o"),
        embedding_provider=d.get("embedding_provider", "OpenAI text-embedding-3-large"),
        mock_mode=d.get("mock_mode", "true").lower() == "true",
    )


@router.get("", response_model=SettingsResponse)
def get_settings():
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT key, value FROM settings WHERE key IN ({})".format(
                ",".join("?" for _ in SETTING_KEYS)
            ),
            SETTING_KEYS,
        ).fetchall()
        return _dict_to_response(_rows_to_dict(rows))
    finally:
        conn.close()


@router.put("", response_model=SettingsResponse)
def update_settings(update: SettingsUpdate):
    conn = get_connection()
    try:
        updates = {
            k: str(v) if not isinstance(v, bool) else str(v).lower()
            for k, v in update.model_dump(exclude_none=True).items()
        }
        for key, value in updates.items():
            conn.execute(
                "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
                (key, value),
            )
        conn.commit()

        rows = conn.execute(
            "SELECT key, value FROM settings WHERE key IN ({})".format(
                ",".join("?" for _ in SETTING_KEYS)
            ),
            SETTING_KEYS,
        ).fetchall()
        return _dict_to_response(_rows_to_dict(rows))
    finally:
        conn.close()

"""File inventory service — scans a local folder and registers file metadata."""

import hashlib
import os
from datetime import datetime, timezone
from pathlib import Path

from app.db.database import get_connection

# ─── Supported file extensions ────────────────────────────────────────────────

SUPPORTED_EXTENSIONS = {
    ".docx", ".pptx", ".xlsx", ".yaml", ".yml",
    ".txt", ".md", ".pdf", ".csv", ".json",
    ".msg", ".eml",
}

SKIP_DIRS = {
    "node_modules", ".venv", "__pycache__", "dist", ".git",
    ".next", ".cache", "venv", "env", ".tox",
}

# ─── File type classification ─────────────────────────────────────────────────

EXTENSION_TO_FILE_TYPE: dict[str, str] = {
    ".docx": "DOCX", ".pptx": "PPTX", ".xlsx": "XLSX",
    ".yaml": "YAML", ".yml": "YAML", ".json": "JSON",
    ".pdf": "PDF", ".txt": "TXT", ".md": "TXT",
    ".csv": "XLSX", ".msg": "MSG", ".eml": "EML",
}

EXTENSION_TO_CATEGORY: dict[str, str] = {
    ".docx": "Document", ".pptx": "Deck", ".xlsx": "Source List",
    ".yaml": "Schema", ".yml": "Schema", ".json": "Schema",
    ".pdf": "Document", ".txt": "Document", ".md": "Document",
    ".csv": "Source List", ".msg": "Email", ".eml": "Email",
}

# Keywords that override extension-based category to "Meeting Notes"
_MEETING_KEYWORDS = {"meeting", "discovery", "session", "transcript", "call", "steerco", "workshop", "standup", "kickoff"}

# Source type for alerts (maps category to SourceType)
CATEGORY_TO_SOURCE_TYPE: dict[str, str] = {
    "Document": "Document", "Deck": "Deck", "Source List": "Source List",
    "Schema": "Schema", "Email": "Email", "Meeting Notes": "Meeting",
}

# ─── Customer relevance classification ────────────────────────────────────────

_RELEVANCE_KEYWORDS: list[tuple[list[str], str]] = [
    (["rfp", "customer", "lseg", "requirement"], "Customer Provided"),
    (["meeting", "call", "notes", "transcript", "steerco", "onboarding"], "Meeting Note"),
    (["email", "outlook", "msg"], "Email Export"),
    (["schema", "swagger", "api", "openapi"], "Schema"),
    (["source", "data_sources", "list", "coverage", "matrix"], "Source List"),
    (["deck", "presentation", "solution"], "Internal Deck"),
]


def classify_category(file_name: str, extension_category: str) -> str:
    """Override extension-based category using filename keywords.

    Schema and Source List take priority (extension-based).
    Meeting keywords override generic Document/Deck categories.
    """
    if extension_category in ("Schema", "Source List", "Email"):
        return extension_category
    lower = file_name.lower()
    if any(kw in lower for kw in _MEETING_KEYWORDS):
        return "Meeting Notes"
    return extension_category


def classify_relevance(file_name: str, category: str) -> str:
    """Classify customer relevance from filename keywords."""
    lower = file_name.lower()
    for keywords, relevance in _RELEVANCE_KEYWORDS:
        if any(kw in lower for kw in keywords):
            return relevance
    # Fall back to category-based defaults
    if category == "Schema":
        return "Schema"
    if category == "Source List":
        return "Source List"
    if category == "Email":
        return "Email Export"
    if category == "Deck":
        return "Internal Deck"
    return "Reference"


def classify_topic(file_name: str, category: str) -> str | None:
    """Guess a tracked topic from filename keywords."""
    lower = file_name.lower()
    if any(kw in lower for kw in ["schema", "swagger", "api"]):
        return "Schema/API"
    if any(kw in lower for kw in ["source", "data_sources", "coverage"]):
        return "Source List"
    if any(kw in lower for kw in ["sla", "latency", "uptime"]):
        return "SLA"
    if any(kw in lower for kw in ["commercial", "pricing", "proposal"]):
        return "Commercials"
    if any(kw in lower for kw in ["rfp", "scope", "phase"]):
        return "Scope"
    if any(kw in lower for kw in ["monitoring", "cadence", "refresh"]):
        return "Monitoring Cadence"
    return None


# ─── SHA256 hashing ───────────────────────────────────────────────────────────

def file_sha256(path: Path) -> str:
    """Calculate SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


# ─── Scanner ──────────────────────────────────────────────────────────────────

def scan_folder(folder_path: str) -> dict:
    """
    Scan a folder recursively, register files in DB, generate alerts.
    Returns a scan summary dict.
    """
    root = Path(folder_path)
    if not root.is_dir():
        raise ValueError(f"Folder does not exist or is not a directory: {folder_path}")

    new_count = 0
    changed_count = 0
    unchanged_count = 0
    skipped_count = 0
    errors: list[str] = []
    scanned_paths: list[str] = []

    conn = get_connection()
    try:
        for dirpath, dirnames, filenames in os.walk(root):
            # Skip excluded directories in-place
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

            for fname in filenames:
                full_path = Path(dirpath) / fname
                ext = full_path.suffix.lower()

                if ext not in SUPPORTED_EXTENSIONS:
                    skipped_count += 1
                    continue

                try:
                    stat = full_path.stat()
                    sha = file_sha256(full_path)
                    file_type = EXTENSION_TO_FILE_TYPE.get(ext, "TXT")
                    category = classify_category(fname, EXTENSION_TO_CATEGORY.get(ext, "Document"))
                    relevance = classify_relevance(fname, category)
                    topic = classify_topic(fname, category)
                    path_str = str(full_path)
                    modified_at = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
                    now = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

                    # Check if file already exists by path
                    existing = conn.execute(
                        "SELECT id, file_hash FROM files WHERE file_path = ?",
                        (path_str,),
                    ).fetchone()

                    if existing is None:
                        # New file
                        conn.execute(
                            """INSERT INTO files (name, file_path, file_type, category, file_hash,
                               file_size, customer_relevance, summary_status, indexed_at, updated_at)
                               VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)""",
                            (fname, path_str, file_type, category, sha,
                             stat.st_size, relevance, now, now),
                        )
                        new_count += 1
                        _create_alert(conn, "new", fname, path_str, category, topic)
                    elif existing["file_hash"] != sha:
                        # Changed file
                        conn.execute(
                            """UPDATE files SET file_hash = ?, file_size = ?, file_type = ?,
                               category = ?, customer_relevance = ?, updated_at = ?
                               WHERE id = ?""",
                            (sha, stat.st_size, file_type, category, relevance, now, existing["id"]),
                        )
                        changed_count += 1
                        _create_alert(conn, "changed", fname, path_str, category, topic)
                    else:
                        unchanged_count += 1

                    scanned_paths.append(path_str)

                except Exception as e:
                    errors.append(f"{fname}: {str(e)}")

        # ── Detect stale/missing files ────────────────────────────────────
        missing_count = 0
        scanned_set = set(scanned_paths)
        all_db_files = conn.execute("SELECT id, file_path, summary_status FROM files").fetchall()
        for db_row in all_db_files:
            if db_row["file_path"] not in scanned_set:
                if not Path(db_row["file_path"]).exists():
                    if db_row["summary_status"] != "Missing":
                        conn.execute(
                            "UPDATE files SET summary_status = 'Missing', updated_at = ? WHERE id = ?",
                            (datetime.now(tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S"), db_row["id"]),
                        )
                        missing_count += 1
                else:
                    # File exists but outside the scan root — leave unchanged
                    pass

        # ── Reclassify unchanged files that may benefit from improved rules ──
        reclassified_count = 0
        for db_row in all_db_files:
            if db_row["file_path"] in scanned_set:
                p = Path(db_row["file_path"])
                fname = p.name
                ext = p.suffix.lower()
                new_cat = classify_category(fname, EXTENSION_TO_CATEGORY.get(ext, "Document"))
                existing_full = conn.execute(
                    "SELECT id, category, customer_relevance FROM files WHERE id = ?",
                    (db_row["id"],),
                ).fetchone()
                if existing_full and existing_full["category"] != new_cat:
                    new_rel = classify_relevance(fname, new_cat)
                    conn.execute(
                        "UPDATE files SET category = ?, customer_relevance = ? WHERE id = ?",
                        (new_cat, new_rel, db_row["id"]),
                    )
                    reclassified_count += 1

        conn.commit()
    finally:
        conn.close()

    return {
        "scanned": new_count + changed_count + unchanged_count,
        "new": new_count,
        "changed": changed_count,
        "unchanged": unchanged_count,
        "missing": missing_count,
        "reclassified": reclassified_count,
        "unsupported_skipped": skipped_count,
        "errors": errors,
    }


def _create_alert(
    conn,
    change_type: str,  # "new" or "changed"
    file_name: str,
    file_path: str,
    category: str,
    topic: str | None,
) -> None:
    """Insert an alert row for a new or changed file."""
    source_type = CATEGORY_TO_SOURCE_TYPE.get(category, "Document")

    if category == "Schema":
        alert_type = "Schema/API Update Detected"
        severity = "High"
        desc = f"{'New' if change_type == 'new' else 'Updated'} schema file detected: {file_name}"
    elif category == "Source List":
        alert_type = "Source List Changed"
        severity = "High" if change_type == "changed" else "Medium"
        desc = f"{'New' if change_type == 'new' else 'Updated'} source list: {file_name}"
    elif category == "Meeting Notes":
        alert_type = "New Meeting Note Added"
        severity = "Medium"
        desc = f"{'New' if change_type == 'new' else 'Updated'} meeting note: {file_name}"
    elif change_type == "new":
        alert_type = "New Customer File Added"
        severity = "Medium"
        desc = f"New file added: {file_name}"
    else:
        alert_type = "Customer Document Changed"
        severity = "Medium"
        desc = f"File updated: {file_name}"

    conn.execute(
        """INSERT INTO alerts (severity, type, description, source_file, source_type, topic, status, excerpt)
           VALUES (?, ?, ?, ?, ?, ?, 'New', ?)""",
        (severity, alert_type, desc, file_name, source_type, topic or "",
         f"File: {file_name} ({category})"),
    )

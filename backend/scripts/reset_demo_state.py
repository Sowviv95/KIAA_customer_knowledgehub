#!/usr/bin/env python3
"""Reset generated demo artifacts without deleting source files or parsed chunks.

Usage:
    python -m scripts.reset_demo_state                     # AI candidates + change log only
    python -m scripts.reset_demo_state --include-actions    # also clear actions
    python -m scripts.reset_demo_state --include-requirements  # also clear requirements
    python -m scripts.reset_demo_state --include-alerts     # also clear alerts
    python -m scripts.reset_demo_state --all                # clear all generated artifacts

Run from the backend/ directory.

NEVER deletes: files, chunks, chunks_fts, settings, chat_sessions, chat_messages.
"""

import argparse
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.database import get_connection


def count_table(conn, table: str) -> int:
    return conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]


def clear_table(conn, table: str, label: str) -> int:
    before = count_table(conn, table)
    if before > 0:
        conn.execute(f"DELETE FROM {table}")
    return before


def main():
    parser = argparse.ArgumentParser(description="Reset demo state for Customer Knowledge Hub")
    parser.add_argument("--include-actions", action="store_true", help="Also clear actions/follow-ups")
    parser.add_argument("--include-requirements", action="store_true", help="Also clear requirements")
    parser.add_argument("--include-alerts", action="store_true", help="Also clear alerts")
    parser.add_argument("--all", action="store_true", help="Clear all generated artifacts")
    args = parser.parse_args()

    if args.all:
        args.include_actions = True
        args.include_requirements = True
        args.include_alerts = True

    conn = get_connection()
    try:
        print("=== Demo State Reset ===\n")
        print("Before:")
        tables = [
            ("ai_update_candidates", "AI candidates"),
            ("customer_change_log", "Change log events"),
        ]
        if args.include_actions:
            tables.append(("actions", "Actions/follow-ups"))
        if args.include_requirements:
            tables.append(("requirements", "Requirements"))
        if args.include_alerts:
            tables.append(("alerts", "Alerts"))

        for table, label in tables:
            print(f"  {label}: {count_table(conn, table)}")

        print("\nClearing...")
        cleared = {}
        for table, label in tables:
            cleared[label] = clear_table(conn, table, label)

        conn.commit()

        print("\nCleared:")
        for label, count in cleared.items():
            print(f"  {label}: {count} removed")

        print("\nPreserved:")
        print(f"  Files: {count_table(conn, 'files')}")
        print(f"  Chunks: {count_table(conn, 'chunks')}")
        print(f"  Settings: {count_table(conn, 'settings')}")

        print("\nDone. Source files and parsed chunks are untouched.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()

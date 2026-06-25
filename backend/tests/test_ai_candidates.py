"""Tests for AI candidate update extraction endpoints."""

import json
import pytest


class TestAIStatus:
    def test_status_without_key(self, client, monkeypatch):
        """LLM unavailable returns clean status."""
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        resp = client.get("/ai/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["available"] is False
        assert "not configured" in data["message"]

    def test_status_with_key(self, client, monkeypatch):
        """LLM available when key is set."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-fake-key")
        resp = client.get("/ai/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["available"] is True


class TestExtraction:
    def test_extract_without_key(self, client, monkeypatch):
        """Extraction without LLM key returns error, not crash."""
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        resp = client.post("/ai/candidates/extract", json={})
        assert resp.status_code == 201
        data = resp.json()
        assert data["count_created"] == 0
        assert data["error"] is not None
        assert "not configured" in data["error"]


class TestCandidateValidation:
    def test_skips_invalid_update_type(self):
        """Candidates with invalid update_type are skipped."""
        from app.services.ai_update_extraction import _validate_candidate
        result = _validate_candidate(
            {"update_type": "invalid_type", "title": "Test", "evidence_quote": "quote", "source_file": "file.docx"},
            {},
        )
        assert result is None

    def test_skips_missing_evidence_quote(self):
        """Candidates without evidence_quote are skipped."""
        from app.services.ai_update_extraction import _validate_candidate
        result = _validate_candidate(
            {"update_type": "requirement", "title": "Test", "evidence_quote": "", "source_file": "file.docx"},
            {},
        )
        assert result is None

    def test_skips_missing_source_file(self):
        """Candidates without source_file are skipped."""
        from app.services.ai_update_extraction import _validate_candidate
        result = _validate_candidate(
            {"update_type": "requirement", "title": "Test", "evidence_quote": "some quote", "source_file": ""},
            {},
        )
        assert result is None

    def test_skips_unlinked_chunk(self):
        """Candidates that can't be tied to a provided chunk are skipped."""
        from app.services.ai_update_extraction import _validate_candidate
        result = _validate_candidate(
            {"update_type": "requirement", "title": "Test", "evidence_quote": "quote",
             "source_file": "unknown.docx", "source_chunk_id": 999},
            {1: {"file_name": "other.docx"}},
        )
        assert result is None

    def test_valid_candidate_passes(self):
        """Valid candidate passes validation."""
        from app.services.ai_update_extraction import _validate_candidate
        result = _validate_candidate(
            {"update_type": "requirement", "title": "API Latency", "description": "Under 500ms",
             "evidence_quote": "API latency must be under 500ms", "source_file": "notes.docx",
             "source_chunk_id": 1, "confidence": 0.9, "topic": "Schema/API"},
            {1: {"file_name": "notes.docx"}},
        )
        assert result is not None
        assert result["update_type"] == "requirement"
        assert result["confidence"] == 0.9


class TestReviewEndpoint:
    def test_review_changes_status(self, client, seeded_chunks):
        """Review endpoint changes candidate status only."""
        from app.db.database import get_connection
        conn = get_connection()
        try:
            conn.execute(
                """INSERT INTO ai_update_candidates
                   (update_type, title, source_file, evidence_quote, status, created_at)
                   VALUES ('requirement', 'Test req', 'test.docx', 'Some quote', 'candidate', datetime('now'))""",
            )
            conn.commit()
            cand_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        finally:
            conn.close()

        # Accept
        resp = client.patch(f"/ai/candidates/{cand_id}/review", json={"status": "accepted"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "accepted"
        assert data["reviewed_at"] is not None

        # Verify no action or requirement was created
        conn = get_connection()
        try:
            actions = conn.execute("SELECT COUNT(*) FROM actions").fetchone()[0]
            reqs = conn.execute("SELECT COUNT(*) FROM requirements").fetchone()[0]
            assert actions == 0, "Accept must NOT auto-create actions"
            assert reqs == 0, "Accept must NOT auto-create requirements"
        finally:
            conn.close()

    def test_reject_candidate(self, client, seeded_chunks):
        """Reject updates status without creating records."""
        from app.db.database import get_connection
        conn = get_connection()
        try:
            conn.execute(
                """INSERT INTO ai_update_candidates
                   (update_type, title, source_file, evidence_quote, status, created_at)
                   VALUES ('decision', 'Test decision', 'test.docx', 'Evidence quote', 'candidate', datetime('now'))""",
            )
            conn.commit()
            cand_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        finally:
            conn.close()

        resp = client.patch(f"/ai/candidates/{cand_id}/review", json={"status": "rejected"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejected"

    def test_invalid_status(self, client):
        """Invalid status returns 400."""
        resp = client.patch("/ai/candidates/1/review", json={"status": "invalid"})
        assert resp.status_code == 400

    def test_not_found(self, client):
        """Non-existent candidate returns 404."""
        resp = client.patch("/ai/candidates/9999/review", json={"status": "accepted"})
        assert resp.status_code == 404


class TestListCandidates:
    def test_list_returns_ok(self, client):
        """List endpoint returns 200 with valid structure."""
        resp = client.get("/ai/candidates")
        assert resp.status_code == 200
        data = resp.json()
        assert "candidates" in data
        assert "total" in data
        assert isinstance(data["candidates"], list)

    def test_list_with_filter(self, client):
        """List with status filter works."""
        from app.db.database import get_connection
        conn = get_connection()
        try:
            conn.execute(
                """INSERT INTO ai_update_candidates
                   (update_type, title, source_file, evidence_quote, status, created_at)
                   VALUES ('risk', 'Test risk', 'test.docx', 'Quote', 'candidate', datetime('now'))""",
            )
            conn.execute(
                """INSERT INTO ai_update_candidates
                   (update_type, title, source_file, evidence_quote, status, created_at)
                   VALUES ('decision', 'Accepted one', 'test.docx', 'Quote 2', 'accepted', datetime('now'))""",
            )
            conn.commit()
        finally:
            conn.close()

        resp = client.get("/ai/candidates?status=candidate")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["candidates"][0]["status"] == "candidate"


class TestConversion:
    """Tests for candidate-to-requirement/action conversion."""

    def _insert_candidate(self, status="accepted"):
        from app.db.database import get_connection
        conn = get_connection()
        try:
            conn.execute(
                """INSERT INTO ai_update_candidates
                   (update_type, title, description, topic, source_file, evidence_quote, status, created_at)
                   VALUES ('requirement', 'API Latency SLA', 'Must be under 500ms', 'Schema/API',
                           'meeting_notes.docx', 'API latency must be under 500ms p99', ?, datetime('now'))""",
                (status,),
            )
            conn.commit()
            return conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        finally:
            conn.close()

    def test_accept_does_not_create_requirement(self, client):
        """Accepting a candidate must NOT auto-create a requirement."""
        cand_id = self._insert_candidate(status="candidate")
        client.patch(f"/ai/candidates/{cand_id}/review", json={"status": "accepted"})

        from app.db.database import get_connection
        conn = get_connection()
        try:
            assert conn.execute("SELECT COUNT(*) FROM requirements").fetchone()[0] == 0
            assert conn.execute("SELECT COUNT(*) FROM actions").fetchone()[0] == 0
        finally:
            conn.close()

    def test_accept_does_not_create_action(self, client):
        """Accepting a candidate must NOT auto-create an action."""
        cand_id = self._insert_candidate(status="candidate")
        client.patch(f"/ai/candidates/{cand_id}/review", json={"status": "accepted"})

        from app.db.database import get_connection
        conn = get_connection()
        try:
            assert conn.execute("SELECT COUNT(*) FROM actions").fetchone()[0] == 0
        finally:
            conn.close()

    def test_cannot_convert_candidate_status(self, client):
        """Cannot convert a candidate that is still in 'candidate' status."""
        cand_id = self._insert_candidate(status="candidate")
        resp = client.post(f"/ai/candidates/{cand_id}/convert-to-requirement", json={})
        assert resp.status_code == 400
        assert "accepted" in resp.json()["detail"].lower()

    def test_cannot_convert_rejected(self, client):
        """Cannot convert a rejected candidate."""
        cand_id = self._insert_candidate(status="rejected")
        resp = client.post(f"/ai/candidates/{cand_id}/convert-to-requirement", json={})
        assert resp.status_code == 400

    def test_cannot_convert_twice(self, client):
        """Cannot convert the same candidate twice."""
        cand_id = self._insert_candidate(status="accepted")
        resp1 = client.post(f"/ai/candidates/{cand_id}/convert-to-requirement", json={})
        assert resp1.status_code == 201

        resp2 = client.post(f"/ai/candidates/{cand_id}/convert-to-action", json={})
        assert resp2.status_code == 400
        assert "already" in resp2.json()["detail"].lower()

    def test_convert_to_requirement_creates_one(self, client):
        """Converting to requirement creates exactly one requirement with lineage."""
        from app.db.database import get_connection
        conn = get_connection()
        reqs_before = conn.execute("SELECT COUNT(*) FROM requirements").fetchone()[0]
        actions_before = conn.execute("SELECT COUNT(*) FROM actions").fetchone()[0]
        conn.close()

        cand_id = self._insert_candidate(status="accepted")
        resp = client.post(f"/ai/candidates/{cand_id}/convert-to-requirement", json={
            "title": "Custom title",
            "topic": "SLA",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["converted_to_type"] == "requirement"
        req_id = data["converted_to_id"]

        conn = get_connection()
        try:
            req = conn.execute("SELECT * FROM requirements WHERE id = ?", (req_id,)).fetchone()
            assert req is not None
            assert "Custom title" in req["text"]
            assert req["topic"] == "SLA"
            assert req["source_file"] == "meeting_notes.docx"
            assert "500ms" in req["excerpt"]
            assert req["status"] == "Open"

            # Exactly one new requirement, no new actions
            assert conn.execute("SELECT COUNT(*) FROM requirements").fetchone()[0] == reqs_before + 1
            assert conn.execute("SELECT COUNT(*) FROM actions").fetchone()[0] == actions_before
        finally:
            conn.close()

    def test_convert_to_action_creates_one(self, client):
        """Converting to action creates exactly one action with lineage."""
        from app.db.database import get_connection
        conn = get_connection()
        actions_before = conn.execute("SELECT COUNT(*) FROM actions").fetchone()[0]
        reqs_before = conn.execute("SELECT COUNT(*) FROM requirements").fetchone()[0]
        conn.close()

        cand_id = self._insert_candidate(status="accepted")
        resp = client.post(f"/ai/candidates/{cand_id}/convert-to-action", json={
            "title": "Follow up on SLA",
            "priority": "High",
            "owner": "John",
            "due_date": "2026-07-15",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["converted_to_type"] == "action"
        action_id = data["converted_to_id"]

        conn = get_connection()
        try:
            action = conn.execute("SELECT * FROM actions WHERE id = ?", (action_id,)).fetchone()
            assert action is not None
            assert "Follow up on SLA" in action["text"]
            assert action["priority"] == "High"
            assert action["owner"] == "John"
            assert action["due_date"] == "2026-07-15"
            assert action["source_file"] == "meeting_notes.docx"
            assert "500ms" in action["excerpt"]
            assert action["status"] == "Open"

            # Exactly one new action, no new requirements
            assert conn.execute("SELECT COUNT(*) FROM actions").fetchone()[0] == actions_before + 1
            assert conn.execute("SELECT COUNT(*) FROM requirements").fetchone()[0] == reqs_before
        finally:
            conn.close()

    def test_candidate_conversion_fields_updated(self, client):
        """After conversion, candidate row has conversion tracking fields."""
        cand_id = self._insert_candidate(status="accepted")
        resp = client.post(f"/ai/candidates/{cand_id}/convert-to-requirement", json={})
        assert resp.status_code == 201
        data = resp.json()

        candidate = data["candidate"]
        assert candidate["converted_to_type"] == "requirement"
        assert candidate["converted_to_id"] is not None
        assert candidate["converted_at"] is not None

    def test_convert_not_found(self, client):
        """Converting non-existent candidate returns 404."""
        resp = client.post("/ai/candidates/9999/convert-to-requirement", json={})
        assert resp.status_code == 404

    def test_convert_uses_candidate_defaults(self, client):
        """When no overrides given, conversion uses candidate title+description and topic."""
        cand_id = self._insert_candidate(status="accepted")
        resp = client.post(f"/ai/candidates/{cand_id}/convert-to-requirement", json={})
        assert resp.status_code == 201

        from app.db.database import get_connection
        conn = get_connection()
        try:
            req = conn.execute("SELECT * FROM requirements WHERE id = ?",
                               (resp.json()["converted_to_id"],)).fetchone()
            # Title + description combined
            assert "API Latency SLA" in req["text"]
            assert "Must be under 500ms" in req["text"]
            assert req["topic"] == "Schema/API"
        finally:
            conn.close()

    def test_convert_preserves_description_in_requirement(self, client):
        """Conversion builds requirement text from title + description."""
        cand_id = self._insert_candidate(status="accepted")
        resp = client.post(f"/ai/candidates/{cand_id}/convert-to-requirement", json={
            "title": "Custom Title",
            "description": "Detailed explanation here",
        })
        assert resp.status_code == 201

        from app.db.database import get_connection
        conn = get_connection()
        try:
            req = conn.execute("SELECT * FROM requirements WHERE id = ?",
                               (resp.json()["converted_to_id"],)).fetchone()
            assert req["text"] == "Custom Title\n\nDetailed explanation here"
        finally:
            conn.close()

    def test_convert_preserves_description_in_action(self, client):
        """Conversion builds action text from title + description."""
        cand_id = self._insert_candidate(status="accepted")
        resp = client.post(f"/ai/candidates/{cand_id}/convert-to-action", json={
            "title": "Follow up on SLA",
            "description": "Need to verify with customer",
        })
        assert resp.status_code == 201

        from app.db.database import get_connection
        conn = get_connection()
        try:
            action = conn.execute("SELECT * FROM actions WHERE id = ?",
                                  (resp.json()["converted_to_id"],)).fetchone()
            assert action["text"] == "Follow up on SLA\n\nNeed to verify with customer"
        finally:
            conn.close()

    def test_convert_source_type_inferred_from_meeting(self, client):
        """Source type inferred as 'Meeting' when file is categorized as Meeting Notes."""
        from app.db.database import get_connection
        conn = get_connection()
        try:
            conn.execute(
                "INSERT INTO files (name, file_path, file_type, category, customer_relevance) VALUES (?, ?, ?, ?, ?)",
                ("meeting_notes.docx", "/test/meeting_notes.docx", "DOCX", "Meeting Notes", "Meeting Note"),
            )
            conn.commit()
        finally:
            conn.close()

        cand_id = self._insert_candidate(status="accepted")
        resp = client.post(f"/ai/candidates/{cand_id}/convert-to-requirement", json={})
        assert resp.status_code == 201

        conn = get_connection()
        try:
            req = conn.execute("SELECT * FROM requirements WHERE id = ?",
                               (resp.json()["converted_to_id"],)).fetchone()
            assert req["source_type"] == "Meeting"
        finally:
            conn.close()

    def test_convert_source_type_fallback_document(self, client):
        """Source type falls back to 'Document' when file not found in files table."""
        from app.db.database import get_connection
        # Insert candidate with a file name not in the files table
        conn = get_connection()
        try:
            conn.execute(
                """INSERT INTO ai_update_candidates
                   (update_type, title, description, topic, source_file, evidence_quote, status, created_at)
                   VALUES ('requirement', 'Test', 'Desc', 'Topic', 'unknown_file.pdf', 'Evidence quote', 'accepted', datetime('now'))""",
            )
            conn.commit()
            cand_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        finally:
            conn.close()

        resp = client.post(f"/ai/candidates/{cand_id}/convert-to-requirement", json={})
        assert resp.status_code == 201

        conn = get_connection()
        try:
            req = conn.execute("SELECT * FROM requirements WHERE id = ?",
                               (resp.json()["converted_to_id"],)).fetchone()
            assert req["source_type"] == "Document"
        finally:
            conn.close()

    def test_converted_response_includes_fields(self, client):
        """Converted candidate response includes all conversion tracking fields."""
        cand_id = self._insert_candidate(status="accepted")
        resp = client.post(f"/ai/candidates/{cand_id}/convert-to-action", json={})
        assert resp.status_code == 201
        data = resp.json()

        assert data["converted_to_type"] == "action"
        assert data["converted_to_id"] is not None
        cand = data["candidate"]
        assert cand["converted_to_type"] == "action"
        assert cand["converted_to_id"] == data["converted_to_id"]
        assert cand["converted_at"] is not None


class TestChangeLog:
    """Tests for the customer change log."""

    def test_change_log_table_created(self, client):
        """Change log table exists after DB init."""
        from app.db.database import get_connection
        conn = get_connection()
        try:
            tables = [r[0] for r in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()]
            assert "customer_change_log" in tables
        finally:
            conn.close()

    def test_get_change_log_empty(self, client):
        """GET /change-log returns empty list when no events."""
        resp = client.get("/change-log")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_change_log_newest_first(self, client):
        """Change log returns events newest first."""
        from app.services.change_log import record_change_event
        record_change_event(event_type="requirement_created", title="First")
        record_change_event(event_type="action_created", title="Second")

        resp = client.get("/change-log")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 2
        assert data[0]["title"] == "Second"
        assert data[1]["title"] == "First"

    def test_candidate_accepted_creates_log(self, client):
        """Accepting a candidate creates a change log event."""
        from app.db.database import get_connection
        conn = get_connection()
        try:
            conn.execute(
                """INSERT INTO ai_update_candidates
                   (update_type, title, source_file, evidence_quote, status, created_at)
                   VALUES ('requirement', 'Log Test', 'test.docx', 'Quote', 'candidate', datetime('now'))""",
            )
            conn.commit()
            cand_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        finally:
            conn.close()

        client.patch(f"/ai/candidates/{cand_id}/review", json={"status": "accepted"})

        resp = client.get("/change-log?event_type=candidate_accepted")
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["event_type"] == "candidate_accepted"
        assert data[0]["title"] == "Log Test"

    def test_candidate_rejected_creates_log(self, client):
        """Rejecting a candidate creates a change log event."""
        from app.db.database import get_connection
        conn = get_connection()
        try:
            conn.execute(
                """INSERT INTO ai_update_candidates
                   (update_type, title, source_file, evidence_quote, status, created_at)
                   VALUES ('risk', 'Reject Test', 'test.docx', 'Quote', 'candidate', datetime('now'))""",
            )
            conn.commit()
            cand_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        finally:
            conn.close()

        client.patch(f"/ai/candidates/{cand_id}/review", json={"status": "rejected"})

        resp = client.get("/change-log?event_type=candidate_rejected")
        data = resp.json()
        assert any(e["title"] == "Reject Test" for e in data)

    def test_conversion_creates_log(self, client):
        """Converting a candidate creates a change log event."""
        from app.db.database import get_connection
        conn = get_connection()
        try:
            conn.execute(
                """INSERT INTO ai_update_candidates
                   (update_type, title, description, source_file, evidence_quote, status, created_at)
                   VALUES ('requirement', 'Convert Log', 'Desc', 'test.docx', 'Quote', 'accepted', datetime('now'))""",
            )
            conn.commit()
            cand_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        finally:
            conn.close()

        client.post(f"/ai/candidates/{cand_id}/convert-to-requirement", json={})

        resp = client.get("/change-log?event_type=candidate_converted_to_requirement")
        data = resp.json()
        assert any(e["title"] == "Convert Log" for e in data)
        assert any(e["related_type"] == "requirement" for e in data)

    def test_manual_requirement_creates_log(self, client):
        """Creating a requirement manually records a change log event."""
        client.post("/requirements", json={"text": "Manual req test", "status": "Open"})

        resp = client.get("/change-log?event_type=requirement_created")
        data = resp.json()
        assert any(e["title"] == "Manual req test" for e in data)

    def test_manual_action_creates_log(self, client):
        """Creating an action manually records a change log event."""
        client.post("/actions", json={"text": "Manual action test"})

        resp = client.get("/change-log?event_type=action_created")
        data = resp.json()
        assert any(e["title"] == "Manual action test" for e in data)

    def test_change_log_filter_by_event_type(self, client):
        """Change log filters by event_type."""
        from app.services.change_log import record_change_event
        record_change_event(event_type="requirement_created", title="R1")
        record_change_event(event_type="action_created", title="A1")

        resp = client.get("/change-log?event_type=action_created")
        data = resp.json()
        assert all(e["event_type"] == "action_created" for e in data)


class TestExistingEndpoints:
    """Ensure existing endpoints still work after changes."""

    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_dashboard_stats(self, client):
        resp = client.get("/dashboard/stats")
        assert resp.status_code == 200

    def test_alerts_list(self, client):
        resp = client.get("/alerts")
        assert resp.status_code == 200

    def test_files_list(self, client):
        resp = client.get("/files")
        assert resp.status_code == 200

    def test_change_log_endpoint(self, client):
        resp = client.get("/change-log")
        assert resp.status_code == 200

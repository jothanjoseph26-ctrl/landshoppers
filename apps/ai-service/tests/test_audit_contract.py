from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.schemas.audit import AiAuditRecord


def _schema_path() -> Path:
    return Path(__file__).resolve().parents[1] / "schemas" / "json" / "ai-audit.record.json"


def test_ai_audit_json_schema_file_exists() -> None:
    path = _schema_path()
    assert path.is_file(), "run: PYTHONPATH=apps/ai-service python app/scripts/export_schemas.py"


def test_audit_record_validates_response_audit_summary(client: TestClient) -> None:
    """Embedded audit summaries must match AiAuditRecord field semantics."""
    fixture_dir = Path(__file__).parent / "fixtures"
    payload = json.loads((fixture_dir / "extract_luxury_duplex.json").read_text(encoding="utf-8"))
    r = client.post("/extract-listing", json=payload)
    assert r.status_code == 200
    data = r.json()
    audit = data["audit"]
    record = AiAuditRecord(
        endpoint="/extract-listing",
        model=data["model"],
        promptTokens=audit["promptTokens"],
        completionTokens=audit["completionTokens"],
        totalTokens=audit["totalTokens"],
        costUsd=audit["costUsd"],
        durationMs=audit["durationMs"],
        status=audit["status"],
        errorMessage=None,
        requestPayload=payload,
        responsePayload=data,
    )
    assert record.totalTokens >= audit["promptTokens"] + audit["completionTokens"]


def test_audit_schema_matches_pydantic_roundtrip() -> None:
    schema = json.loads(_schema_path().read_text(encoding="utf-8"))
    assert schema.get("$defs") is not None or schema.get("properties") is not None
    sample = {
        "endpoint": "/extract-listing",
        "model": "fixture-deterministic-v1",
        "promptTokens": 10,
        "completionTokens": 20,
        "totalTokens": 30,
        "costUsd": 0.0,
        "durationMs": 5,
        "status": "success",
        "errorMessage": None,
        "requestPayload": {"messageId": "x"},
        "responsePayload": {"ok": True},
    }
    validated = AiAuditRecord.model_validate(sample)
    assert validated.model_dump(mode="json")["endpoint"] == "/extract-listing"

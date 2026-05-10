from __future__ import annotations

import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

from app.schemas.audit import AiAuditRecord


def _audit_schema() -> dict:
    path = Path(__file__).resolve().parents[1] / "schemas" / "json" / "ai-audit.record.json"
    return json.loads(path.read_text(encoding="utf-8"))


def test_exported_ai_audit_schema_is_valid_json_schema() -> None:
    schema = _audit_schema()
    Draft202012Validator.check_schema(schema)


@pytest.mark.parametrize(
    "sample",
    [
        {
            "endpoint": "/extract-listing",
            "model": "fixture-deterministic-v1",
            "promptTokens": 10,
            "completionTokens": 20,
            "totalTokens": 30,
            "costUsd": 0.0,
            "durationMs": 12,
            "status": "success",
            "errorMessage": None,
            "requestPayload": {"messageId": "x"},
            "responsePayload": {"ok": True},
        },
        {
            "endpoint": "/generate-seo-variants",
            "model": "fixture-deterministic-v1",
            "promptTokens": 0,
            "completionTokens": 0,
            "totalTokens": 0,
            "costUsd": 0.0,
            "durationMs": 1,
            "status": "error",
            "errorMessage": "rate_limited",
            "requestPayload": None,
            "responsePayload": None,
        },
    ],
)
def test_ai_audit_record_validates_against_exported_json_schema(sample: dict) -> None:
    schema = _audit_schema()
    validator = Draft202012Validator(schema)
    record = AiAuditRecord.model_validate(sample)
    dumped = record.model_dump(mode="json")
    validator.validate(dumped)

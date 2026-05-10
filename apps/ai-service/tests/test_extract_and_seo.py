from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient


FIXTURES = Path(__file__).parent / "fixtures"


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"


def test_extract_schema_fixture(client: TestClient) -> None:
    payload = json.loads((FIXTURES / "extract_luxury_duplex.json").read_text(encoding="utf-8"))
    r = client.post("/extract-listing", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "confidence" in data and 0 <= data["confidence"] <= 1
    assert data["requiresHumanReview"] is False
    assert data["property"]["city"] == "Lagos"
    assert data["listing"]["price"] > 0
    assert data["audit"]["totalTokens"] > 0


def test_extract_short_text_requires_review(client: TestClient) -> None:
    payload = json.loads((FIXTURES / "extract_short_text.json").read_text(encoding="utf-8"))
    r = client.post("/extract-listing", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert len(payload["textContent"] or "") < 40
    assert data["requiresHumanReview"] is True


def test_extract_duplicate_ref(client: TestClient) -> None:
    payload = json.loads((FIXTURES / "extract_duplicate.json").read_text(encoding="utf-8"))
    dup_id = "550e8400-e29b-41d4-a716-446655440000"
    r = client.post("/extract-listing", json=payload)
    assert r.status_code == 200
    assert r.json()["duplicateOfMessageId"] == dup_id


def test_seo_ten_variants(client: TestClient) -> None:
    payload = json.loads((FIXTURES / "seo_waterfront.json").read_text(encoding="utf-8"))
    r = client.post("/generate-seo-variants", json=payload)
    assert r.status_code == 200
    data = r.json()
    types = {v["variantType"] for v in data["variants"]}
    assert len(types) == 10
    assert data["listingId"] == payload["listingId"]

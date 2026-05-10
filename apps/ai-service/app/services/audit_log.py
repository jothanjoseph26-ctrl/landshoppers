from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from app.config import Settings
from app.schemas.audit import AiAuditRecord

logger = logging.getLogger("landshoppers.ai.audit")


def _sanitize_payload(payload: dict[str, Any] | None) -> dict[str, Any] | None:
    if payload is None:
        return None
    # Drop obvious PII keys if present (webhook may forward bodies).
    redacted = dict(payload)
    for k in ("password", "passwordHash", "token", "authorization", "senderPhone"):
        if k in redacted:
            redacted[k] = "[redacted]"
    return redacted


def emit_audit(record: AiAuditRecord, settings: Settings) -> None:
    """Structured log line + optional Postgres insert.

    Log envelope fields align with `AiAuditRecord` / `schemas/json/ai-audit.record.json`.
    """
    line = {
        "type": "ai_request_audit",
        "endpoint": record.endpoint,
        "model": record.model,
        "totalTokens": record.totalTokens,
        "costUsd": record.costUsd,
        "durationMs": record.durationMs,
        "status": record.status,
    }
    logger.info(json.dumps(line))

    if not settings.audit_to_db or not settings.database_url:
        return

    try:
        _insert_audit_row(record, settings.database_url)
    except Exception:
        logger.exception("ai_audit_db_insert_failed")


def _insert_audit_row(record: AiAuditRecord, dsn: str) -> None:
    import psycopg
    from psycopg.types.json import Json

    rid = str(uuid.uuid4())
    created = datetime.now(timezone.utc)
    req = _sanitize_payload(record.requestPayload)
    resp = _sanitize_payload(record.responsePayload)

    sql = """
        INSERT INTO "ai_request_log" (
            "id", "endpoint", "model", "promptTokens", "completionTokens", "totalTokens",
            "costUsd", "durationMs", "status", "errorMessage", "requestPayload", "responsePayload", "createdAt"
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    """

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(
                sql,
                (
                    rid,
                    record.endpoint,
                    record.model,
                    record.promptTokens,
                    record.completionTokens,
                    record.totalTokens,
                    record.costUsd,
                    record.durationMs,
                    record.status,
                    record.errorMessage,
                    Json(req) if req is not None else None,
                    Json(resp) if resp is not None else None,
                    created,
                ),
            )
        conn.commit()

from __future__ import annotations

from time import perf_counter
from typing import Any

from fastapi import APIRouter, HTTPException, Request

from app.config import Settings
from app.schemas.audit import AiAuditRecord, AuditSummary
from app.schemas.extraction import (
    ExtractListingRequest,
    ExtractListingResponse,
    ListingDraft,
    PropertyDraft,
)
from app.services.audit_log import emit_audit
from app.services.model_adapter import extract_listing_fixture

router = APIRouter(tags=["extraction"])


@router.post("/extract-listing", response_model=ExtractListingResponse)
def extract_listing(http_request: Request, body: ExtractListingRequest) -> ExtractListingResponse:
    settings: Settings = http_request.app.state.settings
    limiter = http_request.app.state.limiter
    client = http_request.client.host if http_request.client else "unknown"
    if not limiter.allow(client):
        raise HTTPException(status_code=429, detail="rate_limited")

    t0 = perf_counter()
    status = "success"
    err_msg: str | None = None
    raw: dict[str, Any] | None = None
    usage = None

    try:
        if not settings.fixture_mode and settings.use_llm():
            raise HTTPException(
                status_code=501,
                detail="Live LLM extraction is not implemented yet. Set AI_FIXTURE_MODE=true.",
            )
        raw, usage = extract_listing_fixture(body, settings)
        prop = PropertyDraft.model_validate(raw["property"])
        lst = ListingDraft.model_validate(raw["listing"])
        duration_ms = int((perf_counter() - t0) * 1000)

        audit_summary = AuditSummary(
            model=raw["model"],
            promptTokens=usage.prompt_tokens,
            completionTokens=usage.completion_tokens,
            totalTokens=usage.total,
            costUsd=0.0,
            durationMs=duration_ms,
            status=status,
        )

        response = ExtractListingResponse(
            confidence=raw["confidence"],
            requiresHumanReview=raw["requiresHumanReview"],
            duplicateOfMessageId=raw.get("duplicateOfMessageId"),
            model=raw["model"],
            property=prop,
            listing=lst,
            audit=audit_summary,
        )

        req_payload = body.model_dump(mode="json")
        resp_payload = response.model_dump(mode="json")
        emit_audit(
            AiAuditRecord(
                endpoint="/extract-listing",
                model=raw["model"],
                promptTokens=usage.prompt_tokens,
                completionTokens=usage.completion_tokens,
                totalTokens=usage.total,
                costUsd=0.0,
                durationMs=duration_ms,
                status=status,
                errorMessage=err_msg,
                requestPayload=req_payload,
                responsePayload=resp_payload,
            ),
            settings,
        )
        return response
    except HTTPException:
        duration_ms = int((perf_counter() - t0) * 1000)
        emit_audit(
            AiAuditRecord(
                endpoint="/extract-listing",
                model="n/a",
                promptTokens=0,
                completionTokens=0,
                totalTokens=0,
                costUsd=0.0,
                durationMs=duration_ms,
                status="error",
                errorMessage="http_exception",
                requestPayload=body.model_dump(mode="json"),
                responsePayload=None,
            ),
            settings,
        )
        raise

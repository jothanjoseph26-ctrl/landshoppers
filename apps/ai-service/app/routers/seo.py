from __future__ import annotations

from time import perf_counter

from fastapi import APIRouter, HTTPException, Request

from app.config import Settings
from app.schemas.audit import AiAuditRecord, AuditSummary
from app.schemas.seo import (
    GenerateSeoVariantsRequest,
    GenerateSeoVariantsResponse,
    SeoVariantDraft,
)
from app.services.audit_log import emit_audit
from app.services.model_adapter import generate_seo_fixture

router = APIRouter(tags=["seo"])


@router.post("/generate-seo-variants", response_model=GenerateSeoVariantsResponse)
def generate_seo_variants(http_request: Request, body: GenerateSeoVariantsRequest) -> GenerateSeoVariantsResponse:
    settings: Settings = http_request.app.state.settings
    limiter = http_request.app.state.limiter
    client = http_request.client.host if http_request.client else "unknown"
    if not limiter.allow(client):
        raise HTTPException(status_code=429, detail="rate_limited")

    t0 = perf_counter()
    if not settings.fixture_mode and settings.use_llm():
        raise HTTPException(
            status_code=501,
            detail="Live LLM SEO generation is not implemented yet. Set AI_FIXTURE_MODE=true.",
        )

    variants_raw, usage = generate_seo_fixture(body, settings)
    variants = [SeoVariantDraft.model_validate(v) for v in variants_raw]
    duration_ms = int((perf_counter() - t0) * 1000)

    audit_summary = AuditSummary(
        model="fixture-deterministic-v1",
        promptTokens=usage.prompt_tokens,
        completionTokens=usage.completion_tokens,
        totalTokens=usage.total,
        costUsd=0.0,
        durationMs=duration_ms,
        status="success",
    )

    response = GenerateSeoVariantsResponse(
        listingId=body.listingId,
        variants=variants,
        model="fixture-deterministic-v1",
        audit=audit_summary,
    )

    emit_audit(
        AiAuditRecord(
            endpoint="/generate-seo-variants",
            model="fixture-deterministic-v1",
            promptTokens=usage.prompt_tokens,
            completionTokens=usage.completion_tokens,
            totalTokens=usage.total,
            costUsd=0.0,
            durationMs=duration_ms,
            status="success",
            errorMessage=None,
            requestPayload=body.model_dump(mode="json"),
            responsePayload=response.model_dump(mode="json"),
        ),
        settings,
    )
    return response

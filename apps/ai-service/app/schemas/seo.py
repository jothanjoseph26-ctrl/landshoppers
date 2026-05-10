from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.audit import AuditSummary

# Mirrors `ListingSeoVariant.variantType` comment in Prisma schema.
SEO_VARIANT_TYPES: tuple[str, ...] = (
    "luxury",
    "investment",
    "family",
    "diaspora",
    "urgency",
    "social_x",
    "social_li",
    "social_fb",
    "whatsapp",
    "seo_long",
)


class GenerateSeoVariantsRequest(BaseModel):
    listingId: str = Field(..., min_length=1)
    listingTitle: str | None = None
    city: str | None = None
    state: str | None = None
    propertyType: str | None = None
    descriptionHint: str | None = None


class SeoVariantDraft(BaseModel):
    variantType: str
    seoTitle: str | None = Field(None, max_length=60)
    metaDescription: str | None = Field(None, max_length=160)
    hashtags: list[str] = Field(default_factory=list)
    fullCopy: str | None = None
    socialCaption: str | None = None
    tone: str | None = None
    targetAudience: str | None = None
    status: str = "draft"


class GenerateSeoVariantsResponse(BaseModel):
    listingId: str
    variants: list[SeoVariantDraft]
    model: str
    audit: AuditSummary

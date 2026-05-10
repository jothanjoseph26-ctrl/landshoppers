from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.audit import AuditSummary


class ExtractListingRequest(BaseModel):
    """Inbound payload from WhatsApp webhook pipeline (Agent 2 enqueues → worker calls this)."""

    rawMessageId: str | None = None
    messageId: str = Field(..., min_length=1)
    textContent: str | None = None
    mediaUrls: list[str] = Field(default_factory=list)
    senderPhone: str = Field(..., min_length=3)
    senderName: str | None = None
    groupId: str | None = None
    groupName: str | None = None


class PropertyDraft(BaseModel):
    """Draft rows compatible with `Property` + nested listing creation."""

    title: str
    slug: str
    description: str | None = None
    propertyType: str
    address: str | None = None
    city: str
    state: str
    country: str = "Nigeria"
    latitude: float | None = None
    longitude: float | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    toilets: int | None = None
    squareMeters: float | None = None


class ListingDraft(BaseModel):
    """Draft compatible with `Listing` when linked to property + user/agent."""

    price: int = Field(..., ge=0, description="NGN in kobo")
    priceNegotiable: bool = False
    isForSale: bool = True
    isForRent: bool = False
    rentPeriod: str | None = None
    status: str = "draft"


class ExtractListingResponse(BaseModel):
    confidence: float = Field(..., ge=0.0, le=1.0)
    requiresHumanReview: bool
    duplicateOfMessageId: str | None = None
    model: str
    property: PropertyDraft
    listing: ListingDraft
    audit: AuditSummary

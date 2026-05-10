from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass

from app.config import Settings
from app.schemas.extraction import ExtractListingRequest
from app.schemas.seo import GenerateSeoVariantsRequest, SEO_VARIANT_TYPES


@dataclass(frozen=True)
class TokenUsage:
    prompt_tokens: int
    completion_tokens: int

    @property
    def total(self) -> int:
        return self.prompt_tokens + self.completion_tokens


def estimate_tokens(text: str | None, completion_estimate: int) -> TokenUsage:
    base = text or ""
    return TokenUsage(max(1, len(base) // 4), max(1, completion_estimate))


_DUP_PREFIX = re.compile(r"^\s*DUPLICATE_REF:\s*([0-9a-fA-F-]{36})\s*", re.I)
_PRICE_KOBO = re.compile(
    r"(?:₦|NGN|naira)\s*([\d]{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:m|million)?",
    re.I,
)
_PRICE_K_SIMPLE = re.compile(r"\b(\d+)\s*m\b", re.I)


def _slugify(title: str) -> str:
    s = title.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[-\s]+", "-", s).strip("-")
    return (s or "listing")[:96]


def _parse_price_kobo(text: str | None) -> int:
    """Return listing price in kobo (best effort). Default ≈ ₦50M if unknown."""
    if not text:
        return 5_000_000_000  # ₦50,000,000 → 5e9 kobo
    # Framework: price BigInt in kobo. ₦50,000,000 → 50_000_000 * 100 = 5_000_000_000 kobo
    m = _PRICE_KOBO.search(text)
    if m:
        raw = m.group(1).replace(",", "")
        try:
            val = float(raw)
            if "million" in text.lower() or (m.group(0).lower().endswith("m") and val < 1000):
                ngn = val * 1_000_000
            elif val > 1000:  # assume full naira amount
                ngn = val
            else:
                ngn = val * 1_000_000
            return int(ngn * 100)
        except ValueError:
            pass
    m2 = _PRICE_K_SIMPLE.search(text)
    if m2:
        millions = float(m2.group(1))
        ngn = millions * 1_000_000
        return int(ngn * 100)
    return 5_000_000_000  # ₦50M default


def extract_listing_fixture(req: ExtractListingRequest, settings: Settings) -> tuple[dict, TokenUsage]:
    """
    Deterministic extraction for tests and local dev.
    When `settings.use_llm()` is True but no HTTP adapter is wired, callers should error before this.
    """
    text = req.textContent or ""
    usage = estimate_tokens(text, 420)

    dup = _DUP_PREFIX.match(text)
    duplicate_id = dup.group(1) if dup else None

    city = "Lagos"
    state = "Lagos"
    if "abuja" in text.lower():
        city = "Abuja"
        state = "FCT"
    elif "port harcourt" in text.lower():
        city = "Port Harcourt"
        state = "Rivers"

    title_seed = text.strip()[:120] if text.strip() else "New listing from WhatsApp"
    title = title_seed if len(title_seed) > 12 else "3-bedroom apartment — Lekki Phase 1"
    slug_base = _slugify(title)
    h = hashlib.sha256(f"{req.messageId}:{slug_base}".encode()).hexdigest()[:8]
    slug = f"{slug_base}-{h}"

    confidence = 0.86
    if len(text) < 40:
        confidence = 0.38
    if duplicate_id:
        confidence = 0.97

    requires_human = confidence < 0.55 or (confidence < 0.75 and "uncertain" in text.lower())

    price_kobo = _parse_price_kobo(text)

    property_doc = {
        "title": title,
        "slug": slug,
        "description": text[:2000] if text else None,
        "propertyType": "apartment",
        "address": None,
        "city": city,
        "state": state,
        "country": "Nigeria",
        "latitude": 6.4281,
        "longitude": 3.4219,
        "bedrooms": 3,
        "bathrooms": 3,
        "toilets": 4,
        "squareMeters": 180.0,
    }

    listing_doc = {
        "price": price_kobo,
        "priceNegotiable": True,
        "isForSale": True,
        "isForRent": False,
        "rentPeriod": None,
        "status": "draft",
    }

    out = {
        "confidence": confidence,
        "requiresHumanReview": requires_human,
        "duplicateOfMessageId": duplicate_id,
        "model": "fixture-deterministic-v1",
        "property": property_doc,
        "listing": listing_doc,
    }
    return out, usage


def generate_seo_fixture(
    req: GenerateSeoVariantsRequest, settings: Settings
) -> tuple[list[dict], TokenUsage]:
    hint = " ".join(
        x
        for x in [req.listingTitle, req.city, req.state, req.propertyType, req.descriptionHint]
        if x
    )
    usage = estimate_tokens(hint, 1200)
    base_title = req.listingTitle or "Premium property listing"
    variants: list[dict] = []
    for vt in SEO_VARIANT_TYPES:
        variants.append(
            {
                "variantType": vt,
                "seoTitle": f"{base_title[:45]} — {vt.replace('_', ' ')}"[:60],
                "metaDescription": (
                    f"{base_title} in {req.city or 'Nigeria'} — optimized for {vt} audience."
                )[:160],
                "hashtags": ["#LandShoppers", f"#{req.city or 'Nigeria'}", "#RealEstate"],
                "fullCopy": f"Long-form SEO narrative for variant `{vt}` based on: {hint[:400]}".strip(),
                "socialCaption": f"{base_title[:100]} — Learn more on LandShoppers.",
                "tone": "professional",
                "targetAudience": vt,
                "status": "draft",
            }
        )
    return variants, usage

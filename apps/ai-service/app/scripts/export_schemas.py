"""Emit JSON Schema files for sharing with Node apps (pnpm run schemas:export)."""

from __future__ import annotations

import json
from pathlib import Path

from app.schemas.audit import AiAuditRecord
from app.schemas.extraction import ExtractListingRequest, ExtractListingResponse
from app.schemas.seo import GenerateSeoVariantsRequest, GenerateSeoVariantsResponse


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    out_dir = root / "schemas" / "json"
    out_dir.mkdir(parents=True, exist_ok=True)

    pairs = [
        ("extract-listing.request.json", ExtractListingRequest),
        ("extract-listing.response.json", ExtractListingResponse),
        ("generate-seo-variants.request.json", GenerateSeoVariantsRequest),
        ("generate-seo-variants.response.json", GenerateSeoVariantsResponse),
        ("ai-audit.record.json", AiAuditRecord),
    ]

    for name, model in pairs:
        path = out_dir / name
        schema = model.model_json_schema()
        path.write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {path.relative_to(root)}")


if __name__ == "__main__":
    main()

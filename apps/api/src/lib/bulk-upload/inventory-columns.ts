import type { BulkInventoryField } from "../../contracts/developer-bulk-upload.js";
import { BULK_INVENTORY_FIELDS } from "../../contracts/developer-bulk-upload.js";

const HEADER_ALIASES: Record<BulkInventoryField, string[]> = {
  unitName: ["unitname", "unit_name", "plot", "plot_no", "plotno", "name", "title"],
  unitType: ["unittype", "unit_type", "type", "category"],
  bedrooms: ["bedrooms", "beds", "br"],
  bathrooms: ["bathrooms", "baths", "ba"],
  toilets: ["toilets", "wc"],
  squareMeters: ["squaremeters", "square_meters", "sqm", "sq_m", "area_sqm"],
  priceKobo: ["pricekobo", "price_kobo", "kobo", "amount_kobo"],
  status: ["status", "unit_status", "availability"],
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/** Map normalized token → canonical field (exact key names). */
function fieldForNormalizedToken(token: string): BulkInventoryField | null {
  for (const field of BULK_INVENTORY_FIELDS) {
    if (token === field) return field;
    const aliases = HEADER_ALIASES[field];
    if (aliases.includes(token)) return field;
  }
  return null;
}

export function suggestColumnMap(headers: string[]): Record<BulkInventoryField, string | null> {
  const out = {} as Record<BulkInventoryField, string | null>;
  for (const f of BULK_INVENTORY_FIELDS) out[f] = null;

  const usedCsv = new Set<string>();
  for (const raw of headers) {
    const token = normalizeHeader(raw);
    const field = fieldForNormalizedToken(token);
    if (!field || out[field] !== null) continue;
    out[field] = raw;
    usedCsv.add(raw);
  }

  for (const raw of headers) {
    const token = normalizeHeader(raw);
    const field = fieldForNormalizedToken(token);
    if (!field) continue;
    if (out[field] === null && !usedCsv.has(raw)) {
      out[field] = raw;
      usedCsv.add(raw);
    }
  }

  return out;
}

export function mergeColumnMap(
  base: Record<BulkInventoryField, string | null>,
  patch: Partial<Record<BulkInventoryField, string | null>>,
): Record<BulkInventoryField, string | null> {
  const next = { ...base };
  for (const key of BULK_INVENTORY_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      const v = patch[key];
      next[key] = v === undefined ? next[key] : v;
    }
  }
  return next;
}

export function isColumnMapComplete(map: Record<BulkInventoryField, string | null>): boolean {
  return map.unitName !== null && map.priceKobo !== null;
}

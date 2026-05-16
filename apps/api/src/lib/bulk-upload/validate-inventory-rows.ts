import { UnitStatus } from "@landshoppers/db";

import type { BulkInventoryField } from "../../contracts/developer-bulk-upload.js";

export type InventoryPayload = Record<string, string | number | null>;

export type ValidatedInventoryRow = {
  rowIndex: number;
  payload: InventoryPayload;
  errors: string[];
  warnings: string[];
};

function cellAt(
  row: string[],
  headerRow: string[],
  csvHeader: string | null,
): string | null {
  if (!csvHeader) return null;
  const idx = headerRow.indexOf(csvHeader);
  if (idx < 0 || idx >= row.length) return null;
  const v = row[idx]?.trim();
  return v === undefined || v === "" ? null : v;
}

function parseOptionalInt(raw: string | null, label: string): { value: number | null; error?: string } {
  if (raw === null) return { value: null };
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return { value: null, error: `${label} must be a whole number` };
  if (n < 0) return { value: null, error: `${label} cannot be negative` };
  return { value: n };
}

function parseOptionalFloat(raw: string | null, label: string): { value: number | null; error?: string } {
  if (raw === null) return { value: null };
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return { value: null, error: `${label} must be a number` };
  if (n < 0) return { value: null, error: `${label} cannot be negative` };
  return { value: n };
}

function parsePriceKobo(raw: string | null): { value: bigint | null; error?: string } {
  if (raw === null) return { value: null, error: "priceKobo is required" };
  const cleaned = raw.replace(/[,_\s]/g, "");
  if (!/^\d+$/.test(cleaned)) {
    return { value: null, error: "priceKobo must be digits only (kobo, not naira decimals)" };
  }
  try {
    const v = BigInt(cleaned);
    if (v <= 0n) return { value: null, error: "priceKobo must be greater than zero" };
    return { value: v };
  } catch {
    return { value: null, error: "priceKobo is too large or invalid" };
  }
}

function parseStatus(raw: string | null): { value: UnitStatus; warning?: string } {
  if (raw === null) return { value: UnitStatus.available };
  const t = raw.trim().toLowerCase();
  if (t === "" || t === "available" || t === "avail") return { value: UnitStatus.available };
  if (t === "reserved" || t === "reservation") return { value: UnitStatus.reserved };
  if (t === "sold" || t === "closed") return { value: UnitStatus.sold };
  return { value: UnitStatus.available, warning: `Unknown status "${raw}" — defaulting to available` };
}

export function validateInventoryTable(args: {
  headerRow: string[];
  dataRows: string[][];
  columnMap: Record<BulkInventoryField, string | null>;
}): ValidatedInventoryRow[] {
  const { headerRow, dataRows, columnMap } = args;
  const out: ValidatedInventoryRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]!;
    const rowIndex = i + 1;
    const errors: string[] = [];
    const warnings: string[] = [];

    const unitNameRaw = cellAt(row, headerRow, columnMap.unitName);
    const unitName = unitNameRaw?.trim() ?? "";
    if (!unitName) errors.push("unitName is required");

    const unitTypeRaw = cellAt(row, headerRow, columnMap.unitType);
    const unitType = (unitTypeRaw?.trim() || "Plot").slice(0, 200);

    const br = parseOptionalInt(cellAt(row, headerRow, columnMap.bedrooms), "bedrooms");
    if (br.error) errors.push(br.error);

    const ba = parseOptionalInt(cellAt(row, headerRow, columnMap.bathrooms), "bathrooms");
    if (ba.error) errors.push(ba.error);

    const toi = parseOptionalInt(cellAt(row, headerRow, columnMap.toilets), "toilets");
    if (toi.error) errors.push(toi.error);

    const sq = parseOptionalFloat(cellAt(row, headerRow, columnMap.squareMeters), "squareMeters");
    if (sq.error) errors.push(sq.error);

    const pk = parsePriceKobo(cellAt(row, headerRow, columnMap.priceKobo));
    if (pk.error) errors.push(pk.error);

    const st = parseStatus(cellAt(row, headerRow, columnMap.status));
    if (st.warning) warnings.push(st.warning);

    const payload: InventoryPayload = {
      unitName: unitName || null,
      unitType,
      bedrooms: br.value,
      bathrooms: ba.value,
      toilets: toi.value,
      squareMeters: sq.value,
      priceKobo: pk.value !== null && pk.value !== undefined ? pk.value.toString() : null,
      status: st.value,
    };

    out.push({ rowIndex, payload, errors, warnings });
  }

  return out;
}

export function validateColumnMapHeaders(
  headerRow: string[],
  columnMap: Record<BulkInventoryField, string | null>,
): string[] {
  const errors: string[] = [];
  for (const f of Object.keys(columnMap) as BulkInventoryField[]) {
    const h = columnMap[f];
    if (h && !headerRow.includes(h)) {
      errors.push(`columnMap.${String(f)} references missing header "${h}"`);
    }
  }
  return errors;
}

export function deriveUploadStatus(
  columnMap: Record<BulkInventoryField, string | null>,
  rows: ValidatedInventoryRow[],
  mapHeaderErrors: string[],
): "mapping" | "validating" | "ready" {
  if (mapHeaderErrors.length > 0) return "mapping";
  if (columnMap.unitName === null || columnMap.priceKobo === null) return "mapping";
  if (rows.some((r) => r.errors.length > 0)) return "validating";
  return "ready";
}

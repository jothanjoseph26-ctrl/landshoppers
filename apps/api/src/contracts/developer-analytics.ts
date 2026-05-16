import { z } from "zod";

const uuid = z.string().uuid();

/** Coerce repeated `projectIds` query params to an array of UUIDs. */
function toUuidArray(val: unknown): string[] | undefined {
  if (val === undefined || val === "") return undefined;
  let raw: string[];
  if (Array.isArray(val)) raw = val.flatMap((v) => (typeof v === "string" ? v.split(",") : [])).filter(Boolean);
  else if (typeof val === "string") raw = val.split(",").map((s) => s.trim()).filter(Boolean);
  else return undefined;
  if (raw.length === 0) return undefined;
  return raw;
}

export const analyticsSummaryQuerySchema = z.object({
  period: z.enum(["week", "month", "quarter", "all"]).default("month"),
  projectIds: z.preprocess(toUuidArray, z.array(uuid).max(50).optional()),
});

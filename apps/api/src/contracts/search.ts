import { z } from "zod";

import { paginationQuerySchema } from "./common.js";

const bigintFromQuery = z
  .string()
  .regex(/^\d+$/, "Must be a non-negative integer string")
  .transform((s) => BigInt(s));

/** GET /v1/search — Prisma-backed MVP; OpenSearch sync comes later. */
export const searchQuerySchema = paginationQuerySchema.extend({
  q: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(120).optional(),
  state: z.string().min(1).max(120).optional(),
  minPrice: bigintFromQuery.optional(),
  maxPrice: bigintFromQuery.optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(500).optional(),
}).superRefine((val, ctx) => {
  const geoCount = [val.lat, val.lng, val.radiusKm].filter((x) => x !== undefined).length;
  if (geoCount !== 0 && geoCount !== 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "lat, lng, and radiusKm must all be provided for geo search",
    });
  }
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
